# CRM Implementation Roadmap

**Document status:** Recommended delivery sequence
**Source baseline:** `origin/main` / `81ff43f421187eb76ef6c732ee141a7084a73dc3`
**Related documents:** [Product Requirements](./CRM-PRODUCT-REQUIREMENTS.md), [Repository Audit](./CRM-REPOSITORY-AUDIT.md), [Data Model](./CRM-DATA-MODEL.md), [User Flows](./CRM-USER-FLOWS.md), [Permissions Matrix](./CRM-PERMISSIONS-MATRIX.md), [UI Information Architecture](./CRM-UI-INFORMATION-ARCHITECTURE.md), [Backlog](./CRM-BACKLOG.md), [Risks and Decisions](./CRM-RISKS-AND-DECISIONS.md)

## 1. Delivery strategy

Build the CRM inside the existing Next.js/Neon portal as an incremental modular monolith. Every phase is independently deployable, additive, permission-gated, observable, and reversible at the application level. Database rollback uses forward fixes or removal of unused additive objects; production data is never destructively rolled back.

The first production outcome is the **Initial CRM Foundation Slice**, not the complete CRM or the completed Commercial Foundation. It comprises:

- Teams, ownership, Companies, Contacts, Leads, Opportunities, Pipeline, Activities, Tasks, scoped search, audit, and idempotent website Quote Request conversion.
- An external quotation reference, controlled URL, and status bridge so Sales can track current spreadsheet/PDF quotations until the native quotation engine exists.
- No claim that import/export, saved views, automation, native costing/quotation/PDF, shipment handover, complaints, retention, Gmail, or WhatsApp integration is live.

No calendar estimate is assigned until staffing, capacity, production-data condition, and management decisions are confirmed. Complexity and dependency order are specified in the [Backlog](./CRM-BACKLOG.md).

## 2. Cross-phase release gates

Every production phase must pass all applicable gates:

1. **Repository gate:** current `origin/main` reviewed; relevant installed Next.js 16 documentation read; unrelated working-tree changes excluded.
2. **Database gate:** exact Neon target confirmed; backup/restore posture known; `migrate:check` passes; additive migration and expected-object checks validated on an isolated non-production branch.
3. **Security gate:** server-side capability, row-scope, field-scope, and denied-path tests pass. Customer-safe DTOs contain no supplier cost, margin, internal notes, or approval metadata.
4. **Quality gate:** focused tests, consolidated CRM test command, lint, type/build, migration source tests, and high-risk browser scenarios pass.
5. **Data gate:** any backfill/import has dry-run counts, duplicate review, errors, checksum, named approver, and reconciliation report.
6. **Operations gate:** runbook covers monitoring, support owner, rollback/forward-fix, and incident communication.
7. **Approval gate:** preview acceptance and explicit production/deployment approval are recorded. A successful local build is not production approval.

## 3. Phase overview

| Phase | Outcome | Production milestone |
|---|---|---|
| 0 — Readiness and stabilization | Safe source, database, migration, auth, test, and release baseline | No CRM business records yet |
| 1 — CRM foundation | Shared company/contact master, Leads, Activities, Tasks, ownership, search, audit, quote-request bridge | Foundation alpha |
| 2 — Sales pipeline | Opportunities, canonical stages, Kanban/table, dashboards, external quotation bridge, lost reasons | Commercial Foundation Release |
| 2B — Foundation expansion | Imports/exports, saved views, bulk actions, expanded reporting | Later Foundation enhancement; not part of initial deployment slice |
| 3 — Native freight quotations | Costing, rates, options, immutable versions, approval, PDF, sharing, acceptance | Quotation Release |
| 4 — Operational handover | Idempotent accepted-quotation conversion into existing shipment intake | Commercial-to-Operations Release |
| 5 — Finance, retention, and complaints | Authorized Finance projections, account health, inactivity, cases | Customer Lifecycle Release |
| 6 — Integrations and automation | Gmail, WhatsApp, automated website conversion, notifications, scheduled reports, portal integration | Automation Release |

## 4. Phase 0 — Readiness and stabilization

### Objectives

- Establish verified deployment/database truth and prevent accidental database mutation during ordinary builds.
- Lock the authorization model, migration discipline, test baseline, and production rollout process.
- Profile legacy customer and inquiry data without exposing record contents in documentation/logs.

