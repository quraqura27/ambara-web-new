# Ambara SEO and Conversion Sprint — Final Report

## Executive outcome

The sprint completed 14 implementation and verification batches on the dedicated `codex/seo-sprint-analytics-baseline` branch. The work remains consolidated in draft pull request #18 for review; nothing has been merged or deployed to production.

The repository is materially better prepared to measure and convert relevant traffic, but the sprint cannot claim a production conversion uplift. The new tracking and funnel changes are not live until the pull request is merged, and all five weekly GA4 report sets delivered during the sprint failed at the connected Gmail attachment extractor. No private report values, bot classifications, visitor counts, or performance claims were inferred.

## Work completed

### Analytics and lead measurement

- Added privacy-safe events for WhatsApp, email, and phone clicks.
- Added `generate_lead` after successful quote and contact submissions.
- Kept names, contact details, messages, quote references, and shipment contents out of analytics payloads.
- Added service and CTA-location context where it can support aggregate funnel analysis.

### Conversion journeys

- Added contextual calls to action and internal service links to five priority articles covering AWB, customs/PIB, dangerous goods, PPJK, and Commercial Invoice topics.
- Improved the English and Indonesian quotation journeys, including mobile layout, safer success rendering, accessible feedback, autocomplete, and email/WhatsApp recovery paths.
- Improved and localized the English and Indonesian contact journeys.
- Associated all 52 labels and controls across the four quote/contact forms.

### Technical SEO and indexing readiness

- Increased reviewed sitemap coverage from 42 to 51 URLs.
- Added a dependency-free `npm run seo:audit` covering metadata, canonical identity, duplicate titles/descriptions, sitemap targets, language, hreflang reciprocity, Open Graph, internal references, new-tab isolation, structured data, visible FAQ representation, unsupported claims, and conversion-form associations.
- Verified 79 HTML files, 73 canonical indexable pages, 190 hreflang relationships, 73 Open Graph sets, 756 local references, 54 new-tab links, and 479 structured-data entities.
- Kept 22 legacy canonical pages out of the sitemap pending content-quality and duplication review.

### Content quality, localization, and claims

- Localized Indonesian quote, contact, About, FAQ, blog-hub, runtime-blog, network, and legacy launch content.
- Aligned FAQ structured data with visible content and canonical page identity.
- Removed unsupported license, fixed-response, availability, experience, network-size, performance, transit-time, acceptance, and clearance claims.
- Added 790 automated service-level and credential claim checks.
- Improved dynamic blog-card and article-cover image loading behavior.

## Final verification evidence

- Branch position: 14 commits ahead of current `main`, with no commits missing from `main` at the final comparison.
- Merge-tree comparison against current `main`: no conflicts.
- SEO audit: passed.
- Conversion form associations: 52 labels and 52 controls passed.
- Visible FAQ checks: 82 questions and 82 answers passed.
- Vercel draft previews for the implementation batches: Ready.
- Local JavaScript syntax and edited inline-script compilation checks: passed.
- Local ESLint, TypeScript, Next.js build, and browser execution remain unavailable because dependency binaries and the browser executable are absent. Vercel previews provide an independent build check but do not replace a final human visual review.

## Outstanding risks and blockers

1. **Production data has not started collecting for the new events.** PR #18 is still draft and unmerged.
2. **GA4 report extraction is blocked.** Five complete weekly email sets arrived, but the Gmail attachment connector rejected every CSV. Bot-versus-prospect, landing-page, country, and conversion analysis remain incomplete.
3. **The pull request is broad.** It changes 39 files before this report and should receive focused EN/ID visual and form-flow review before merge.
4. **Direct browser verification is incomplete.** Check mobile and desktop layouts, label clicks, keyboard navigation, form success/failure states, WhatsApp fallbacks, article CTAs, and localized copy on the Vercel preview.
5. **Twenty-two canonical pages remain outside the sitemap.** Do not add them in bulk without reviewing duplication, usefulness, commercial accuracy, and search intent.

## Required rollout sequence

1. Review PR #18 and its Vercel preview, concentrating on quote/contact submissions and the five edited article journeys.
2. Merge only after the visual and form-flow review passes; production deployment remains the repository owner's decision.
3. On production, smoke-test WhatsApp, email, phone, quote, and contact actions without submitting real customer data to analytics.
4. Verify `click_whatsapp`, `click_email`, `click_phone`, and `generate_lead` in GA4 Realtime or DebugView. Mark only genuine lead actions as key events where appropriate.
5. Start a new 30-day baseline after production verification. Do not compare pre-merge and post-merge conversion performance as if tracking were equivalent.
6. Resolve analytics access through a readable manual export or a repaired connector before making data-selected landing-page changes.

## Evidence-based 30–90 day continuation plan

### Days 1–7 after merge — establish production integrity

- Complete the production smoke test and GA4 event verification.
- Confirm production canonical, sitemap, hreflang, structured-data, and form behavior.
- Record the deployment date as the measurement boundary.
- Obtain one readable GA4 export containing Traffic Acquisition, Landing Page, Events, and Countries.

### Days 8–30 — collect a clean baseline

- Separate likely internal, development, crawler, cloud, proxy, and genuine prospect patterns using aggregate source, geography, landing-page, engagement, and event evidence.
- Measure qualified sessions, engaged sessions, WhatsApp intent, successful forms, and commercial-page progression.
- Use Search Console alongside GA4 for query impressions, click-through rate, position, and landing-page discovery.
- Avoid broad copy or sitemap expansion during the baseline unless a production defect is found.

### Days 31–60 — optimize proven conversion paths

- Select two or three landing pages with relevant traffic but weak lead progression.
- Improve their CTA specificity, supporting proof, internal links, and shipment-detail prompts.
- Compare each change against the post-merge baseline; do not interpret raw traffic growth as lead growth.
- Review whether informational articles are moving visitors toward customs, undername, DG, airfreight, contact, or quote pages.

### Days 61–90 — expand only where demand is demonstrated

- Build or improve lane, commodity, or service content only where Search Console and GA4 show relevant demand.
- Review the 22 sitemap-omitted pages and include only differentiated, accurate, useful pages.
- Consolidate or retire duplicate and low-value legacy content.
- Prepare the next quarterly roadmap from qualified lead volume, landing-page contribution, and commercial outcomes.

## KPI definitions for the next cycle

- Qualified organic sessions to relevant service or article pages.
- Engaged sessions after excluding evident internal/testing and automated patterns.
- `click_whatsapp`, `click_email`, and `click_phone` by page and CTA location.
- Successful `generate_lead` events from quote and contact forms.
- Lead conversion rate using qualified sessions as the denominator.
- Article-to-commercial-page progression.
- Commercial landing pages contributing to a lead action.
- Search Console impressions, clicks, click-through rate, and average position for relevant non-branded queries.

Numerical targets should be set only after at least 30 days of clean post-merge data.
