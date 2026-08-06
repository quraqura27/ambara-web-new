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
const migration007Columns = [
  ["shipments", "awb_airline_prefix"],
  ["shipments", "awb_airline_name"],
  ["shipments", "awb_airline_unresolved"],
  ["shipment_flight_legs", "shipment_id"],
  ["shipment_flight_legs", "sequence"],
  ["shipment_flight_legs", "airline_designator"],
  ["shipment_flight_legs", "flight_number"],
  ["shipment_flight_legs", "operational_suffix"],
  ["shipment_flight_legs", "airline_name"],
  ["shipment_flight_legs", "airline_unresolved"],
];
const migration007Tables = ["shipment_flight_legs"];
const migration007Indexes = [
  "shipments_awb_airline_prefix_idx",
  "shipment_flight_legs_shipment_sequence_unique_idx",
  "shipment_flight_legs_shipment_idx",
  "shipment_flight_legs_designator_idx",
];
const migration008Columns = [
  ["mawb_documents", "idempotency_key"],
  ["mawb_documents", "mawb_number"],
  ["mawb_documents", "awb_prefix"],
  ["mawb_documents", "awb_serial"],
  ["mawb_documents", "carrier_code"],
  ["mawb_documents", "carrier_name"],
  ["mawb_documents", "action_mode"],
  ["mawb_documents", "service_type"],
  ["mawb_documents", "agent_name"],
  ["mawb_documents", "shipper_name"],
  ["mawb_documents", "shipper_address"],
  ["mawb_documents", "consignee_name"],
  ["mawb_documents", "consignee_address"],
  ["mawb_documents", "shipment_customer_id"],
  ["mawb_documents", "shipment_customer_name"],
  ["mawb_documents", "shipment_contact_phone"],
  ["mawb_documents", "departure_airport"],
  ["mawb_documents", "origin_iata"],
  ["mawb_documents", "destination_airport"],
  ["mawb_documents", "destination_iata"],
  ["mawb_documents", "routing_to_1"],
  ["mawb_documents", "routing_by_1"],
  ["mawb_documents", "routing_to_2"],
  ["mawb_documents", "routing_by_2"],
  ["mawb_documents", "flight_number"],
  ["mawb_documents", "flight_date"],
  ["mawb_documents", "executed_date"],
  ["mawb_documents", "executed_place"],
  ["mawb_documents", "currency"],
  ["mawb_documents", "declared_value_for_carriage"],
  ["mawb_documents", "declared_value_for_customs"],
  ["mawb_documents", "insurance_amount"],
  ["mawb_documents", "pieces"],
  ["mawb_documents", "gross_weight"],
  ["mawb_documents", "chargeable_weight"],
  ["mawb_documents", "rate"],
  ["mawb_documents", "weight_charge"],
  ["mawb_documents", "other_charges_total"],
  ["mawb_documents", "total_prepaid"],
  ["mawb_documents", "other_charges_json"],
  ["mawb_documents", "commodity"],
  ["mawb_documents", "goods_description"],
  ["mawb_documents", "handling_information"],
  ["mawb_documents", "nature_quantity"],
  ["mawb_documents", "created_by_staff"],
  ["mawb_documents", "updated_by_staff"],
  ["mawb_shipment_links", "mawb_document_id"],
  ["mawb_shipment_links", "shipment_id"],
  ["mawb_shipment_links", "link_mode"],
  ["mawb_shipment_links", "copied_fields_json"],
  ["mawb_shipment_links", "created_by_staff"],
];
const migration008Tables = ["mawb_documents", "mawb_shipment_links"];
const migration008Indexes = [
  "mawb_documents_mawb_number_idx",
  "mawb_documents_created_at_idx",
  "mawb_documents_idempotency_key_unique_idx",
  "mawb_shipment_links_document_idx",
  "mawb_shipment_links_shipment_idx",
  "mawb_shipment_links_unique_idx",
];
const migration009Columns = [
  ["invoice_sequences", "year"],
  ["invoice_sequences", "last_value"],
  ["invoice_sequences", "updated_at"],
  ["invoices", "customer_code"],
  ["invoices", "customer_name_snapshot"],
  ["invoices", "customer_address_snapshot"],
  ["invoices", "customer_npwp_snapshot"],
  ["invoices", "vat_rate"],
  ["invoices", "pph_enabled"],
  ["invoices", "pph_rate"],
  ["invoices", "pph_base_amount"],
  ["invoices", "pph_amount"],
  ["invoices", "net_payable"],
  ["invoices", "status"],
  ["invoices", "verification_token"],
  ["invoices", "verification_checksum"],
  ["invoices", "withholding_proof_ref"],
];
const migration009Tables = ["invoice_sequences"];
const migration009Indexes = [
  "invoices_status_idx",
  "invoices_verification_token_unique_idx",
  "invoice_line_items_invoice_idx",
  "invoice_deductions_invoice_idx",
];
const migration014Columns = [
  ["shipments", "voided_at"],
  ["shipments", "voided_by"],
  ["shipments", "void_reason"],
  ["shipments", "void_note"],
  ["shipments", "previous_status"],
  ["shipments", "restored_at"],
  ["shipments", "restored_by"],
  ["shipments", "restore_reason"],
];
const migration014Indexes = ["shipments_voided_at_idx"];
const migration015Columns = [
  ["staff_accounts", "session_version"],
  ["customers", "session_version"],
  ["customers", "archived_at"],
  ["customers", "archived_by"],
  ["shipments", "operational_stage"],
  ["shipments", "hs_code"],
  ["shipments", "incoterm"],
  ["shipments", "clearance_mode"],
  ["shipments", "cargo_risks"],
  ["shipments", "document_readiness"],
  ["shipments", "assigned_to"],
  ["shipments", "blocker"],
  ["shipments", "next_action"],
  ["shipments", "action_due_at"],
  ["shipments", "sla_due_at"],
  ["shipments", "volumetric_weight_kg"],
  ["shipments", "customs_review_required"],
  ["shipments", "regulated_cargo"],
  ["shipments", "readiness_updated_at"],
  ["shipments", "readiness_updated_by"],
  ["quote_requests", "assigned_to"],
  ["quote_requests", "next_action"],
  ["quote_requests", "due_at"],
  ["quote_requests", "internal_notes"],
  ["quote_requests", "updated_at"],
  ["documents", "mime_type"],
  ["documents", "checksum_sha256"],
  ["documents", "version"],
  ["documents", "supersedes_document_id"],
  ["documents", "status"],
  ["documents", "note"],
  ["documents", "archived_at"],
  ["documents", "archived_by"],
];
const migration015Tables = [
  "portal_login_attempts",
  "shipment_packages",
  "shipment_operational_tasks",
  "quote_requests",
  "documents",
];
const migration015Indexes = [
  "customers_archived_at_idx",
  "portal_login_attempts_blocked_idx",
  "shipments_operational_queue_idx",
  "shipments_document_readiness_idx",
  "shipment_packages_shipment_number_unique_idx",
  "shipment_packages_shipment_idx",
  "shipment_operational_tasks_queue_idx",
  "shipment_operational_tasks_shipment_idx",
  "shipment_operational_tasks_owner_idx",
  "quote_requests_reference_unique_idx",
  "quote_requests_queue_idx",
  "documents_shipment_type_version_unique_idx",
  "documents_shipment_status_idx",
];
const migration016Columns = [
  ["invoices", "format_version"],
  ["invoice_line_items", "billing_basis"],
  ["invoice_line_items", "reference"],
];
const migration017Columns = [
  ["invoice_payments", "invoice_id"],
  ["invoice_payments", "amount"],
  ["invoice_payments", "payment_date"],
  ["invoice_payments", "reference"],
  ["invoice_payments", "note"],
  ["invoice_payments", "recorded_by"],
  ["invoice_payments", "source"],
  ["invoice_payments", "created_at"],
  ["invoice_payments", "voided_at"],
  ["invoice_payments", "voided_by"],
  ["invoice_payments", "void_reason"],
];
const migration017Tables = ["invoice_payments"];
const migration017Indexes = [
  "invoice_payments_invoice_date_idx",
  "invoice_payments_active_invoice_idx",
  "invoice_payments_legacy_invoice_unique_idx",
];
const migration020Columns = [
  ["crm_teams", "manager_id"],
  ["crm_team_members", "staff_account_id"],
  ["crm_companies", "legacy_customer_id"],
  ["crm_companies", "normalized_name"],
  ["crm_companies", "owner_id"],
  ["crm_company_roles", "role"],
  ["crm_contacts", "company_id"],
  ["crm_contacts", "owner_id"],
  ["crm_leads", "source_quote_request_id"],
  ["crm_leads", "priority"],
  ["crm_leads", "owner_id"],
  ["crm_opportunities", "stage"],
  ["crm_opportunities", "external_quotation_reference"],
  ["crm_opportunities", "external_quotation_url"],
  ["crm_opportunities", "owner_id"],
  ["crm_activities", "activity_type"],
  ["crm_activity_links", "entity_type"],
  ["crm_activity_links", "entity_id"],
  ["crm_tasks", "status"],
  ["crm_tasks", "entity_type"],
  ["crm_tasks", "entity_id"],
];
const migration020Tables = [
  "crm_teams",
  "crm_team_members",
  "crm_companies",
  "crm_company_roles",
  "crm_contacts",
  "crm_leads",
  "crm_opportunities",
  "crm_activities",
  "crm_activity_links",
  "crm_tasks",
];
const migration020Indexes = [
  "crm_teams_active_name_unique_idx",
  "crm_team_members_active_unique_idx",
  "crm_team_members_staff_idx",
  "crm_companies_legacy_customer_unique_idx",
  "crm_companies_normalized_name_idx",
  "crm_companies_active_name_country_unique_idx",
  "crm_companies_active_tax_id_unique_idx",
  "crm_companies_active_nib_unique_idx",
  "crm_companies_owner_idx",
  "crm_companies_team_idx",
  "crm_contacts_company_idx",
  "crm_contacts_owner_idx",
  "crm_contacts_active_company_email_unique_idx",
  "crm_contacts_active_company_phone_unique_idx",
  "crm_contacts_active_company_whatsapp_unique_idx",
  "crm_contacts_active_primary_company_unique_idx",
  "crm_leads_source_quote_request_unique_idx",
  "crm_leads_queue_idx",
  "crm_leads_owner_idx",
  "crm_leads_team_idx",
  "crm_opportunities_pipeline_idx",
  "crm_opportunities_owner_idx",
  "crm_opportunities_team_idx",
  "crm_opportunities_lead_unique_idx",
  "crm_activities_timeline_idx",
  "crm_activity_links_active_unique_idx",
  "crm_activity_links_entity_idx",
  "crm_tasks_queue_idx",
  "crm_tasks_owner_idx",
  "crm_tasks_team_idx",
  "crm_tasks_entity_idx",
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

async function missingSchemaObjects(sql, expected) {
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
    ...expected.columns
      .map(([table, column]) => `${table}.${column}`)
      .filter((name) => !columnNames.has(name)),
    ...expected.tables.filter((name) => !tableNames.has(name)).map((name) => `table:${name}`),
    ...expected.indexes.filter((name) => !indexNames.has(name)).map((name) => `index:${name}`),
  ];
}