### Dependencies and decisions

- Confirm who owns missing migration number `018`; absence in Git is not availability.
- Approve canonical CRM roles, team rules, and managers-only cost/margin visibility.
- Confirm production-data profiling authorization and named approver.
- Choose structured logging/error-monitoring provider or approve platform logs for Foundation.
- Confirm staging/preview and isolated Neon branch availability.

### Database and migration work

- Run `migrate:check` and read-only schema/object/checksum inventory against each approved environment.
- Compare live schema with `lib/db/schema.ts` and numbered migrations; record drift without changing it.
- Separate `npm run migrate` from the generic Vercel build, or create an explicit single-run release job with equivalent controls.
- Define CRM migration expected-object checks and an additive/expand-first convention.
- Profile only aggregate/null/duplicate distributions needed for Company bridge and Quote Request conversion; do not export customer data into planning artifacts.

### Backend work

- Define CRM module layering: domain rules, policy, data access/DTOs, Server Actions, and integration Route Handlers.
- Extend source-defined capability vocabulary and policy-test harness.
- Add a consolidated CRM-focused test command and disposable test-database configuration.
- Define audit action naming/redaction, request correlation, and security event boundaries.

### Frontend work

- Confirm portal shell extension points, responsive breakpoints, CSP coverage, error/loading boundaries, and reusable UI primitives.
- Produce an accessible prototype for mobile Lead follow-up and desktop pipeline; no persistent production data yet.

### Security work

- Test staff/customer token audience isolation, session revocation, login throttle, and retired admin paths.
- Prove that policy helpers deny by default and cannot be bypassed by direct Server Action invocation.
- Define safe DTO types for ordinary Sales and customer-facing output before cost fields exist.

### Tests

- Baseline relevant existing role, security, customer duplicate, quote request, shipment intake/idempotency, document, invoice/payment, lint, and build checks.
- Add policy table tests for every role/scope combination.
- Add migration-check tests for missing, drifted, and checksummed files.

### Main risks and mitigations

- **Wrong database target:** require human-readable environment fingerprint and read-only check before mutation.
- **Phase 0 becomes a rewrite:** only release blockers are mandatory; email-adapter, validation-library, and broader observability cleanup remain scoped debt unless a test proves them blocking.
- **Customer data ambiguity:** do not backfill until candidate counts and merge rules are approved.

### Definition of done

- Source, deployed commit, Neon target, migration history/schema drift, and extension availability are documented from read-only evidence.
- Migration execution is an explicit release gate, not an incidental ordinary build side effect.
- Role/field/row policy and redaction tests pass.
- Consolidated verification commands run deterministically in a clean checkout.
- Phase 1 migration, rollback/forward-fix, and production runbook are reviewed.

## 5. Phase 1 — CRM foundation

### Objectives

- Establish one neutral shared Company/Contact master bridged to legacy customers.
- Prevent Leads and follow-ups from being forgotten.
- Deliver unified commercial Activities/Tasks, ownership, basic scoped search, and audit.
- Preserve website Quote Request behavior and allow idempotent manual conversion to a Lead.

### Features

- Teams and memberships; Company, Company Role, Branch, Contact, Contact Role.
- Lead creation, assignment, qualification, disqualification, dormancy, and conversion readiness.
- Lead fields for freight service, route, commodity, cargo quantities, Incoterm, shipment timing/frequency/volume, target rate, priority, score, and follow-up.
- Activity timeline for calls, WhatsApp, email, meetings, site visits, notes, and status/assignment events.
- Tasks with owner, priority, due time, completion/cancellation, and overdue queues.
- Exact/scored duplicate candidates for Company and Contact with a manual review path; no automatic merge.
- Scoped Company/Contact/Lead/Activity/Task search and filters.
- Existing Quote Request detail links to “Create/View Lead”; unique source ID prevents duplicate conversion.

### Dependencies

- Phase 0 complete.
- Company/customer bridge and duplicate policy approved.
- Team membership rules and default assignment owner approved.
- Minimum qualification fields and lead-score weights decided or scoring marked advisory with a versioned default.

### Database changes

