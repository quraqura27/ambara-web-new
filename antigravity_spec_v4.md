# Antigravity Spec v4 (Live)

## Goal
To build a SaaS platform for a freight forwarding company handling global logistics, airfreight, and customs clearance.

## Core Stack
- **Framework**: Next.js (App Router)
- **Database**: Neon (PostgreSQL) + Drizzle ORM (Strict Mode)

### Data Models & Architecture
- **AWB-First Financial Truth**: All volume/financial metrics derive exclusively from the `awbs` table. The `shipments` table is operational only (tracking, status).
- **Schema**: `awbs.chargeable_weight` is `NUMERIC` in Postgres (not TEXT). All aggregation uses `SUM(CAST(... AS NUMERIC))`.
- **Metric Formatting**: Tonnage displays as MT (if >= 1000kg) or KG (if < 1000kg).
- **Auth**: Clerk (Production Live)
- **Styling**: Tailwind CSS
- **Storage**: Cloudflare R2
- **Email**: Resend

## Recent Decisions (Session 4cb81bf1)
1. **Schema Normalization (April 23):** Synchronized Drizzle `schema.ts` with the production Neon database. Added 14 missing columns to `shipments`, 6 to `customers`, and performed a total overhaul of the `invoices` table to match reality.
2. **Zero-Raw-SQL Mandate:** Migrated all dashboard aggregation logic from raw SQL to strict, type-safe Drizzle ORM syntax (e.g., `sum(invoices.total)`).
3. **Phase 2 UI Stabilization:** Fixed broken pagination and data visibility in the Shipment Management module by correcting props-passing and removing stale logic references (`parseStatus`).
4. **Mandatory Rule Enforcement:** Integrated `SKILL.md`, `CLI-FIRST.md`, and `UI-STYLE.MD` into the global agent instructions to ensure non-negotiable adherence to development standards.
5. **Premium UI Overhaul (April 23):** Executed a total visual transformation of the dashboard using "Glassmorphism" design patterns and high-density operational components.
6. **Tailwind v3 Stability Migration:** Downgraded to Tailwind v3.4.19 to resolve build-time CSS stripping issues and ensure layout consistency across all environments.

## Global Rules & Constraints
1. **Visual Excellence**: All web UI must be premium, high-fidelity, and adhere to `UI-STYLE.MD`.
2. **Persistence**: Never delete `implementation_plan.md` or `task.md`.
3. **CLI-First**: ALWAYS use the CLI (terminal) for DevOps, status checks, and data fetching if direct access is available. Avoid the browser unless visual verification is required.
4. **Strict Drizzle**: NEVER use raw SQL where a schema mapping can provide type-safe alternatives.

## Current Focus
- Automated Invoice Generation Module drawing from `awbs` table.
- Ensuring end-to-end data integrity between CRM and Shipments.

## Active Status
- Migration: **Done**
- Clerk Sign Up Flow: **Done**
- RBAC Middleware: **Done**
- Dashboard Metrics Fix: **Done**
- AWB-First Architecture: **Done**
- Invoice Engine: **Pending**
