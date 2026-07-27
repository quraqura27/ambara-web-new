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
