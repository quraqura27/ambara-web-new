# Antigravity Spec v4 (Live)

## Goal
To build a SaaS platform for a freight forwarding company handling global logistics, airfreight, and customs clearance.

## Core Stack
- **Framework**: Next.js (App Router)
- **Database**: Neon (PostgreSQL) + Drizzle ORM
- **Auth**: Clerk (Production Live)
- **Styling**: Tailwind CSS
- **Storage**: Cloudflare R2
- **Email**: Resend

## Recent Decisions (Session 4cb81bf1)
1. **Premium UI Overhaul (April 23):** Executed a total visual transformation of the dashboard using "Glassmorphism" design patterns and high-density operational components.
2. **Tailwind v3 Stability Migration:** Downgraded to Tailwind v3.4.19 to resolve build-time CSS stripping issues and ensure layout consistency across all environments.
3. **Hydration Resolution:** Standardized date rendering using `Intl.DateTimeFormat` to eliminate server-client mismatches.
4. **RBAC Transition:** Upgraded simple authentication to Role-Based Access Control using Clerk `sessionClaims` and metadata. Core roles remain: `MASTER_ADMIN`, `OPERATIONS`, `FINANCE`.
5. **Database Sync:** Created `profiles` table to maintain a synchronized mapping of Clerk UUIDs to system roles via Webhooks (`svix`). New signups default to `PENDING` status.
6. **Server Actions for Admin:** Replaced client-side state with Next.js Server Actions for cleaner role assignments.

## Global Rules & Constraints
1. **Visual Excellence**: All web UI must be premium, high-fidelity, and adhere to `UI-STYLE.MD`.
2. **Persistence**: Never delete `implementation_plan.md` or `task.md`.
3. **CLI-First**: ALWAYS use the CLI (terminal) for DevOps, status checks, and data fetching if direct access is available. Avoid the browser unless visual verification is required.

## Current Focus
- The premium "Command Center" UI is fully deployed on Vercel. 
- Monitoring production builds and user feedback on the new high-fidelity layout.
- **Next Phase:** Begin Automated Invoice Generation Module (3-stage PDF assembler) upon successful RBAC signoff.

## Active Status
- Migration: **Done**
- Clerk Sign Up Flow: **Done**
- RBAC Middleware: **Done**
- Invoice Engine: **Pending**
