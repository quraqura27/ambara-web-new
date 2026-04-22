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
- **CSS Structural Hardening (April 21)**: Implemented "Immortal Shell" styling in `globals.css` with `!important` layout properties. Created explicit fallbacks for critical Tailwind utilities (flex, grid, responsive containers) to prevent production layout regressions caused by CSS stripping or environment mismatches.
- **Hydration Sync Fix (April 21)**: Resolved persistent React hydration errors in `ShipmentGrid.tsx` by implementing a deterministic `Intl.DateTimeFormat('en-GB')` formatter, ensuring server-client consistency for shipment dates.
- **Tailwind v4 Configuration Compatibility (April 21)**: Introduced a minimal `tailwind.config.ts` to ensure the CSS engine initializes correctly in non-standard production build environments.
- **Clerk RBAC & Webhooks System (April 19)**: Scraped Fonnte/WhatsApp webhooks for native in-app Admin Notifications at `/dashboard/admin/users`. Created Neon `profiles` table to sync with Clerk `user.created` webhooks, alongside strict route-guard validations in `middleware.ts` evaluating `metadata.role`.
- **Hybrid Engine Restoration**: Successfully restored the site by bridging legacy HTML files with native Next.js API Gateway and App Router.
- **Production Key Injection (April 17)**: Configured Vercel production edge with native Clerk `live` keys (Publishable, Secret, and 4 routing URLs) via Vercel CLI to remove silently failing `<SignIn />` blank screens.
- **Automated DNS Setup**: Hardcoded all 5 required Clerk CNAME instances into Vercel DNS using Vercel CLI.
- **Admin Setup Completed**: User signed up to production Clerk environment. Successfully elevated user `quraisyabdurrahman@ambaraartha.com` to `MASTER_ADMIN` status directly via API using production secret key.
- **Premium Command Center Overhaul (April 23)**: Executed a complete visual restyling of the entire dashboard (/app/dashboard). Transitioned from an unstable Tailwind v4 configuration to a stable **Tailwind v3.4.19** baseline. Implemented a cohesive "Glassmorphism" design system, high-fidelity data grids, and refined operational terminals for Ingest, Finance, and Labels.
- **Tailwind Stability Migration (April 23)**: Resolved persistent layout regressions by purging Tailwind v4 dependencies and implementing a standard `tailwind.config.ts` with premium design tokens. Verified stability via successful production builds and GitHub deployment.
- **Admin Server Actions**: Converted the Admin Dashboard pending users table to use Next.js Server Actions with `force-dynamic` to allow direct DB updates and smooth production deploys.
- **Tonnage Source of Truth**: Switched dashboard stats to pull from the `shipments` table for speed and accuracy across all 35+ records.
- **Dual-Sync Protocol**: Implemented logic to sync weight/pieces between `shipments` (operational) and `awbs` (financial) tables on every write.
- **Intelligent Unit Display**: Dashboard now switches between KG and MT automatically based on volume size.

## Current Focus
- **Phase 3: AWB Ingestion**: Activating the parsing engine to automate PDF data entry into the CRM.
- **Phase 4: Thermal Labels**: Preparing the layout engine for 4x6 printing.
- The premium "Command Center" UI overhaul is now live on Vercel. 
- Monitoring production builds and user feedback on the new high-fidelity layout.
- The environment is fully deployed on Vercel (`www.ambaraartha.com`). 

## Next Steps
- Begin development of Phase 5: Automated Invoice Generation Module (3-stage PDF assembler) upon successful RBAC signoff.
