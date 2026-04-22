const { postgres } = require('postgres');
require('dotenv').config();

const connectionString = "postgresql://neondb_owner:npg_GFrHRxfJ8tI3@ep-muddy-recipe-ajlg6z5d-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = require('postgres')(connectionString);

async function finalDefinitiveFix() {
  console.log("FINAL DEFINITIVE MIGRATION...");

  try {
    // 1. Convert to NUMERIC
    await sql`ALTER TABLE awbs ALTER COLUMN chargeable_weight TYPE NUMERIC USING NULLIF(TRIM(CAST(chargeable_weight AS TEXT)), '')::NUMERIC`;
    console.log("SUCCESS: Column is now NUMERIC.");

    // 2. Final verification
    const res = await sql`SELECT SUM(chargeable_weight) as total FROM awbs`;
    console.log("-----------------------------------------");
    console.log("DASHBOARD TOTAL (KG):", res[0].total);
    console.log("DASHBOARD TOTAL (MT):", (parseFloat(res[0].total) / 1000).toFixed(2));
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("MIGRATION_FAILED:", error);
  } finally {
    await sql.end();
  }
}

finalDefinitiveFix();
