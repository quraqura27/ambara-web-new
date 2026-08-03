# Ambara SEO Sprint Progress

This file records implementation progress without storing private GA4 exports or visitor-level data.

## Batch 1 — Analytics baseline

Status: ready for review

Evidence:

- GA4 was already loaded globally from `public/app.js`.
- WhatsApp clicks used the legacy custom event name `whatsapp_click`.
- Email and phone links did not have dedicated business-conversion events.
- Successful English and Indonesian quote submissions did not emit `generate_lead`.
- The first scheduled GA4 email set was not yet available, so no traffic-quality conclusions were made in this batch.

Implemented:

- Standardized WhatsApp clicks as `click_whatsapp`.
- Added `click_email` and `click_phone` tracking.
- Added `generate_lead` only after the quote API returns a successful response.
- Added page, CTA-location, service-category, and form-language context without sending form contents or customer contact data.

Verification:

- JavaScript syntax check: passed.
- Analytics source assertions: passed.
- ESLint: passed.
- Next.js production build and TypeScript: passed.
- Automated browser execution was unavailable in the run environment; no production deployment was attempted.

Next priority:

- Analyze the first complete GA4 email set when available.
- Confirm the four new event names appear in GA4.
- Add document-review intent tracking after validating how those actions should be classified.

## Batch 2 — Contextual article conversion paths

Status: ready for review

Evidence:

- All four scheduled GA4 report emails arrived, but the connected Gmail attachment extractor returned the same transient error for each CSV, so the report values were not used or stored.
- Five priority informational articles ended with the same generic “Ready to Ship?” message and “Request a Quote” action regardless of reader intent.
- The site already has relevant contact and commercial service pages for document review, customs clearance, regulated cargo, and Indonesia arrival support.

Implemented:

- Replaced the five generic article endings with topic-specific next steps.
- Connected AWB, customs/PIB, dangerous goods, PPJK, and Commercial Invoice readers to the most relevant contact or service page.
- Added contextual WhatsApp actions for dangerous-goods and document-review intent, using the conversion event support introduced in Batch 1.
- Kept customs and dangerous-goods language conditional; no guarantee of acceptance, approval, clearance, or release timing was added.

Verification:

- JavaScript syntax check: passed.
- Contextual CTA and internal-link source assertions: passed.
- Linked internal service/contact targets: present.
- ESLint: passed.
- Next.js production build and TypeScript: passed.
- Automated browser execution was not repeated because no browser executable was available in the run environment; the draft preview remains the review surface.

Next priority:

- Retry the four GA4 CSV attachments and classify traffic quality once extraction succeeds.
- After Batch 1 is merged and data accumulates, confirm `click_whatsapp`, `click_email`, `click_phone`, and `generate_lead` appear in GA4.
- Review the quotation funnel and commercial landing pages using the first readable report set.

## Batch 3 — Quotation funnel resilience and localization

Status: ready for review

Evidence:

- The connected Gmail attachment extractor continued to reject all four scheduled GA4 CSV files, so no private report values or traffic classifications were used.
- The Indonesian quotation page still presented most headings, labels, choices, status messages, and the submit action in English.
- Both quotation forms used fixed multi-column inline layouts on small screens and did not expose submission status through an ARIA live region.
- Form errors displayed an API-provided message as HTML, while a failed request offered no direct WhatsApp fallback.

Implemented:

- Fully localized the Indonesian quotation page metadata, headings, fields, choices, button states, and success/error feedback.
- Stacked form grids on screens up to 640px wide.
- Added standard autocomplete hints for name, company, email, and telephone fields.
- Added live, focusable submission status and preserved user-entered data after errors.
- Added email and WhatsApp recovery paths for failed submissions.
- Escaped the server-provided quote reference before rendering it.
- Merged the latest `main` changes into the sprint branch; the intervening invoice changes did not overlap with sprint files.

Verification:

- Quotation-page source assertions: passed.
- Extracted inline JavaScript syntax checks: passed.
- ESLint: passed.
- Merged invoice regression tests: 9 passed.
- Next.js production build and TypeScript: passed.
- Browser automation was unavailable in the run environment; the draft preview remains the visual review surface.

Next priority:

- Retry GA4 CSV extraction and classify traffic once the connector accepts the attachments.
- Confirm the refreshed draft branch is mergeable and its preview is healthy.
- Use the first readable landing-page and event reports to choose the next commercial-page optimization.

## Batch 4 — Sitemap coverage and automated SEO checks

Status: ready for review

Evidence:

- No newer weekly GA4 report set had arrived at the time of this batch.
- The existing Gmail attachment extractor still rejected the newest available CSV when retried, so no traffic values or classifications were inferred.
- Repository audit found 73 canonical indexable public pages but only 42 sitemap URLs.
- Nine high-intent English articles already used by this sprint were canonical and indexable but absent from the sitemap.
- Existing indexable pages passed title, meta-description, canonical, duplicate-canonical, and static JSON-LD parsing checks.

Implemented:

- Added the nine priority AWB, customs, DG, PPJK, document-readiness, arrival-handling, and quotation-checklist articles to the sitemap.
- Added `npm run seo:audit` to validate public-page titles, descriptions, canonicals, duplicate canonicals, sitemap targets, and static JSON-LD syntax.
- Kept remaining legacy canonical pages out of the sitemap pending content-quality review instead of bulk-submitting them.

Verification:

- Automated SEO audit: passed across 79 HTML files, 73 canonical indexable pages, and 51 sitemap URLs.
- Sitemap duplicate and expected-count assertions: passed.
- ESLint: passed.
- Invoice regression tests: 9 passed.
- Next.js production build and TypeScript: passed.
- Browser automation was unavailable in the run environment; the draft preview remains the visual review surface.

Next priority:

- Read the next complete GA4 email set after it arrives and classify traffic quality.
- Review omitted legacy articles for duplication, language mismatch, and content quality before considering additional sitemap inclusion.
- Use readable landing-page data to prioritize the next commercial service page.
