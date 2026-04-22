const { neon } = require('@neondatabase/serverless');
const connectionString = "postgresql://neondb_owner:npg_GFrHRxfJ8tI3@ep-muddy-recipe-ajlg6z5d-pooler.c-3.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

async function check() {
  const sql = neon(connectionString);
  try {
    console.log("Connecting to Neon...");
    
    const countRes = await sql`SELECT COUNT(*) FROM awbs`;
    console.log("Total AWBs:", countRes[0].count);
    
    const sumRes = await sql`SELECT SUM(chargeable_weight) as total FROM awbs`;
    console.log("Total Weight Sum:", sumRes[0].total);
    
    const sampleRes = await sql`SELECT id, chargeable_weight FROM awbs LIMIT 5`;
    console.log("Sample Data:", sampleRes);
    
  } catch (err) {
    console.error("DB Error:", err.message);
  }
}

check();
