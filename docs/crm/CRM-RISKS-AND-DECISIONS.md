# Ambara Freight CRM — Risks and Decisions

**Document status:** Architecture and management decision register<br>
**Source-code baseline:** `origin/main` at `81ff43f421187eb76ef6c732ee141a7084a73dc3`<br>
**Production status:** Not established by this document; verify separately<br>
**Related documents:** [Product Requirements](./CRM-PRODUCT-REQUIREMENTS.md) · [Repository Audit](./CRM-REPOSITORY-AUDIT.md) · [Data Model](./CRM-DATA-MODEL.md) · [Roadmap](./CRM-IMPLEMENTATION-ROADMAP.md)

## 1. How to use this register

- **Accepted** means the architecture/product direction is fixed for this program unless new evidence requires a superseding decision.
- **Recommended** means the default implementation direction; it can proceed unless an authorized owner rejects it before its dependency gate.
- **Decision Required** means the repository cannot determine the business policy. Dependent implementation must stop at the documented boundary rather than invent an answer.
- Source-verified findings describe the checked repository commit only. They do not prove production schema, data, environment configuration, migrations, or deployment behavior.
- The first rollout is an **initial CRM foundation slice**, not the entire roadmap. Imports/exports, saved views, automation, native costing/quotation/PDF, shipment handover, complaints, and retention remain planned until separately delivered and verified.

## 2. Architecture decision register

