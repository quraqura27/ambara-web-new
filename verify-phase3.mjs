import { db } from "./portal/src/lib/db";
import { customers } from "./portal/src/lib/db/schema";
import { eq, ilike } from "drizzle-orm";

function generateInternalTrackingNo(country, service) {
  const prefix = "AA";
  const countryCode = (country || "ID").slice(0, 2).toUpperCase();
  const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
  const year = "26"; // Current target year per spec
  const svc = service.slice(0, 2).toUpperCase();

  return `${prefix}${countryCode}${random8}${year}${svc}`;
}

async function testFormula() {
    console.log("Testing Tracking Formula...");
    for(let i=0; i<5; i++) {
        console.log(`- ${generateInternalTrackingNo('ID', 'PP')}`);
        console.log(`- ${generateInternalTrackingNo('SG', 'DD')}`);
    }
}

testFormula();
