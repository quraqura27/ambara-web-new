# PROJECT: AMBARA LOGISTICS SUITE - DASHBOARD STABILIZATION HANDOVER

## SITUATION SUMMARY
The Ambara Command Center dashboard is currently reporting "0.0 MT" total cargo volume, despite the database (Neon Postgres) containing approximately 35 shipment records with a total weight of ~116.8 Metric Tons (MT).

### ARCHITECTURE
- **Framework**: Next.js 16 (App Router) with Turbopack.
- **ORM**: Drizzle ORM.
- **Database**: Neon Postgres (Serverless).
- **Deployment**: Vercel (Production URL: https://www.ambaraartha.com).

### DATA DISCREPANCY DETAILS
1. **Source of Truth**: The operational data resides in the `shipments` table. 
2. **Current State**: 
   - A local diagnostic script (`db-check.js` using the production DATABASE_URL) correctly identifies 35 shipments and calculates the 116.8 MT sum.
   - The production dashboard UI (Server Action: `getDashboardStats` in `app/actions/dashboard-actions.ts`) consistently returns `0.0`.
3. **Ghost Data Symptom**: The "Operational Log" in the dashboard UI *correctly* lists the 5 most recent shipments, proving the database connection is active. However, the aggregation queries (`COUNT` and `SUM`) are returning zero values to the UI.

### RECENT ATTEMPTS & FAILURES
- **Schema Sync**: Added missing columns (`chargeableWeight`, `totalPcs`) to `lib/db/schema.ts`.
- **Raw SQL Bypass**: Switched from Drizzle ORM aggregation to raw `db.execute(sql`SELECT SUM...`)` to rule out ORM bugs.
- **Result Parsing**: Implemented multi-layered parsing for `db.execute` results (`rows[0].total` vs `[0].total`).
- **Environment Verification**: Forced manual update of `DATABASE_URL` in Vercel to ensure it points to the correct Neon project (`ep-muddy-recipe-ajlg6z5d`).
- **Caching**: Added `force-dynamic` and `revalidate = 0` to the dashboard page to prevent stale data.

### NEXT STEPS FOR NEW AI
1. **Type Mismatch**: Investigate if the `numeric` type in Neon is being returned as a string that `parseFloat` or Drizzle is failing to handle in the specific Node.js environment on Vercel.
2. **Schema Alignment**: Verify if the `shipments` table in the Drizzle schema perfectly matches the production database schema (especially column types and naming).
3. **Server Action Hydration**: Check if there's a hydration mismatch where the initial state (`0.0`) is being locked into the client-side component (`DashboardContent.tsx`) even after the server action completes.

## DB CONNECTION INFO
**Project ID**: ep-muddy-recipe-ajlg6z5d (Neon)
**Connection String**: (Stored in .env - please verify Vercel environment variables)
