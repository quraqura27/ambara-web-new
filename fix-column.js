const { postgres } = require('postgres');
require('dotenv').config();

const connectionString = "postgresql://neondb_owner:npg_GFrHRxfJ8tI3@ep-muddy-recipe-ajlg6z5d-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = require('postgres')(connectionString);

async function fixColumn() {
  console.log("Migrating chargeable_weight to NUMERIC...");

  try {
    // 1. Convert the column type
    await sql`ALTER TABLE awbs ALTER COLUMN chargeable_weight TYPE NUMERIC USING NULLIF(chargeable_weight, '')::NUMERIC`;
    console.log("SUCCESS: Column is now NUMERIC.");

    // 2. Final verification of the sum
    const res = await sql`SELECT SUM(chargeable_weight) as total FROM awbs`;
    console.log("PROVED_TOTAL_VOLUME:", res[0].total);

  } catch (error) {
    console.error("MIGRATION FAILED:", error);
  } finally {
    await sql.end();
  }
}

fixColumn();
