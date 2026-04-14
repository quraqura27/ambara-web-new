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
- **Hybrid Engine Restoration**: Successfully restored the site by bridging legacy static HTML files (marketing) with a native Next.js API Gateway (src/pages/api/main.js) and App Router (dashboard/auth).
- **Hobby Plan Optimization**: Consolidated 24 legacy handlers into 1 unified serverless function to bypass Vercel Hobby limits.
- **Absolute Asset Pathing**: Converted all relative paths in static HTML to absolute to support bilingual (/en/, /id/) routing without visual breaks.
- **Clerk Auth Recovery**: Restored native sign-in/sign-up components in the App Router.
- **Current Focus**: Completed. The Unified Consolidated Engine is live on Vercel with clean history and validated routing.
- **Next Steps**:
    - Swap Clerk `test` keys with `live` keys in Vercel to enable production users.
    - End-to-end "Ingest-to-Track" test on the live domain.
    - Begin design for automated invoice generation module.