| ID | Status | Decision | Why | Consequence |
|---|---|---|---|---|
| CRM-DEC-001 | Accepted | Extend the existing Next.js/Neon monolith incrementally. | Current portal already owns authentication, capabilities, customers, inquiries, shipments, Finance, R2, email, and PDFs. | No microservices or second CRM application in v1; reuse server-only data access and Server Actions. |
| CRM-DEC-002 | Accepted | Separate source verification from production verification. | Repository files cannot prove applied migrations, live data, or deployment. | Every audit/release statement names its evidence class; production rollout requires its own preflight and smoke tests. |
| CRM-DEC-003 | Recommended | Add a neutral Company master; retain `customers` as a compatibility/customer-account layer linked by `company_id`. | Existing `customers` mixes identity, portal credentials, invoice code, and transaction links and is unsuitable as a universal vendor/airline/agent master. | Backfill is staged; Company becomes the editable identity master only after profiling and compatibility controls. |
| CRM-DEC-004 | Accepted | Keep Leads and Opportunities separate. | Qualification and forecastable commercial pursuits have different states, metrics, and cardinality. | A qualified Lead may create one or more distinct Opportunities; quotation/win/loss stages do not remain on the Lead. |
| CRM-DEC-005 | Accepted | Treat existing `quote_requests` as website inquiry intake, not freight Quotations. | It lacks costing, options, immutable versions, approval, and customer-document controls. | Preserve `/quotes`; add an idempotent source-to-Lead bridge; native Quotations are separate in Phase 3. |
| CRM-DEC-006 | Accepted | Keep Quotations, Quotation Versions, supplier Rates, shipment rates, and Shipments separate. | Reusable current rates and operational rate fields cannot preserve a customer offer’s historical commercial snapshot. | Links provide traceability; accepted Versions snapshot applied values and never derive history from mutable rates. |
| CRM-DEC-007 | Accepted | Store each submitted/sent Quotation Version as immutable. | Audit, approval, customer acceptance, and dispute handling require exact historical terms. | Revisions clone to a new draft; approval/acceptance binds to exact version/checksum. |
| CRM-DEC-008 | Accepted | Keep permission keys code-defined; store assignments, teams, membership, ownership, and grants in the database. | Arbitrary runtime-editable permissions are high-risk; static-only ownership is too inflexible. | Permission changes require code review; organizational changes do not. Every request checks capability + record + field + state. |
| CRM-DEC-009 | Accepted | Supplier cost, gross profit, and margin are visible only to Super Admin, Director, Sales Manager, and Finance. | Management locked the confidentiality boundary. | Sales, Customer Service, Operations, Viewer, Legacy Admin, and public/customer DTOs omit these fields entirely. Cost export remains more restrictive. |
| CRM-DEC-010 | Accepted | Accepted commercial work creates the existing Shipment in gated `intake`; do not create a parallel handover/shipment system. | Current Shipments already have operational stage, readiness, tasks, ownership, packages, and idempotency support. | Phase 4 adds commercial links/snapshot and Operations confirmation; one accepted source produces one Shipment intake. |
| CRM-DEC-011 | Accepted | Existing invoice/payment logic remains authoritative for Finance. | A second CRM balance/payment state would drift and weaken audit/void rules. | CRM reads safe summaries/references and never independently marks an invoice paid. |
| CRM-DEC-012 | Recommended | Reuse R2 upload/download infrastructure for generic CRM attachments, with a distinct CRM metadata model. | Existing shipment documents show useful private-storage, validation, checksum, version, and signed-download patterns. | CRM attachments remain separate from shipment documents and inherit record authorization. |
| CRM-DEC-013 | Recommended | Use one Activity model plus typed link rows; use Tasks for future work. | A unified timeline is needed without adding nullable foreign keys for every entity. | Link integrity/allowed combinations are server-validated; Activity remains historical and Task remains actionable. |
| CRM-DEC-014 | Recommended | Make in-app notification canonical; add selected email escalation later. | Business state should not depend on external provider delivery. | Durable in-app state survives email failure; provider attempts are retryable/deduplicated. |
| CRM-DEC-015 | Accepted | Use Postgres search first; no external search engine in v1. | Current scale and architecture do not justify another service. | Normalize/index fields, bound results, and add `pg_trgm` only after extension support/query evidence. |
| CRM-DEC-016 | Recommended | Migrate spreadsheets through staged dry-run jobs, not direct inserts. | Unknown spreadsheet quality and duplicates make one-step imports unsafe. | Mapping, validation, duplicate review, error reports, approval, idempotency, and audited commit are prerequisites to CRM imports. |
| CRM-DEC-017 | Decision Required | Approve production Company/customer data profile and migration/backfill strategy. | Source schema cannot reveal actual duplicates, nulls, portal usage, or transaction cardinality. | Company compatibility migration/backfill cannot move past a reversible pilot until approved. |
| CRM-DEC-018 | Decision Required | Set quotation approval thresholds, minimum margin, discount/exception authority, and self-approval rules. | These are management policies, not technical facts. | Phase 3 can build versioned policy interfaces, but cannot activate final approval routing without values/owners. |
| CRM-DEC-019 | Decision Required | Approve team topology, managers, cross-team collaboration, and branch visibility. | Repository roles do not reveal the intended sales organization. | Default own/team scopes can be built; assignments/rollout require approved mappings. |
| CRM-DEC-020 | Decision Required | Approve Lead qualification factors, weights, minimum gate, and override policy. | Freight fit and business priority require commercial judgment. | Initial slice may capture fields/status; automated score and qualification enforcement wait for policy. |
| CRM-DEC-021 | Decision Required | Define inactivity, retention, account-health, churn, and customer-value rules. | Different services/frequencies need different thresholds. | Phase 5 metrics/alerts remain inactive until definitions, data freshness, and owners are approved. |
| CRM-DEC-022 | Decision Required | Set retention periods, legal holds, purge process, and sensitive-access audit duration by data class. | Privacy, Finance, operational, and commercial records have different obligations. | Archive works first; irreversible purge remains disabled until policy/legal review. |
| CRM-DEC-023 | Decision Required | Identify authoritative spreadsheets, owners, cleansing rules, cutover date, and reconciliation sign-off. | “Existing spreadsheets” is not enough to choose field precedence or deduplicate safely. | Import tooling may be built later; production migration cannot commit without a signed source inventory. |
| CRM-DEC-024 | Decision Required | Select Gmail, WhatsApp, and scheduled-notification providers plus consent/retention rules. | Provider/account/channel policy is external to the repo. | Manual logging and in-app notifications remain the default; Phase 6 waits. |
| CRM-DEC-025 | Decision Required | Confirm ownership/reservation of absent migration number `018`. | Source contains 017 and 019 but no 018; absence does not prove availability. | New CRM migrations use an unambiguous later number and must not create/apply 018 without reconciliation. |
| CRM-DEC-026 | Decision Required | Approve FX source, quote-time rate, reporting conversion, rounding, and manual override policy. | Multi-currency totals/margins are financially material. | Phase 3 cannot issue production quotations until calculations are deterministic and versioned. |
| CRM-DEC-027 | Decision Required | Approve complaint priority/severity, SLA pause, escalation, resolution, and closure rules. | Service expectations and responsible owners are business policy. | Complaint data model can be planned; Phase 5 workflow/automation waits. |
| CRM-DEC-028 | Decision Required | Set high-value opportunity threshold, currency basis, recipients, and escalation timing. | A generic threshold would create noise or miss material deals. | High-value alerts remain off until policy is approved. |
| CRM-DEC-029 | Decision Required | Define mandatory NIB/tax/compliance/credit fields and edit roles by Company role/lifecycle stage. | Requirements differ for prospects, customers, vendors, agents, and carriers. | Initial Company record permits staged completeness; qualification/activation gates wait for approved rules. |

