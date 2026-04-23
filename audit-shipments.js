const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_GFrHRxfJ8tI3@ep-muddy-recipe-ajlg6z5d-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require');

async function main() {
  console.log('=== SHIPMENTS TABLE ===');
  const shipCols = await sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'shipments' ORDER BY ordinal_position`;
  shipCols.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | nullable: ${c.is_nullable} | default: ${c.column_default || 'none'}`));

  console.log('\n=== AWBS TABLE ===');
  const awbCols = await sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'awbs' ORDER BY ordinal_position`;
  awbCols.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | nullable: ${c.is_nullable} | default: ${c.column_default || 'none'}`));

  console.log('\n=== CUSTOMERS TABLE ===');
  const custCols = await sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'customers' ORDER BY ordinal_position`;
  custCols.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | nullable: ${c.is_nullable} | default: ${c.column_default || 'none'}`));

  console.log('\n=== SHIPMENT ROW COUNT ===');
  const shipCount = await sql`SELECT COUNT(*) as cnt FROM shipments`;
  console.log(`  Total: ${shipCount[0].cnt}`);

  console.log('\n=== AWB ROW COUNT ===');
  const awbCount = await sql`SELECT COUNT(*) as cnt FROM awbs`;
  console.log(`  Total: ${awbCount[0].cnt}`);

  console.log('\n=== SAMPLE SHIPMENT (latest) ===');
  const sample = await sql`SELECT * FROM shipments ORDER BY created_at DESC LIMIT 1`;
  console.log(JSON.stringify(sample[0], null, 2));

  console.log('\n=== SAMPLE AWB (latest) ===');
  const awbSample = await sql`SELECT * FROM awbs ORDER BY created_at DESC LIMIT 1`;
  console.log(JSON.stringify(awbSample[0], null, 2));

  console.log('\n=== ORPHAN CHECK: shipments without AWBs ===');
  const orphans = await sql`SELECT COUNT(*) as cnt FROM shipments s WHERE NOT EXISTS (SELECT 1 FROM awbs a WHERE a.shipment_id = s.id)`;
  console.log(`  Orphaned shipments (no AWB): ${orphans[0].cnt}`);

  console.log('\n=== ORPHAN CHECK: AWBs without shipments ===');
  const awbOrphans = await sql`SELECT COUNT(*) as cnt FROM awbs a WHERE a.shipment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM shipments s WHERE s.id = a.shipment_id)`;
  console.log(`  Orphaned AWBs (broken shipment_id): ${awbOrphans[0].cnt}`);
}

main().catch(console.error);
