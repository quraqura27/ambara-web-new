const { postgres } = require('postgres');
require('dotenv').config();

const connectionString = "postgresql://neondb_owner:npg_GFrHRxfJ8tI3@ep-muddy-recipe-ajlg6z5d-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = require('postgres')(connectionString);

async function finalFix() {
  console.log("Surgical Migration: chargeable_weight -> NUMERIC...");

  try {
    // 1. Surgical conversion using Postgres regex
    await sql`
      ALTER TABLE awbs 
      ALTER COLUMN chargeable_weight TYPE NUMERIC 
      USING NULLIF(regexp_replace(chargeable_weight, '[^0-9.]', '', 'g'), '')::NUMERIC
    `;
    console.log("SUCCESS: Column is now NUMERIC.");

    // 2. Final PROOF
    const res = await sql`SELECT SUM(chargeable_weight) as total FROM awbs`;
    console.log("-----------------------------------------");
    console.log("PROVED_TOTAL_VOLUME (KG):", res[0].total);
    console.log("PROVED_TOTAL_VOLUME (MT):", (parseFloat(res[0].total) / 1000).toFixed(2));
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("SURGICAL_FIX_FAILED:", error);
  } finally {
    await sql.end();
  }
}

finalFix();