- Add teams/members, companies/roles/branches, contacts/roles, leads, activities/activity links, tasks/task links, and CRM audit support.
- Add partial unique/index/check constraints defined in the Data Model.
- Add a unique Quote Request source link on Lead; do not repurpose `quote_requests`.
- Add only the legacy customer bridge needed for coexistence; do not copy password hashes.

### Backend work

- Build scoped repositories returning minimal list/detail DTOs.
- Build shared normalization/duplicate-candidate service using existing customer helper concepts.
- Implement tested Lead transitions and idempotent Quote Request conversion transaction.
- Implement owner/team policy and reassignment audit.
- Implement Activity/Task linking with typed targets and a single timeline query.
- Keep CRM attachment support limited to the approved external-quotation/company/lead use cases if storage is included in this slice.

### Frontend work

- `/crm` overview plus `/crm/leads`, `/crm/companies`, `/crm/contacts`, `/crm/activities`, and `/crm/tasks` initial list/detail/create/edit routes. Website inquiries stay on `/quotes/{id}` for the initial bridge; a dedicated `/crm/inquiries` route remains backlog.
- Responsive form sections and mobile quick actions for status, call/WhatsApp log, follow-up task, and reassignment.
- Duplicate review dialog, overdue badges, empty/loading/error states, and archive confirmation.
- Preserve `/quotes` as current intake until an approved compatibility redirect exists.

### Security work

- Sales sees owned records; Sales Manager sees team records; Director and authorized Super Admin see all commercial records.
- Customer Service/Operations/Finance/Viewer receive only explicitly approved read/action capabilities.
- Internal notes, tax/compliance details, customer credentials, and attachment confidentiality are field-gated.
- Merge, archive/restore, reassignment across teams, and bulk export remain privileged/audited.

### Tests

- Company/contact normalization, duplicate scoring, false-positive review, archive/restore, and bridge uniqueness.
- Lead required fields, status transitions, score bounds, follow-up overdue calculation, and role/row scope.
- Quote Request conversion replay/concurrency creates one Lead.
- Activity/task typed links, timeline ordering, completion, reassignment, and denied access.
- Mobile keyboard/touch workflow and desktop accessibility smoke tests.

### Migration requirements

- Apply additive schema first; deploy compatibility reads; run an optional, separately approved customer-candidate dry run; no mandatory full backfill for first use.
- Verify row counts and constraints; rollback application routes/capabilities without dropping newly written records.

### Main risks and mitigations

- **Dual master:** one Company service owns shared edits; legacy writes are explicit compatibility snapshots.
- **Duplicate overblocking:** exact signals block; fuzzy signals require human review.
- **Sales adoption:** mobile quick follow-up and external quote link prevent spreadsheet-only invisible work.
- **Authorization drift:** all reads and actions go through server policy; test direct invocation.

### Definition of done

- Authorized staff can create, find, assign, update, and archive scoped Company/Contact/Lead records.
- Every open Lead has an owner and either a follow-up or valid exception.
- Overdue work is visible on mobile and desktop.
- One Quote Request converts at most once and retains source history.
- Audit covers creation, status, assignment, archive/restore, merge decisions, and restricted attachment access.
- Existing public Quote Request, customer portal, shipment, and Finance behavior remains verified.

## 6. Phase 2 — Sales pipeline and Commercial Foundation Release

### Objectives

- Move qualified commercial work into a freight-specific Opportunity pipeline.
- Give Sales and management an accurate, permission-scoped workload/value view.
- Track external spreadsheet/PDF quotations until Phase 3 replaces that bridge.

### Features

- Opportunity create from qualified Lead or authorized direct creation.
- Canonical stages: inquiry received, qualification, rate sourcing, costing, quotation draft, quotation sent, negotiation, verbal confirmation, won, lost, on hold.
- Opportunity table and accessible Kanban; owner/team/date/service/route/source filters and sorting.
- Probability, estimated sell value, expected close, next action, action due, lost reason, and activity history.
- External quotation reference, confidential attachment, status, sent/accepted evidence, and follow-up.
- Sales dashboard for new/qualified Leads, open pipeline, quotations sent (external status), overdue actions, won/lost, and weighted pipeline.
- Managers-only estimated cost/gross profit/margin projection if approved and test-protected.

### Dependencies

- Phase 1 complete and adoption feedback addressed.
- Canonical stage labels/order/probabilities and lost-reason taxonomy approved.
- High-value threshold and management dashboard visibility decided.