## 3. Decision detail and rejected alternatives

### CRM-DEC-003 — Company master and legacy Customer compatibility

**Chosen direction:** `companies` is a neutral organization master with roles and Contacts. Existing `customers` remains a linked compatibility/customer account during staged migration.

**Rejected alternatives**

- **Use `customers` unchanged for every organization:** rejected because portal password/session, invoice code, individual contact fields, and existing customer semantics would couple vendors/airlines/agents to customer-only behavior.
- **Build an unrelated CRM Company table with no compatibility link:** rejected because it creates two editable customer identities and breaks transaction traceability.
- **Rewrite all existing consumers in one migration:** rejected because production data/state is unverified and rollback risk is too high.

**Migration guardrail:** before Company becomes authoritative for edits, profile production read-only; match/backfill; review duplicates; run compatibility reads/writes in staging; pilot a bounded cohort; reconcile counts/links; then remove conflicting forms incrementally.

### CRM-DEC-005/006/007 — Inquiry, Opportunity, Quotation, and rate separation

The repository’s `quote_requests` is valuable intake and must be reused, but naming it a Quotation would make an inquiry status look like an approved offer. Native quotation requires:

- One Opportunity to many Quotations.
- One Quotation to immutable numbered Versions.
- One Version to multiple Options and charge lines.
- Optional links to reusable supplier Rates.
- Exact customer-safe snapshots and approval/acceptance history.

Shipment rates remain operational facts; supplier Rates remain reusable inputs; neither mutates a sent customer Version.

### CRM-DEC-008/009 — Authorization and commercial confidentiality

**Rejected alternatives**

- **Role label checks scattered through pages:** rejected because writes/downloads/search/aggregates can diverge.
- **Fetch all fields and hide cost columns in React:** rejected because RSC/network/client state would expose confidential values.
- **Give Sales cost access only for owned Opportunities:** rejected because management locked Sales out of cost/margin entirely.
- **Fully database-editable permission definitions in v1:** rejected because it makes high-impact capabilities mutable without source review/testing.

Use one server-side policy/data-access layer and explicit DTO projection. Audit explicit cost reveals and sensitive exports without copying rate values into logs.

### CRM-DEC-010/011 — Operations and Finance boundaries

CRM ends at a commercially accepted, reviewable handover. Operations owns activation/execution. Finance owns invoice/payment truth. Rejected alternatives are a second handover/shipment record tree and CRM-maintained payment status; both would create reconciliation failures.

### CRM-DEC-013 — Timeline structure

Use immutable-ish Activities for completed history, mutable-state Tasks for work, and typed Activity links for the unified timeline. Rejected alternatives are one free-text note column per record and a wide activity table with many nullable entity foreign keys.

## 4. Build-versus-buy assessment