async function migrationMissingObjects(sql, name) {
  if (name.startsWith("006-")) {
    return migration006MissingObjects(sql);
  }

  if (name.startsWith("007-")) {
    return missingSchemaObjects(sql, {
      columns: migration007Columns,
      tables: migration007Tables,
      indexes: migration007Indexes,
    });
  }

  if (name.startsWith("008-")) {
    return missingSchemaObjects(sql, {
      columns: migration008Columns,
      tables: migration008Tables,
      indexes: migration008Indexes,
    });
  }

  if (name.startsWith("009-")) {
    return missingSchemaObjects(sql, {
      columns: migration009Columns,
      tables: migration009Tables,
      indexes: migration009Indexes,
    });
  }

  if (name.startsWith("014-")) {
    return missingSchemaObjects(sql, {
      columns: migration014Columns,
      tables: [],
      indexes: migration014Indexes,
    });
  }

  if (name.startsWith("015-")) {
    return missingSchemaObjects(sql, {
      columns: migration015Columns,
      tables: migration015Tables,
      indexes: migration015Indexes,
    });
  }

  if (name.startsWith("016-")) {
    return missingSchemaObjects(sql, {
      columns: migration016Columns,
      tables: [],
      indexes: [],
    });
  }

  if (name.startsWith("017-")) {
    return missingSchemaObjects(sql, {
      columns: migration017Columns,
      tables: migration017Tables,
      indexes: migration017Indexes,
    });
  }

  if (name.startsWith("020-")) {
    return missingSchemaObjects(sql, {
      columns: migration020Columns,
      tables: migration020Tables,
      indexes: migration020Indexes,
    });
  }

  return [];
}

function hasSchemaObjectCheck(name) {
  return ["006-", "007-", "008-", "009-", "014-", "015-", "016-", "017-", "020-"].some((prefix) =>
    name.startsWith(prefix),
  );
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

      const missingBefore = await migrationMissingObjects(sql, name);

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

      if (hasSchemaObjectCheck(name) && missingBefore.length === 0) {
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

      if (hasSchemaObjectCheck(name)) {
        const missingAfter = await migrationMissingObjects(sql, name);
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
