# Context Log: Ambara Command Center

- **Who I Am**:
    - **Name**: [Placeholder]
    - **Company**: PT Ambara Artha Globaltrans
    - **Role**: Principal Logistics Lead / Owner
- **Company Context**:
    - **Name**: PT Ambara Artha Globaltrans
    - **Focus**: International Freight Forwarding & Logistics.
# Context Log: Ambara Command Center

- **Who I Am**:
    - **Name**: [Placeholder]
    - **Company**: PT Ambara Artha Globaltrans
    - **Role**: Principal Logistics Lead / Owner
- **Company Context**:
    - **Name**: PT Ambara Artha Globaltrans
    - **Focus**: International Freight Forwarding & Logistics.
    - **Location**: Soekarno-Hatta International Airport, Jakarta (CGK).
    - **Specialty**: Regulated cargo, complex customs clearance, and high-security airfreight handles.
- **Active Projects**:
    - **Ambara Command Center**: Unified Next.js platform for internal operations and public tracking.
    - **Deterministic AWB Scraper**: Proprietary coordinate-locked engine for error-free cargo data extraction.
    - **Thermal Label Engine**: Automated generation of airline-compliant AWB stickers.
## Recent Decisions
- **Clerk RBAC & Webhooks System (April 19)**: Scraped Fonnte/WhatsApp webhooks for native in-app Admin Notifications at `/dashboard/admin/users`. Created Neon `profiles` table to sync with Clerk `user.created` webhooks, alongside strict route-guard validations in `middleware.ts` evaluating `metadata.role`.
- **Hybrid Engine Restoration**: Successfully restored the site by bridging legacy HTML files with native Next.js API Gateway and App Router.
- **Production Key Injection (April 17)**: Configured Vercel production edge with native Clerk `live` keys (Publishable, Secret, and 4 routing URLs) via Vercel CLI to remove silently failing `<SignIn />` blank screens.
- **Automated DNS Setup**: Hardcoded all 5 required Clerk CNAME instances into Vercel DNS using Vercel CLI.
- **Current Focus**: Waiting for the Principal Admin to create an account in the Live Clerk environment so we can execute `scripts/set-superadmin.mjs` and unlock their MASTER_ADMIN interface.
- **Next Steps**:
    - Complete End-to-end "Ingest-to-Track" system verification using the live domain once SSL fully propagates.
    - Setup and test webhook sync between Clerk and Neon Postgres Database if required.
    - Begin development of Phase 5: Automated Invoice Generation Module.