| Capability | Recommendation | Rationale | Revisit trigger |
|---|---|---|---|
| Core freight CRM | Build in existing app | Domain-specific route/cargo/quotation/handover and existing portal integration dominate generic CRM benefits. | Maintenance burden exceeds internal capacity or requirements converge on a mature CRM without unsafe duplication. |
| Authentication/RBAC | Extend current initially | Existing staff auth/capabilities are integrated; a wholesale auth switch expands risk. | SSO/MFA/compliance or multi-business-unit requirements justify a dedicated IdP project. |
| Email delivery | Reuse existing provider for selected notifications; Gmail integration later | Resend exists for application email; inbox sync has different OAuth/threading needs. | CRM-DEC-024 approved and manual logging becomes a measurable bottleneck. |
| WhatsApp | Buy/provider integration later | Template approval, consent, webhooks, delivery states, and provider policy should not be recreated. | CRM-DEC-024 approved with business account/provider. |
| Object storage | Reuse R2-compatible infrastructure | Existing private storage/signed-download pattern minimizes new surface. | Compliance/retention/region requirements cannot be met. |
| PDF quotation | Reuse `pdf-lib` pattern | Existing application has PDF generation and requires exact customer-safe snapshots. | Template complexity/volume warrants a specialized renderer after Phase 3 evidence. |
| Search | Build on Postgres | Least complexity and consistent row-level authorization. | Measured query/index limits at production-like volume. |
| Workflow/jobs | Start with database-backed idempotent jobs/outbox | Keeps business transactions traceable without a new platform. | Sustained volume/retry/duration exceeds database job approach. |
| Reporting/BI | Build operational dashboards; evaluate BI later | Daily work needs transactional permissions and drill-through. | Cross-system historical analytics/data warehouse becomes necessary. |
| Spreadsheet migration | Build constrained staging workflow; use parsing libraries | Ambara-specific mapping/dedupe/approval matters more than a generic uploader. | Very large recurring feeds justify managed ETL. |

## 5. Risk register

Scales: likelihood `L/M/H`; impact `M/H/Critical`.

