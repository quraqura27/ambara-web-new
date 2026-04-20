import { pgTable, text, serial, timestamp, integer, numeric, bigint } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../lib/db/schema';

async function audit() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("--- RECENT SHIPMENTS ---");
  const sh = await db.query.shipments.findMany({ limit: 5 });
  console.log(JSON.stringify(sh, null, 2));

  console.log("\n--- RECENT AWBS ---");
  const a = await db.query.awbs.findMany({ limit: 5 });
  console.log(JSON.stringify(a, null, 2));

  console.log("\n--- RECENT CUSTOMERS ---");
  const c = await db.query.customers.findMany({ limit: 5 });
  console.log(JSON.stringify(c, null, 2));

  console.log("\n--- AGGREGATE CHECKS ---");
  // Check why stats might be 0
  const awbCount = await sql`SELECT COUNT(*) FROM awbs`;
  const shipCount = await sql`SELECT COUNT(*) FROM shipments`;
  const custCount = await sql`SELECT COUNT(*) FROM customers`;
  
  console.log({ awbCount, shipCount, custCount });
}

audit().catch(console.error);