### Database changes

- Add pipeline-stage metadata and Opportunities with owner/team/Lead/Company/Contact links.
- Add external quotation bridge fields or a dedicated compatibility record plus confidential Attachment link.
- Add queue/pipeline/reporting indexes and terminal-state constraints.

### Backend work

- Implement Lead-to-Opportunity transaction; Lead becomes converted only when Opportunity creation succeeds.
- Implement stage/state transition rules, next-action enforcement, lost/won requirements, and reopen authorization.
- Build scoped pipeline aggregation. Ordinary Sales aggregation excludes cost/margin at SQL/DTO level.
- Calculate weighted pipeline from estimated selling value and probability; label it as an estimate, not booked revenue.

### Frontend work

- `/crm/opportunities`, `/crm/pipeline`, Opportunity detail, stage transition, won/lost/on-hold dialogs, and dashboard.
- Keyboard-accessible Kanban with a table alternative; server action validates every drag/drop transition.
- Mobile stage/follow-up actions; complex pipeline bulk actions remain desktop-recommended.

### Security work

- Sales cannot select, export, infer, or receive supplier cost/margin fields.
- Sales Manager, Director, Finance, and Super Admin may receive authorized cost/margin DTOs; Finance does not automatically gain mutation rights.
- Team aggregation hides out-of-scope record identity and confidential values.

### Tests

- Lead conversion transaction, multiple Opportunities over time, stage transition table, terminal-state fields, reopening, and concurrent updates.
- Own/team/all row scope for list, detail, dashboard, search, and direct action calls.
- Cost/margin absence in ordinary Sales serialized output and rendered HTML.
- Kanban/table parity, mobile workflows, and overdue/closing-date edge cases.

### Migration requirements

- Additive migration; no destructive Lead rewrite. Seed canonical pipeline stages transactionally.
- Existing Leads remain valid; qualified Leads can be converted after deployment.

### Main risks and mitigations

- **Pipeline/data mismatch:** stage transitions are server-owned and audited.
- **Premature won records:** require accepted external/native quotation evidence and Company linkage.
- **Metric misinterpretation:** distinguish estimated pipeline, accepted business, shipment revenue, invoice revenue, and cash receipts.

### Definition of done

- Qualified Lead converts atomically to a scoped Opportunity.
- Table and Kanban show the same authorized set and lifecycle.
- Open Opportunities have owner, next action, due time or valid exception, and expected close.
- Won/lost/on-hold records satisfy required evidence/reasons.
- External quotation references allow current commercial work to remain visible without pretending native quotations exist.
- Phase 1 and existing portal regression suites pass; production monitoring and support owner are active.

## 7. Phase 2B — Foundation expansion (later)

### Objectives and features

- Add staged CSV/XLSX import, safe CSV/XLSX export, mapping, dry-run validation, duplicate resolution, error reports, bulk assignment/status/follow-up, saved views, and expanded dashboards.
- This work is explicitly outside the initial Commercial Foundation deployment slice.

### Dependencies

- Stable Foundation data model and at least one approved source workbook sample per import type.
- Export permissions/retention and spreadsheet-cleaning ownership approved.

### Database/backend/frontend/security

- Add Import Job/Rows and Saved View entities; use checksummed idempotent commits.
- Parse files in a bounded server workflow; store originals privately; never partially commit an unapproved job.
- Provide mapping/validation/review/commit UI and downloadable sanitized error report.
- Permit exports only for explicit role/scope; audit filters, row count, and field set. Cost/margin exports remain manager-restricted.

### Tests and migration

- CSV/XLSX encoding, date/currency/phone normalization, invalid/malicious formula cells, duplicate candidates, retry, concurrent commit, and rollback transaction.
- Saved filter schema versioning and allow-list tests.
- Additive migration after Foundation production data is stable.

### Definition of done

- A dry run makes no business-record changes; approved commit is atomic/idempotent; errors are row-specific and exportable.
- Export contains only authorized rows/fields and is audited.
- Saved views cannot inject SQL or bypass scope.

## 8. Phase 3 — Native freight quotation system

### Objectives

- Replace external quotation tracking with structured freight costing and customer-ready immutable quotations.
- Protect supplier cost while supporting multiple routes/options/currencies, approval, PDF, sharing, expiry, and acceptance.