| ID | Risk | Likelihood | Impact | Mitigation / release gate | Owner |
|---|---|---:|---:|---|---|
| CRM-RISK-001 | Source schema differs from production/applied migrations. | H | Critical | Read-only `migrate:check`, schema inventory, migration history, staging rehearsal, and explicit source-vs-live report before write migration. | Tech lead / release owner |
| CRM-RISK-002 | Neutral Company and legacy Customer drift into dual masters. | H | Critical | Link explicitly; one Company service; staged backfill; compatibility tests; source-of-truth banner; disable conflicting edits before cutover. | Product + Tech + Finance |
| CRM-RISK-003 | Duplicate/merge damages portal, shipment, or invoice references. | M | Critical | Preview all dependencies, choose survivor/field winners, transactional re-link, alias/redirect, dedicated credential/session rule, audit, restore/forward-fix plan. | Data steward + Tech |
| CRM-RISK-004 | Legacy role mapping grants unintended CRM authority. | H | Critical | Default deny; keep `admin` as Legacy Admin; management-approved account mapping; role-by-role authenticated negative tests. | Super Admin + Director |
| CRM-RISK-005 | Supplier cost/margin leaks through RSC, search, exports, PDF, logs, notifications, or error payloads. | M | Critical | Server DTO allowlists, dedicated permissioned queries, structural absence tests, safe logs, export separation, fail-closed PDF/API checks. | Security owner + Tech |
| CRM-RISK-006 | Row-scope leak through counts/aggregates or duplicate search. | M | Critical | Apply scope before aggregation; minimal duplicate candidate DTO; neutral not-found/forbidden behavior; cross-owner tests. | Tech lead |
| CRM-RISK-007 | Mutable quotation history causes pricing disputes. | M | Critical | Immutable submitted Versions, checksum-bound approval/acceptance, revision cloning, customer Version number in all artifacts. | Sales Manager + Tech |
| CRM-RISK-008 | FX/rounding/minimum-charge errors distort margin or customer total. | H | Critical | CRM-DEC-026; pure tested calculation functions; snapshotted source/rate/time; reconciliation examples; block issuance on mismatch. | Finance + Director |
| CRM-RISK-009 | Accepted quotation and Operations execution diverge. | M | Critical | Immutable commercial snapshot, structured handover, clarification flow, explicit commercial-change process, no silent Shipment edits to agreed scope. | Sales Manager + Operations lead |
| CRM-RISK-010 | Retried conversion creates duplicate Shipments. | M | Critical | Unique idempotency key, atomic transaction, return existing winner, concurrency tests, duplicate legacy review. | Tech + Operations |
| CRM-RISK-011 | CRM Finance summary disagrees with invoice/payment ledger. | M | Critical | Use existing authoritative queries/DTOs; no CRM balance column; reconciliation tests; freshness indicators. | Finance + Tech |
| CRM-RISK-012 | Spreadsheet import creates duplicates or silently loses rows. | H | High | Source inventory, normalization, dry-run, duplicate review, stable row results, idempotency, audited commit/error report, reconciliation sign-off. | Data owner |
| CRM-RISK-013 | Users revert to spreadsheets/WhatsApp because capture is slow. | H | High | Mobile-first core path, minimal stage-based required fields, manual channel logging, My Work queue, pilot with Sales/CS, observe completion time. | Product + Sales Manager |
| CRM-RISK-014 | Mobile UI supports reading but not real follow-up work. | M | High | 360 px acceptance flows, card lists, visible stage action without drag, sticky activity/task actions, real-device pilot. | UX + QA |
| CRM-RISK-015 | Automation creates duplicate/noisy reminders. | M | High | Keep automation out of initial slice; approve policies; idempotent evaluation/outbox; dedupe windows; per-rule metrics/kill switch. | Product + Tech |
| CRM-RISK-016 | Email/WhatsApp failure is misreported as customer contact. | M | High | Manual/integrated labels; provider IDs; delivery state; in-app canonical; failure/retry visible; no false `sent`. | Customer Service + Tech |
| CRM-RISK-017 | Attachment exposes private documents or malware. | M | Critical | Private storage, signature/type/size validation, checksum, authorized signed download, scan/quarantine when supported, no raw public URL. | Security + Tech |
| CRM-RISK-018 | Search becomes slow or leaks inaccessible entities. | M | High | Postgres indexes/normalized fields, bounded grouped results, scope-first query, query plans at production-like volume, no external service initially. | Tech lead |
| CRM-RISK-019 | Audit is either incomplete or too noisy to use. | M | High | Define business audit events; separate telemetry; audit explicit sensitive reveal/export; retention policy; test immutable action history. | Security + Product |
| CRM-RISK-020 | Personal/financial records are retained or purged incorrectly. | M | Critical | CRM-DEC-022, classify data, archive first, legal hold, controlled purge, backups/restore evidence, no interactive hard delete. | Management + Finance |
| CRM-RISK-021 | Migration numbering/order conflicts, especially absent 018. | H | Critical | CRM-DEC-025; use unambiguous later number; preflight/checksum/order tests; never create/apply 018 until ownership confirmed. | Tech/release owner |
| CRM-RISK-022 | Dashboards mix forecast and actual or currencies/timezones. | H | High | Metric dictionary, WIB boundaries, forecast labels, authoritative actuals, FX basis, freshness, cohort/inclusion details. | Product + Finance |
| CRM-RISK-023 | UI/copy implies guaranteed customs clearance or unconditional DDP/undername eligibility. | M | High | Approved cautious language; case-by-case readiness; conditional charges; terms review; no automated regulatory promises. | Management + Operations |
| CRM-RISK-024 | CRM work expands into rewrite/microservices/multi-tenancy. | M | High | Phase gates, monolith ADR, explicit out-of-scope, measurable trigger required for architectural expansion. | Product + Tech |
| CRM-RISK-025 | Documentation/roadmap items are mistaken for deployed behavior. | H | High | Initial-slice status table, deployment evidence, route/action smoke list, release notes only from verified live state. | Release owner |
| CRM-RISK-026 | Initial foundation slice is called complete while imports/saved views/automation are absent. | H | Medium | Name release “Initial CRM Foundation Slice”; track Phase 2B backlog explicitly; do not show dead controls/navigation. | Product |
| CRM-RISK-027 | Concurrent stage/owner/task edits silently overwrite work. | M | High | Version/update preconditions, atomic next-action Task changes, conflict UI, concurrency tests. | Tech lead |
| CRM-RISK-028 | Team reorganization rewrites historical performance or access. | M | High | Current membership for access; owner/team snapshots for historical metrics; audited reassignment; inactive-user transfer report. | Sales Manager + Tech |

## 6. Data-migration controls

No production migration should proceed from spreadsheet assumptions alone.

1. Inventory each source file, sheet, owner, date range, field meaning, row count, update frequency, and authoritative status.
2. Create encrypted/controlled working copies; do not commit private customer/rate data to Git.
3. Profile nulls, duplicates, encoding, currencies, date formats, identifiers, phone/email, Company aliases, owner names, stages, and formulas.
4. Approve source precedence per field/entity under CRM-DEC-023.
5. Normalize into staged rows; preserve source file fingerprint, sheet, and row number.
6. Match Companies/Contacts using exact identifiers first and fuzzy signals only for review.
7. Dry-run references, enums, permissions, required fields, and duplicate decisions without business-record writes.
8. Pilot a bounded cohort; reconcile source rows to created/matched/rejected/skipped counts.
9. Commit through idempotent audited jobs and preserve error reports.
10. Freeze/cut over the source or define ongoing ownership; otherwise spreadsheets and CRM will diverge immediately.

