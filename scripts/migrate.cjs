const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const dotenv = require("dotenv");
const postgres = require("postgres");

const projectRoot = path.resolve(__dirname, "..");
const migrationDirectory = path.join(projectRoot, "migrations");
const checkOnly = process.argv.includes("--check");
const firstManagedMigration = "006";

const migration006Columns = [
  ["shipments", "idempotency_key"],
  ["shipments", "unlinked_reason"],
  ["tracking_events", "corrected_event_id"],
  ["tracking_events", "correction_reason"],
  ["bulk_shipment_import_jobs", "idempotency_key"],
  ["bulk_update_jobs", "idempotency_key"],
];
const migration006Tables = ["portal_audit_logs", "portal_ux_events"];
const migration006Indexes = [
  "shipments_idempotency_key_unique_idx",
  "bulk_shipment_import_jobs_idempotency_unique_idx",
  "bulk_update_jobs_idempotency_unique_idx",
  "portal_audit_logs_entity_idx",
  "portal_audit_logs_user_idx",
  "portal_ux_events_name_idx",
  "portal_ux_events_user_idx",
];

function checksum(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

function managedMigrationFiles() {
  return fs
    .readdirSync(migrationDirectory)
    .filter((name) => /^\d{3}-.*\.sql$/.test(name) && name.slice(0, 3) >= firstManagedMigration)
    .sort();
}

async function migration006MissingObjects(sql) {
  const columns = await sql`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
  `;
  const tables = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
  `;
  const indexes = await sql`
    select indexname
    from pg_indexes
    where schemaname = 'public'
  `;
  const columnNames = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
  const tableNames = new Set(tables.map((row) => row.table_name));
  const indexNames = new Set(indexes.map((row) => row.indexname));

  return [
    ...migration006Columns
      .map(([table, column]) => `${table}.${column}`)
      .filter((name) => !columnNames.has(name)),
    ...migration006Tables.filter((name) => !tableNames.has(name)).map((name) => `table:${name}`),
    ...migration006Indexes.filter((name) => !indexNames.has(name)).map((name) => `index:${name}`),
  ];
}

async function ensureHistoryTable(sql) {
  if (checkOnly) {
    const [result] = await sql`
      select to_regclass('public.schema_migrations') is not null as exists
    `;
    if (!result?.exists) {
      throw new Error("Migration history is missing. Run npm run migrate before deployment.");
    }
    return;
  }

  await sql`
    create table if not exists schema_migrations (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `;
}

async function run() {
  dotenv.config({
    path: path.join(projectRoot, ".env.local"),
    override: false,
    quiet: true,
  });
  const connectionString =
    process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED;
  if (!connectionString) {
    throw new Error(
      "NETLIFY_DATABASE_URL or NETLIFY_DATABASE_URL_UNPOOLED is required for migrations.",
    );
  }

  const sql = postgres(connectionString, {
    connect_timeout: 20,
    idle_timeout: 2,
    max: 1,
    onnotice: () => {},
  });

  try {
    await ensureHistoryTable(sql);

    for (const name of managedMigrationFiles()) {
      const contents = fs.readFileSync(path.join(migrationDirectory, name), "utf8");
      const fileChecksum = checksum(contents);
      const [recorded] = await sql`
        select checksum
        from schema_migrations
        where name = ${name}
      `;

      if (recorded && recorded.checksum !== fileChecksum) {
        throw new Error(`Applied migration ${name} no longer matches its recorded checksum.`);
      }

      const missingBefore =
        name.startsWith("006-") ? await migration006MissingObjects(sql) : [];

      if (recorded) {
        if (missingBefore.length > 0) {
          throw new Error(
            `Migration ${name} is recorded but schema objects are missing: ${missingBefore.join(", ")}`,
          );
        }
        console.log(`Migration ${name}: verified`);
        continue;
      }

      if (checkOnly) {
        throw new Error(`Migration ${name} has not been applied.`);
      }

      if (name.startsWith("006-") && missingBefore.length === 0) {
        await sql`
          insert into schema_migrations (name, checksum)
          values (${name}, ${fileChecksum})
        `;
        console.log(`Migration ${name}: verified existing schema and recorded history`);
        continue;
      }

      await sql.begin(async (transaction) => {
        await transaction.unsafe(contents);
        await transaction`
          insert into schema_migrations (name, checksum)
          values (${name}, ${fileChecksum})
        `;
      });

      if (name.startsWith("006-")) {
        const missingAfter = await migration006MissingObjects(sql);
        if (missingAfter.length > 0) {
          throw new Error(
            `Migration ${name} did not create required objects: ${missingAfter.join(", ")}`,
          );
        }
      }

      console.log(`Migration ${name}: applied`);
    }
  } finally {
    await sql.end({ timeout: 2 });
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