### Features

- Supplier Rates/Routes, charge basis/minimums, reusable templates, commodity/customer rules.
- Quotation, immutable Version, Options, Charges, currency/exchange-rate snapshots, taxes, validity, terms, exclusions.
- Approval based on discount/margin/total thresholds; rejection and revision.
- Customer-safe PDF, signed sharing, email/WhatsApp-ready link, accepted/rejected/expired/withdrawn/superseded states.
- Validity alerts and audit.

### Dependencies

- Approval thresholds, minimum margins, cost visibility, exchange-rate source, tax treatment, quotation terms, template/branding, acceptance evidence, and WhatsApp sharing method approved.
- Shared validation strategy selected and tested.

### Database changes

- Add Routes, Rates, Quotations, Versions, Options, Charges, Approvals, and share/acceptance evidence.
- Add immutable/version/one-accepted-version constraints and confidential indexes.

### Backend work

- Server-side charge calculation, rounding, currency conversion, margin, validity, version cloning, approval transitions, safe DTO projection, PDF generation, signed sharing, and expiry evaluation.
- Persist every rate/currency/customer/terms snapshot needed to reproduce a sent Version.

### Frontend work

- Progressive desktop costing workspace; mobile-safe status review and approval.
- Option comparison, charge editor, margin warning for authorized users, version history, approval inbox, preview, send, and acceptance state.

### Security work

- Physically separate internal costing DTOs from customer/PDF/share DTOs.
- Explicitly audit cost reveal/export, approval, generation, send, acceptance, withdrawal, and revision.
- Hash public share tokens; expire/revoke links; rate-limit external endpoints.

### Tests

- Charge bases/minimums, currencies/rounding, tax, negative/zero margins, version immutability, concurrent revision, approval thresholds/rejection, expiry, share token, PDF field leak, and customer acceptance replay.

### Migration requirements

- Additive native-quotation schema. External quotation records remain historical; optional manual association is audited, not silently transformed.

### Main risks and mitigations

- **Cost leak:** allow-listed customer DTO and PDF snapshot tests.
- **Incorrect financial calculation:** pure calculation engine, golden examples, currency rounding policy, approval snapshots.
- **Rate expiry:** validity checks at draft, approval, send, and acceptance; manager override requires reason.

### Definition of done

- A sent quotation can be reproduced byte-for-data from its immutable Version.
- Multiple options/routes/currencies calculate and reconcile correctly.
- Unauthorized roles cannot query or infer cost/margin.
- Approval and acceptance are idempotent, audited, and evidence-backed.

## 9. Phase 4 — Operational handover

### Objectives

- Convert accepted business into the existing shipment system without duplicate shipments or commercial-data drift.

### Features

- Handover checklist, immutable commercial snapshot, shipment intake draft, Operations review/activation, rejection back to Sales, and status visibility.

### Dependencies

- Phase 3 acceptance model stable.
- Required operational fields/checklist and Sales-versus-Operations correction ownership approved.

### Database changes

- Add unique commercial shipment link for Shipment, Opportunity, accepted Quotation Version, idempotency key, and handover snapshot.
- Avoid a duplicate Shipment or handover master.

### Backend/frontend/security

- Transactionally create or return the existing shipment intake result; retry/concurrency safe.
- Operations activates only after required checklist. Sales sees handover state, not operational internal fields outside permission.
- Provide handover preview, intake queue card, missing-field/reject flow, and linked navigation.

### Tests/migration/risks

- Repeated acceptance/conversion, concurrent calls, missing fields, unauthorized activation, rejected handover, voided shipment, and snapshot immutability.
- Additive link migration; existing shipments remain unlinked and valid.
- Mitigate responsibility confusion with explicit state owner and audit.

### Definition of done

- One accepted Quotation Version creates at most one existing Shipment in `intake`.
- Operations must activate; Sales cannot bypass readiness.
- Commercial snapshot remains unchanged even if master data/rates later change.

## 10. Phase 5 — Finance, retention, and complaints

### Objectives and features

- Show authorized invoice/payment/outstanding summaries without moving Finance truth into CRM.
- Add last shipment, frequency, revenue, gross profit, margin, service/route use, inactivity, account health, value, churn risk, recommended follow-up, open complaints/quotes/outstanding invoices.
- Add Complaint cases, SLA, ownership, root cause, corrective action, resolution, response, attachments, and escalation.

