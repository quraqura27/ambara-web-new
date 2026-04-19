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
1. **RBAC Transition:** Upgraded simple authentication to Role-Based Access Control using Clerk `sessionClaims` and metadata. Core roles remain: `MASTER_ADMIN`, `OPERATIONS`, `FINANCE`.
2. **Database Sync:** Created `profiles` table to maintain a synchronized mapping of Clerk UUIDs to system roles via Webhooks (`svix`). New signups default to `PENDING` status.
3. **Server Actions for Admin:** Replaced client-side state with Next.js Server Actions (`approveUser`, `denyUser`) inside `/app/dashboard/admin/users/page.tsx` for cleaner role assignments.
4. **Environment Promotion:** Successfully pushed changes to Vercel production to enforce `/dashboard/admin` and `middleware.ts` protections globally. Clerk keys are completely migrated to Production keys.

## Current Focus
- The environment is fully deployed on Vercel. 
- Awaiting user (quraisyabdurrahman@ambaraartha.com) authentication and manual review of the RBAC access layers by external AI agents.
- **Next Phase:** Begin Automated Invoice Generation Module (3-stage PDF assembler) upon successful RBAC signoff.

## Active Status
- Migration: **Done**
- Clerk Sign Up Flow: **Done**
- RBAC Middleware: **Done**
- Invoice Engine: **Pending**
