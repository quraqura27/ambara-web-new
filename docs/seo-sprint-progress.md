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