## 7. Rollout and approval gates

### Gate A — Source and production readiness

- Clean source baseline identified.
- Production schema/migrations/data profile read-only evidence captured.
- CRM-DEC-025 resolved or new migration numbering avoids the conflict.
- Backup/restore and migration forward-fix plan reviewed.

### Gate B — Initial CRM foundation slice

- Core Company/Contact/Lead/Opportunity/Activity/Task/ownership/search/audit and quote-request bridge implemented and tested.
- Existing customer/quote-request/shipment/Finance/public behavior regression-tested.
- Role mapping approved for the pilot; Legacy Admin gains no implicit CRM access.
- Imports/exports, saved views, automation, native quotation, handover, complaints, and retention are absent from “live” claims.

### Gate C — Staging and security

- Migration preflight and staging migration pass.
- Authenticated positive/negative tests for each deployed role/scope.
- Sales cost/margin structural-absence tests pass across pages, actions, search, audit, and payloads.
- 360 px, keyboard, empty/error/conflict, duplicate, and idempotency scenarios pass.

### Gate D — Production rollout

- Named release owner and maintenance window.
- Apply only reviewed migrations in order; stop on mismatch.
- Deploy matching application commit.
- Smoke exact routes/actions for intended roles and existing public/customer surfaces.
- Monitor server errors, auth denials, migration health, and core transaction counts.

### Gate E — Post-deployment verification

- Verify live deployment identity/commit and no-cache behavior where relevant.
- Create/read/update/archive/restore representative non-sensitive pilot records.
- Convert one controlled quote request twice and prove idempotency.
- Verify cross-owner denial and cost/margin absence.
- Confirm existing Operations/Finance/customer/public routes.
- Record limitations and rollback/forward-fix decision.

Later quotation, handover, retention, complaint, import, and integration phases have separate gates in the roadmap.

## 8. Rollback and containment triggers

Pause or roll back/forward-fix immediately when any of these occur:

- Supplier cost, margin, password/session data, internal notes, or inaccessible record data appears in an unauthorized payload or artifact.
- Migration checksum/order/schema differs from the reviewed preflight.
- CRM write corrupts or breaks existing Customer, Shipment, Invoice, Payment, authentication, or public tracking behavior.
- Duplicate website conversion or accepted-source conversion defeats idempotency.
- Role mapping grants a user broader scope than approved.
- Record counts/references fail migration reconciliation beyond the approved tolerance.
- Error rate or latency prevents core Operations/Finance/customer workflows.

Containment order: disable affected CRM mutation/navigation where possible, preserve evidence, stop automation/jobs, protect existing authoritative modules, then choose rollback or forward fix based on migration reversibility. Never repair production records ad hoc without an approved, auditable remediation plan.

## 9. Management approval checklist

Before each dependent phase, management records owner, chosen option/value, effective date, and approver for every `Decision Required` item:

- [ ] CRM-DEC-017 — production profile/backfill.
- [ ] CRM-DEC-018 — quotation approvals/margin/discount policy.
- [ ] CRM-DEC-019 — teams and cross-team access.
- [ ] CRM-DEC-020 — Lead score/qualification.
- [ ] CRM-DEC-021 — retention/inactivity/account health.
- [ ] CRM-DEC-022 — retention/purge/audit duration.
- [ ] CRM-DEC-023 — spreadsheets and cutover.
- [ ] CRM-DEC-024 — communication providers/consent.
- [ ] CRM-DEC-025 — migration 018 ownership.
- [ ] CRM-DEC-026 — FX and rounding.
- [ ] CRM-DEC-027 — Complaint SLA/escalation.
- [ ] CRM-DEC-028 — high-value alerts.
- [ ] CRM-DEC-029 — mandatory Company compliance/credit fields.

An unchecked item blocks only its dependent behavior; it does not block safe, independent work already covered by accepted decisions.
