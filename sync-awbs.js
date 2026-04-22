const { postgres } = require('postgres');
require('dotenv').config();

const connectionString = "postgresql://neondb_owner:npg_GFrHRxfJ8tI3@ep-muddy-recipe-ajlg6z5d-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = require('postgres')(connectionString);

async function syncData() {
  console.log("Starting Data Sync: Shipments -> AWBs...");

  try {
    // 1. Get a fallback customer ID
    const fallbackCustomer = await sql`SELECT id FROM customers LIMIT 1`;
    const defaultCustId = fallbackCustomer[0]?.id;

    // 2. Get all shipments that DON'T have an AWB record
    const shipments = await sql`
      SELECT s.id, s.chargeable_weight, s.total_pcs, s.tracking_number, s.customer_id, s.origin, s.destination, s.created_by, s.created_at
      FROM shipments s
      LEFT JOIN awbs a ON s.id = a.shipment_id
      WHERE a.id IS NULL
    `;

    console.log(`Found ${shipments.length} orphaned shipments. Syncing...`);

    for (const s of shipments) {
      console.log(`Syncing Shipment ID ${s.id} (Tracking: ${s.tracking_number})...`);
      
      const targetCustId = s.customer_id || defaultCustId;
      if (!targetCustId) {
        console.warn(`Skipping Shipment ${s.id}: No customers found in DB.`);
        continue;
      }

      await sql`
        INSERT INTO awbs (
          id, customer_id, awb_number, pieces, chargeable_weight, 
          origin, destination, uploaded_by, raw_pdf_url, 
          shipment_id, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${targetCustId},
          ${s.tracking_number || ''},
          ${s.total_pcs || 0},
          ${s.chargeable_weight || '0'},
          ${(s.origin || 'XXX').slice(0, 3)},
          ${(s.destination || 'XXX').slice(0, 3)},
          ${s.created_by || 'SYSTEM'},
          'manual://migrated',
          ${s.id},
          ${s.created_at},
          NOW()
        )
      `;
    }

    console.log("Sync Complete!");
    
    // Final verification
    const totalWeight = await sql`SELECT SUM(CAST(chargeable_weight AS NUMERIC)) as total FROM awbs`;
    console.log("New Dashboard Total Volume (KG):", totalWeight[0].total);

  } catch (error) {
    console.error("Sync Failed:", error);
  } finally {
    await sql.end();
  }
}

syncData();
