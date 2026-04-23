const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_GFrHRxfJ8tI3@ep-muddy-recipe-ajlg6z5d-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'invoices'`;
  console.log('INVOICES TABLE COLUMNS:');
  cols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));
}

main().catch(console.error);
