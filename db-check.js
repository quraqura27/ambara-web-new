const { neon } = require('@neondatabase/serverless');
const connectionString = "postgresql://neondb_owner:npg_GFrHRxfJ8tI3@ep-muddy-recipe-ajlg6z5d-pooler.c-3.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

async function check() {
  const sql = neon(connectionString);
  try {
    console.log("Connecting to Neon...");
    
    const countRes = await sql`SELECT COUNT(*) FROM awbs`;
    console.log("Total AWBs:", countRes[0].count);
    
    const shipCountRes = await sql`SELECT COUNT(*) FROM shipments`;
    console.log("Total Shipments:", shipCountRes[0].count);

    const shipCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments'`;
    console.log("Shipment Columns:", shipCols.map(c => c.column_name).join(", "));

    const awbCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'awbs'`;
    console.log("AWB Columns:", awbCols.map(c => c.column_name).join(", "));
    
    const shipSumRes = await sql`SELECT SUM(CAST(chargeable_weight AS NUMERIC)) as total FROM shipments`;
    console.log("Total Shipment Weight Sum:", shipSumRes[0].total);

    const awbSumRes = await sql`SELECT SUM(chargeable_weight) as total FROM awbs`;
    console.log("Total AWB Weight Sum:", awbSumRes[0].total);
    
  } catch (err) {
    console.error("DB Error:", err.message);
  }
}

check();