### Dependencies

- Finance defines authoritative revenue/payment/outstanding calculations and approves fields by role.
- Inactivity, health, churn, value, complaint SLA, and retention formulas are `Decision Required`.

### Database/backend/frontend/security

- Add Complaint entities and versioned derived-metric/materialized-view strategy only after query measurement.
- Read invoice/payment state from existing tables; active non-voided payments remain authoritative.
- Add account-health and complaint dashboards/timelines; label refreshed/calculation version.
- Finance details remain restricted; Customer Service receives only the fields needed to handle customers.

### Tests/migration/risks

- Partial/voided payments, archived invoices, no-shipment customers, stale refresh, complaint SLA/escalation, cross-role visibility, and linked shipment/invoice access.
- Additive complaint schema; derived views can rebuild without altering source records.
- Prevent metric disagreement by publishing definitions and reconciliation totals.

### Definition of done

- CRM values reconcile to authoritative Shipment/Finance queries for an approved sample.
- Scores show calculation version and freshness.
- Complaint lifecycle is owned, timed, auditable, and visible only to authorized roles.

## 11. Phase 6 — Integrations and automation

### Objectives and features

- Automatic website inquiry conversion/assignment, Gmail ingestion, WhatsApp provider integration, scheduled reminders/escalations, in-app/email notifications, customer portal quotation visibility/acceptance, scheduled reports, and provider health monitoring.

### Dependencies

- Stable entities/transitions, approved automation rules/quiet hours/escalation, provider procurement and data-processing terms, webhook security, message retention, and opt-in/consent policy.

### Database/backend/frontend/security

- Add provider connections, external IDs, webhook/event inbox, idempotency keys, retry/dead-letter state, delivery receipts, rule definitions/version, and execution history.
- Process incoming events through authenticated, signed, replay-protected handlers; no provider directly mutates business tables.
- Add integration health, retry, rule preview, and manual fallback UI.
- Encrypt tokens outside business tables; least-privilege scopes; audit connection/rule changes.

### Tests/migration/risks

- Signature validation, replay, out-of-order/duplicate events, provider outage/rate limit, token rotation, opt-out, quiet hours, escalation, and manual override.
- Additive integration/event schema; feature flags allow provider-by-provider rollback.
- Prevent automation spam with dry-run, dedupe, rate limits, and manager-visible execution history.

### Definition of done

- Integrations are idempotent, observable, revocable, and degrade to manual workflows.
- Every automated action shows its rule/version and can be audited.
- Customer portal exposes customer-safe quotation/shipment/Finance fields only.

## 12. Rollout and monitoring pattern

For each phase:

1. Merge additive schema/code behind capabilities or feature flags.
2. Apply migration to isolated staging Neon branch; run migration check, integration tests, build, and browser verification.
3. Run data dry run/backfill only when applicable; obtain named approval.
4. Deploy preview and conduct role-by-role acceptance on desktop and mobile.
5. Obtain production migration and deployment approval separately.
6. Apply production migration once; verify schema/checksum; deploy application; run no-cache smoke tests.
7. Monitor authorization denials, action failures, queue latency, conversion duplicates, database errors, and provider failures.
8. If application regression occurs, disable CRM capability/flag or roll back application while retaining additive data. If migration defect occurs, stop writes and forward-fix; do not drop production data reflexively.

## 13. Program-level definition of complete

The complete CRM program is done only when:

- The Lead → Opportunity → Quotation → Acceptance → Shipment → Invoice → non-voided Payment → Repeat Business path is traceable without duplicating operational or Finance truth.
- All modules enforce role, field, and own/team/all scope server-side.
- Supplier cost and margin never enter ordinary Sales or customer-facing DTOs, PDFs, APIs, exports, logs, or notifications.
- Every important status, ownership, approval, merge, archive/restore, export, import commit, sensitive reveal, and conversion is audited.
- Mobile users can perform core follow-up/review/approval tasks, while desktop-only complex work is clearly signposted.
- Imports/integrations are dry-run or replay safe and observable.
- Metrics are defined, reproducible, time-bounded, and reconciled to their authoritative sources.
- Production schema, deployment, runbooks, monitoring, backup posture, and support ownership are verified—not inferred from source.
