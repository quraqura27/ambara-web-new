const { postgres } = require('postgres');
require('dotenv').config();

const connectionString = "postgresql://neondb_owner:npg_GFrHRxfJ8tI3@ep-muddy-recipe-ajlg6z5d-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = require('postgres')(connectionString);

async function cleanAndFix() {
  console.log("Cleaning and Migrating chargeable_weight...");

  try {
    // 1. Find invalid values
    const invalid = await sql`SELECT id, chargeable_weight FROM awbs WHERE chargeable_weight !~ '^[0-9.]+$'`;
    console.log("INVALID RECORDS FOUND:", invalid.length);

    for (const r of invalid) {
      console.log(`Fixing Record ${r.id}: "${r.chargeable_weight}"`);
      // Strip everything except numbers and dots
      const clean = r.chargeable_weight.replace(/[^0-9.]/g, '');
      await sql`UPDATE awbs SET chargeable_weight = ${clean || '0'} WHERE id = ${r.id}`;
    }

    // 2. Now migrate to NUMERIC
    console.log("Applying ALTER TABLE...");
    await sql`ALTER TABLE awbs ALTER COLUMN chargeable_weight TYPE NUMERIC USING NULLIF(chargeable_weight, '')::NUMERIC`;
    console.log("SUCCESS: Column is now NUMERIC.");

    // 3. Final PROOF
    const res = await sql`SELECT SUM(chargeable_weight) as total FROM awbs`;
    console.log("PROVED_TOTAL_VOLUME:", res[0].total);

  } catch (error) {
    console.error("CLEAN_AND_FIX_FAILED:", error);
  } finally {
    await sql.end();
  }
}

cleanAndFix();
