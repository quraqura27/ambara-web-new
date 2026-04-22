const { postgres } = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const { shipments, awbs } = require('./lib/db/schema');
const { count, sum } = require('drizzle-orm');
require('dotenv').config();

const connectionString = "postgresql://neondb_owner:npg_GFrHRxfJ8tI3@ep-muddy-recipe-ajlg6z5d-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const client = postgres(connectionString);
const db = drizzle(client);

async function testStats() {
  console.log("PROVING DATABASE FETCH...");

  try {
    const totalVolumeResult = await db.select({ total: sum(awbs.chargeableWeight) }).from(awbs);
    
    console.log("-----------------------------------------");
    console.log("RAW RESULT FROM DB:", totalVolumeResult);
    
    const volTotal = parseFloat(totalVolumeResult[0]?.total || "0");
    console.log("PARSED VOLUME:", volTotal);
    
    if (volTotal >= 1000) {
      console.log("FINAL DISPLAY STRING:", (volTotal / 1000).toFixed(2) + " MT");
    } else {
      console.log("FINAL DISPLAY STRING:", volTotal.toFixed(0) + " KG");
    }
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("PROVE FAILED:", error);
  } finally {
    await client.end();
  }
}

testStats();
