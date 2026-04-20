const { neon } = require('@neondatabase/serverless');

async function run() {
  const url = "postgresql://neondb_owner:npg_GFrHRxfJ8tI3@ep-muddy-recipe-ajlg6z5d-pooler.c-3.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
  const sql = neon(url);

  console.log("--- SYSTEM TABLE AUDIT ---");
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log("Existing Tables:", tables.map(t => t.table_name));

  for (const table of tables) {
    const tableName = table.table_name;
    try {
      const countResult = await sql(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`Table [${tableName}] count:`, countResult[0].count);
    } catch (e) {
      console.log(`Failed to count [${tableName}]:`, e.message);
    }
  }

  console.log("\n--- CUSTOMER DATA SAMPLE ---");
  try {
    const sample = await sql`SELECT * FROM customers LIMIT 2`;
    console.log(JSON.stringify(sample, null, 2));
  } catch (e) {
    console.log("Error fetching customers:", e.message);
  }
}

run().catch(console.error);
