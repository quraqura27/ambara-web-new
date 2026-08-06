# CRM Prioritized Backlog

**Document status:** Ordered implementation backlog; planned items are not evidence of live functionality
**Source baseline:** `origin/main` / `81ff43f421187eb76ef6c732ee141a7084a73dc3`
**Related documents:** [Product Requirements](./CRM-PRODUCT-REQUIREMENTS.md), [Repository Audit](./CRM-REPOSITORY-AUDIT.md), [Data Model](./CRM-DATA-MODEL.md), [User Flows](./CRM-USER-FLOWS.md), [Permissions Matrix](./CRM-PERMISSIONS-MATRIX.md), [UI Information Architecture](./CRM-UI-INFORMATION-ARCHITECTURE.md), [Implementation Roadmap](./CRM-IMPLEMENTATION-ROADMAP.md), [Risks and Decisions](./CRM-RISKS-AND-DECISIONS.md)

## 1. Backlog rules

### Priority

- **P0 — Critical:** release/security/data prerequisite or required for a coherent Foundation workflow.
- **P1 — High:** required to complete the named phase/release.
- **P2 — Medium:** important enhancement after the core release is stable.
- **P3 — Later:** integration, optimization, or optional capability with a manual fallback.

### Complexity

- **S:** isolated change with known patterns.
- **M:** one subsystem with focused schema/UI/policy/test work.
- **L:** cross-layer feature with migration, authorization, and several states.
- **XL:** multi-module workflow, external provider, complex calculations, or material data migration.

Complexity is not a calendar estimate. Suggested order is a dependency sequence, not a deadline.

In the dependency column, a bare number refers to the **Order** column; a named dependency omits only the common `CRM-` prefix (for example, `SECURITY-002` means `CRM-SECURITY-002`).

### Release labels

- **P0 Readiness:** must finish before production CRM writes.
- **Foundation 1:** Company/Contact/Lead/Activity/Task core.
- **Foundation 2:** Opportunity/Pipeline and external quotation bridge; completes the initial Commercial Foundation Release.
- **Foundation 2B:** later imports/exports/saved views/bulk expansion—not part of the initial deployment slice.
- **Quotation 3, Handover 4, Lifecycle 5, Automation 6:** later releases; none should be presented as live in the initial deployment.

## 2. Epic index

| Epic | Outcome | Phase |
|---|---|---|
| CRM-EPIC-001 — Readiness, security, and release safety | Verified environment, explicit migration gate, scoped authorization, test/observability baseline | 0 |
| CRM-EPIC-002 — Shared Company and Contact master | Neutral master bridged safely to legacy customers | 1 |
| CRM-EPIC-003 — Lead and inquiry management | Freight-specific intake, qualification, ownership, follow-up, idempotent website conversion | 1 |
| CRM-EPIC-004 — Activities, Tasks, and notifications | Unified commercial timeline and accountable next actions | 1 and 6 |
| CRM-EPIC-005 — Opportunity and pipeline | Forecastable pursuits, table/Kanban, external quotation bridge, dashboards | 2 |
| CRM-EPIC-006 — Native freight quotation | Rates, costing, immutable options/versions, approval, PDF, sharing, acceptance | 3 |
| CRM-EPIC-007 — Operational handover | One accepted commercial source creates one existing shipment intake | 4 |
| CRM-EPIC-008 — Finance, retention, complaints, and reporting | Trusted lifecycle summaries and service recovery | 5 |
| CRM-EPIC-009 — Search, import, export, bulk, and saved views | Governed data discovery and migration/productivity tools | 1 and 2B |
| CRM-EPIC-010 — Integrations and automation | Reliable provider-backed communications and rule execution | 6 |

## 3. CRM-EPIC-001 — Readiness, security, and release safety

| Order | ID / feature | User story | Pri | Dep. | Size | Release | Acceptance criteria / requirement trace |
|---:|---|---|:---:|---|:---:|---|---|
| 1 | **CRM-PLATFORM-001 — Source baseline** | As an implementer, I want a clean current-main baseline so CRM changes exclude unrelated work. | P0 | — | S | P0 Readiness | Exact commit recorded; relevant Next.js 16 installed guides reviewed; change inventory excludes unrelated files; clean build inputs are reproducible. `CRM-NFR-MAINT-001` |
| 2 | **CRM-PLATFORM-002 — Read-only environment inventory** | As release owner, I want the deployed commit, Neon target, schema, extensions, and migration history verified before any mutation. | P0 | 001 | M | P0 Readiness | Read-only report identifies environment without secrets/data; schema/checksum drift is explicit; source claims are not presented as production truth. `CRM-NFR-MAINT-002` |
| 3 | **CRM-PLATFORM-003 — Migration release gate** | As release owner, I want migrations separated from ordinary builds so deploys cannot mutate the wrong database. | P0 | 002 | L | P0 Readiness | Generic build performs no unintended DB mutation; isolated migration job checks target, checksum, expected objects, and approval; missing `018` ownership is resolved before number allocation. `CRM-NFR-MAINT-002` |
| 4 | **CRM-SECURITY-001 — CRM permission vocabulary** | As security owner, I want code-defined CRM capabilities so access changes are reviewable. | P0 | 001 | M | P0 Readiness | Capabilities cover module/action/export/approve/cost/margin/settings; unknown capability denies; role defaults match the Permissions Matrix. `CRM-NFR-SEC-001`, `002` |
| 5 | **CRM-SECURITY-002 — Row/field policy engine** | As a Director, I want own/team/all scope and confidential fields enforced server-side. | P0 | 004 | L | P0 Readiness | Every repository/action accepts policy context; ordinary Sales never receives cost/margin; direct action invocation and aggregate/search denial tests pass. `CRM-NFR-SEC-001`, `003`; `CRM-FR-OPPORTUNITY-003` |
| 6 | **CRM-PLATFORM-004 — Consolidated test command** | As an implementer, I want deterministic CRM verification so releases are auditable. | P0 | 001 | M | P0 Readiness | One documented command runs CRM unit/policy/source tests; DB integration target is isolated; lint and build gates are documented; failures stop release. `CRM-NFR-MAINT-001`, `002` |
| 7 | **CRM-AUDIT-001 — Shared audit writer** | As an auditor, I want important CRM actions recorded consistently and safely. | P0 | 004 | M | Foundation 1 | Append-only event includes actor/action/entity/time/reason/correlation/source and redacted metadata; required actions are covered; secrets/full cost payloads are rejected. `CRM-NFR-SEC-004` |
| 8 | **CRM-PLATFORM-005 — Structured logs and release runbook** | As support owner, I want correlated, redacted errors and recovery steps. | P1 | 002, 006 | M | P0 Readiness | Logs contain safe correlation/error category; no credentials/private notes/costs; runbook defines monitoring, capability/feature rollback, forward-fix, and escalation. `CRM-NFR-OBS-001`, `002` |

## 4. CRM-EPIC-002 — Shared Company and Contact master

| Order | ID / feature | User story | Pri | Dep. | Size | Release | Acceptance criteria / requirement trace |
|---:|---|---|:---:|---|:---:|---|---|
| 9 | **CRM-COMPANY-001 — Company/role/branch schema** | As commercial staff, I want one neutral organization record that can represent customer and partner roles. | P0 | PLATFORM-003, SECURITY-002, AUDIT-001 | L | Foundation 1 | Additive tables/constraints/indexes match Data Model; a Company can have multiple roles; branches support one head office; archive metadata is complete. `CRM-FR-COMPANY-001`, `002` |
| 10 | **CRM-CONTACT-001 — Contact/role schema** | As commercial staff, I want people separate from organizations with operational relationship roles. | P0 | COMPANY-001 | M | Foundation 1 | Contact requires name plus communication channel; branch/company consistency enforced; multiple contact roles supported; normalized lookup indexes exist. `CRM-FR-CONTACT-001`, `002` |
| 11 | **CRM-COMPANY-002 — Scoped Company UI/actions** | As Sales, I want to create and maintain assigned Companies from desktop or mobile. | P0 | COMPANY-001, SECURITY-002 | L | Foundation 1 | Authorized create/list/detail/edit/archive/restore works for own/team/all scope; required validation and conflict state shown; actions audited. `CRM-FR-COMPANY-001`; `CRM-NFR-MOBILE-001` |
| 12 | **CRM-CONTACT-002 — Scoped Contact UI/actions** | As Sales, I want to manage decision-maker, quotation, billing, and Operations contacts. | P0 | CONTACT-001, COMPANY-002 | L | Foundation 1 | Contact CRUD/roles and Company timeline links work; unauthorized Company/Contact existence is not leaked; mobile call/WhatsApp actions are usable. `CRM-FR-CONTACT-001`–`004` |
| 13 | **CRM-COMPANY-003 — Legacy customer bridge** | As portal/Finance owner, I want CRM Companies linked without breaking existing customer references or credentials. | P0 | PLATFORM-002, COMPANY-001 | XL | Foundation 1 | One active Company maps to at most one legacy customer; no password hash copied; existing shipment/invoice/client flows regress cleanly; ambiguous backfill is not auto-committed. `CRM-FR-COMPANY-003`, `004` |
| 14 | **CRM-COMPANY-004 — Duplicate candidate service** | As Sales, I want duplicate warnings before creating another Company/Contact. | P0 | COMPANY-001, CONTACT-001 | M | Foundation 1 | Exact tax/approved unique identifiers block; normalized names/domains/email/phone score candidates; fuzzy results warn rather than auto-merge; tests include Indonesian phone normalization/shared inboxes. `CRM-FR-COMPANY-005`; `CRM-FR-CONTACT-003` |
| 15 | **CRM-COMPANY-005 — Merge preview and execution** | As an authorized manager, I want to merge confirmed duplicates without losing history. | P2 | 013, 014, PLATFORM-005 | XL | Foundation 2B | Preview selects survivor/field winners/link counts; commit is transactional/idempotent; transaction history retained; aliases/redirects and full audit written; ordinary Sales denied. `CRM-FR-COMPANY-006` |
| 16 | **CRM-COMPANY-006 — Relationship history panel** | As account owner, I want permitted commercial and operational history on the Company. | P1 | CONTACT-002, LEAD-004, OPPORTUNITY-003 | L | Foundation 2 | Company detail links authorized inquiries/Leads/Opportunities/activities and existing shipments; Finance/quotation/complaint sections appear only when delivered and permitted; no copied transaction truth. `CRM-FR-CONTACT-004` |

## 5. CRM-EPIC-003 — Lead and inquiry management

| Order | ID / feature | User story | Pri | Dep. | Size | Release | Acceptance criteria / requirement trace |
|---:|---|---|:---:|---|:---:|---|---|
| 17 | **CRM-LEAD-001 — Freight Lead schema/transitions** | As Sales, I want freight-specific Lead data and canonical qualification states. | P0 | PLATFORM-003, COMPANY-001, CONTACT-001 | L | Foundation 1 | Fields/constraints/indexes match Data Model; canonical statuses only; score `0..100`; qualification/disqualification/conversion prerequisites tested. `CRM-FR-LEAD-003`, `004`, `007`, `008` |
| 18 | **CRM-LEAD-002 — Manual Lead capture** | As Sales, I want to capture WhatsApp/email/referral/outreach inquiries quickly and complete them later. | P0 | 017, SECURITY-002 | L | Foundation 1 | Progressive form saves allowed incomplete intake, marks missing qualification data, preserves snapshots, assigns owner/team, and works at 360 px. `CRM-FR-LEAD-001`, `003`, `004`; `CRM-NFR-MOBILE-001` |
| 19 | **CRM-LEAD-003 — Quote Request bridge** | As staff reviewing website inquiries, I want to create or open the single linked Lead. | P0 | 017, AUDIT-001 | L | Foundation 1 | Existing public submission unchanged; conversion preserves reference/raw snapshots; retry/concurrency returns one Lead via unique source ID; denied users cannot convert. `CRM-FR-LEAD-002`; `CRM-NFR-RELIABILITY-001` |
| 20 | **CRM-LEAD-004 — Lead lists/detail/filters** | As Sales, I want assigned and overdue Leads easy to find. | P0 | 018, SEARCH-001 | M | Foundation 1 | Scoped list/detail support owner/status/priority/service/route/source/follow-up/date filters, pagination, stable sorting, loading/empty/error states, and deep links. `CRM-FR-LEAD-005`, `006` |
| 21 | **CRM-LEAD-005 — Qualification workflow** | As Sales, I want guided qualification and a manager exception path. | P0 | 017, 018 | L | Foundation 1 | Required identity/service/route/cargo/timing fields displayed; status cannot advance when missing; manager override records reason; score remains advisory and versioned. `CRM-FR-LEAD-004`, `008` |
| 22 | **CRM-LEAD-006 — Ownership and follow-up compliance** | As Sales Manager, I want every active Lead owned and scheduled. | P0 | 020, TASK-002 | M | Foundation 1 | Active Lead owner mandatory; after contact, one next-action Task/due time or visible exception; reassignment notifies/audits; overdue/WIB calculations tested. `CRM-FR-LEAD-005`–`007`; `CRM-FR-TASK-003`, `004` |
| 23 | **CRM-LEAD-007 — Lead documents** | As Sales, I want private inquiry documents attached safely. | P1 | 018, ATTACHMENT-001 | M | Foundation 1 | Allowed type/magic/size/checksum validation; R2 private object; authorized signed download; confidentiality and archive audit; no object key exposed. `CRM-FR-LEAD-003`; `CRM-NFR-SEC-005` |

## 6. CRM-EPIC-004 — Activities, Tasks, and notifications

| Order | ID / feature | User story | Pri | Dep. | Size | Release | Acceptance criteria / requirement trace |
|---:|---|---|:---:|---|:---:|---|---|
| 24 | **CRM-ACTIVITY-001 — Activity and typed links** | As staff, I want one interaction recorded on every relevant timeline without broken references. | P0 | PLATFORM-003, AUDIT-001 | M | Foundation 1 | Activity plus typed link tables enforce one target per link; one Activity can appear on several records; external ID uniqueness supports future ingestion. `CRM-FR-ACTIVITY-001`, `002` |
| 25 | **CRM-ACTIVITY-002 — Manual interaction logging** | As Sales, I want to log call, WhatsApp, email, meeting, site visit, and note outcomes quickly. | P0 | 024, SECURITY-002 | M | Foundation 1 | Owner/date/type/outcome/next step/links validated; manual logs labeled user-entered; mobile quick actions complete without horizontal scrolling. `CRM-FR-ACTIVITY-001`, `003`; `CRM-NFR-MOBILE-001` |
| 26 | **CRM-ACTIVITY-003 — Unified timeline** | As staff, I want an authorized chronological history across CRM records. | P0 | 024, 025 | M | Foundation 1 | Timeline is paginated, stable ordered, scope/field filtered, and distinguishes system/manual/provider events; inaccessible linked records do not leak. `CRM-FR-ACTIVITY-002`; `CRM-NFR-PRIVACY-001` |
| 27 | **CRM-TASK-001 — Task/reminder schema** | As staff, I want due work, completion, and reminder state persisted consistently. | P0 | PLATFORM-003, AUDIT-001 | M | Foundation 1 | Task/link/reminder constraints and queue indexes match Data Model; completed/cancelled invariants enforced; open tasks cannot archive. `CRM-FR-TASK-001`, `002`, `004` |
| 28 | **CRM-TASK-002 — Task workflow and queues** | As Sales, I want to create, reassign, complete, cancel, and snooze follow-ups. | P0 | 027, SECURITY-002 | L | Foundation 1 | Own/team queues; WIB due/overdue; completion metadata/outcome; optional resulting Activity/next Task; reassignment/cancel reason/audit; direct denial tests. `CRM-FR-TASK-001`–`004` |
| 29 | **CRM-NOTIFY-001 — In-app notification center** | As staff, I want assignments, due work, approval, expiry, acceptance, and handover alerts in one reliable place. | P2 | 027, PLATFORM-005 | L | Automation 6 | Persistent unread/read state, deep link, dedupe, channel failure visibility, and scope-safe content; email failure does not remove in-app event. `CRM-FR-NOTIFY-001`, `002` |
| 30 | **CRM-ATTACHMENT-001 — Generic CRM attachment service** | As authorized staff, I want reusable private attachments without overloading shipment documents. | P0 | PLATFORM-003, SECURITY-002 | L | Foundation 1 | Separate metadata/link table and R2 prefix; validation/checksum/signed download/compensation; confidentiality class enforced; tests prove no permanent URL/object key leak. `CRM-NFR-SEC-005` |

## 7. CRM-EPIC-005 — Opportunity and pipeline

| Order | ID / feature | User story | Pri | Dep. | Size | Release | Acceptance criteria / requirement trace |
|---:|---|---|:---:|---|:---:|---|---|
| 31 | **CRM-OPPORTUNITY-001 — Opportunity/stage schema** | As Sales, I want a forecastable pursuit distinct from the Lead. | P0 | LEAD-001, PLATFORM-003 | L | Foundation 2 | Canonical stage metadata and Opportunity constraints/indexes exist; state/stage/terminal evidence align; owner/team/company required. `CRM-FR-OPPORTUNITY-001`, `002`, `004` |
| 32 | **CRM-OPPORTUNITY-002 — Lead conversion** | As Sales, I want to convert a qualified Lead atomically while preserving source history. | P0 | 031, LEAD-005 | L | Opportunity and links created in one transaction; Lead becomes converted only on success; retry/concurrency safe; separate service/route timing can create later Opportunities. `CRM-FR-OPPORTUNITY-001`; `CRM-NFR-RELIABILITY-001`, `002` |
| 33 | **CRM-OPPORTUNITY-003 — Opportunity detail/transitions** | As Sales, I want to maintain stage, value, expected close, and next action with clear prerequisites. | P0 | 031, 032, TASK-002 | L | Detail supports all canonical stages; costing/sent/won/lost/on-hold prerequisites; conflict response prevents overwrite; value/probability/owner/terminal changes audited. `CRM-FR-OPPORTUNITY-002`, `004`, `007`, `008` |
| 34 | **CRM-OPPORTUNITY-004 — Pipeline table** | As Sales, I want a paginated, filterable table of my Opportunities. | P0 | 033, SEARCH-001 | M | Table scopes rows server-side; stable owner/team/stage/service/route/date/value filters; cost/margin columns absent for unauthorized roles. `CRM-FR-OPPORTUNITY-003`, `005`; `CRM-FR-SEARCH-003` |
| 35 | **CRM-OPPORTUNITY-005 — Accessible Kanban** | As Sales, I want a visual stage board with the same rules as detail edits. | P1 | 033, 034 | L | Board/table row parity; keyboard/touch alternative; drag uses transition service, precondition, audit; invalid move restores card with actionable error. `CRM-FR-OPPORTUNITY-005`, `006` |
| 36 | **CRM-OPPORTUNITY-006 — External quotation bridge** | As Sales, I want current spreadsheet/PDF quotations visible until native quotations ship. | P0 | 033, ATTACHMENT-001 | M | Number/amount/currency/validity/attachment/status/sent/outcome stored and audited; confidential attachment scoped; clearly labeled external, not native Version. `CRM-FR-OPPORTUNITY-009` |
| 37 | **CRM-OPPORTUNITY-007 — Confidential commercial projection** | As an authorized manager, I want estimated cost/profit/margin without exposing it to Sales. | P0 | SECURITY-002, 031 | L | Separate manager DTO/query; roles limited to Super Admin/Director/Sales Manager/Finance; ordinary Sales HTML/serialization/export/aggregate contains no fields; arithmetic tested. `CRM-FR-OPPORTUNITY-003`; `CRM-NFR-SEC-003` |
| 38 | **CRM-REPORT-001 — Foundation dashboard** | As Sales/management, I want workload and pipeline metrics appropriate to my scope. | P1 | 034, 037 | L | WIB date ranges; Leads, pipeline, weighted pipeline, follow-up compliance, win/loss/source/service/route/owner metrics; forecasts labeled; restricted metrics omitted by query/DTO. `CRM-FR-REPORT-001`, `002`, `004`, `005` |
| 39 | **CRM-OPPORTUNITY-008 — Lost/on-hold/reopen workflow** | As Sales Manager, I want structured loss reasons and controlled reopening. | P0 | 033 | M | Lost reason required; hold reason/review date required; reopen manager-authorized/reasoned; history retained; dashboard updates consistently. `CRM-FR-OPPORTUNITY-004`, `008` |

## 8. CRM-EPIC-006 — Native freight quotation

| Order | ID / feature | User story | Pri | Dep. | Size | Release | Acceptance criteria / requirement trace |
|---:|---|---|:---:|---|:---:|---|---|
| 40 | **CRM-RATE-001 — Route and supplier-rate masters** | As authorized pricing staff, I want reusable valid buy rates by carrier/route/service. | P1 | COMPANY-001, ATTACHMENT-001 | XL | Quotation 3 | Supplier Company role required; rate basis/minimum/currency/validity/commodity/customer scope validated; expired rates excluded from new costing but retained. `CRM-FR-QUOTE-006` |
| 41 | **CRM-QUOTE-001 — Quotation/version schema** | As Sales, I want numbered immutable quotation history for one Opportunity. | P0 | OPPORTUNITY-003, PLATFORM-003 | XL | Quotation 3 | Quotation/current/accepted pointer and Version constraints match Data Model; unique version numbers; submitted/sent versions cannot be edited/deleted. `CRM-FR-QUOTE-001`, `007` |
| 42 | **CRM-QUOTE-002 — Freight options and charges** | As pricing staff, I want multiple routes/options and complete freight charge bases. | P0 | 040, 041 | XL | Quotation 3 | Air/sea/domestic scopes, route/schedule/transit/cargo, listed charges, quantity/basis/minimum/tax/customer visibility, and option totals reconcile. `CRM-FR-QUOTE-002`–`005` |
| 43 | **CRM-QUOTE-003 — Calculation engine** | As management, I want deterministic currency, cost, sell, profit, margin, and tax calculations. | P0 | 042 | XL | Pure tested calculation handles minimums/units/multi-currency/FX snapshot/rounding/tax; totals reconcile; invalid/expired inputs block or require approved override. `CRM-FR-QUOTE-003`, `005`, `006` |
| 44 | **CRM-QUOTE-004 — Revision and comparison** | As Sales, I want a revision cloned from history without mutating sent work. | P0 | 041–043 | L | New draft clones prior Version/options/charges/terms; comparison highlights deterministic deltas; prior Version unchanged and superseded only through transition. `CRM-FR-QUOTE-007` |
| 45 | **CRM-QUOTE-005 — Approval workflow** | As approver, I want margin/discount/exception rules and a reasoned decision. | P0 | 043, 044, SECURITY-002 | XL | Threshold rule snapshot; assigned approver; pending/approve/reject/cancel; rejected revision path; concurrent decisions idempotent; approval record append-only. `CRM-FR-QUOTE-008` |
| 46 | **CRM-QUOTE-006 — Customer-safe PDF** | As Sales, I want a branded quotation PDF containing selling terms only. | P0 | 045 | L | Renderer accepts allow-listed immutable DTO; golden PDF/content test proves no cost/margin/source rate/internal note/approval comment; version/validity/terms shown. `CRM-FR-QUOTE-009`, `012`; `CRM-NFR-SEC-003` |
| 47 | **CRM-QUOTE-007 — Send/share and evidence** | As Sales, I want to send a specific approved Version and record delivery. | P1 | 046, NOTIFY-001 | XL | Hash-bound expiring/revocable share token; exact Version/channel/time/provider ID recorded; resend is idempotent; customer payload safe; manual WhatsApp evidence supported. `CRM-FR-QUOTE-009`, `010` |
| 48 | **CRM-QUOTE-008 — Acceptance/rejection** | As a customer-facing user, I want acceptance/rejection tied to one Version with evidence. | P0 | 047 | L | Only valid sent Version accepts; actor/channel/time/evidence stored; replay returns prior result; one accepted Version; rejection/expiry/withdraw transitions tested. `CRM-FR-QUOTE-010`; `CRM-NFR-RELIABILITY-001` |
| 49 | **CRM-QUOTE-009 — Templates and validity alerts** | As pricing staff, I want approved reusable wording and timely expiry awareness. | P2 | 046, NOTIFY-001 | L | Template version snapshots but cannot overwrite transaction data; expiry uses Version timestamp; alerts dedupe; DDP/DDU/customs caveats preserved. `CRM-FR-QUOTE-011`, `012`; `CRM-FR-AUTO-003` |
| 50 | **CRM-QUOTE-010 — Confidentiality regression suite** | As security owner, I want proof that buy rates and margins cannot leak through any quotation surface. | P0 | 042–048 | L | Role/query/Server Action/PDF/share/export/log/notification tests enumerate forbidden fields; access attempts audited; customer DTO compile/runtime allow-list passes. `CRM-FR-QUOTE-009`; `CRM-NFR-SEC-001`, `003`, `004` |

## 9. CRM-EPIC-007 — Operational handover

| Order | ID / feature | User story | Pri | Dep. | Size | Release | Acceptance criteria / requirement trace |
|---:|---|---|:---:|---|:---:|---|---|
| 51 | **CRM-HANDOVER-001 — Commercial shipment link/snapshot** | As Operations, I want accepted terms frozen and linked to an existing Shipment. | P0 | QUOTE-008 | L | Unique Shipment/accepted Version/idempotency constraints; schema-versioned immutable snapshot; no duplicate shipment master. `CRM-FR-HANDOVER-001`–`003` |
| 52 | **CRM-HANDOVER-002 — Idempotent shipment intake conversion** | As Sales, I want acceptance to create or return one shipment intake draft safely. | P0 | 051 | XL | Transaction/concurrency/retry yields one existing `shipments` row at `operational_stage=intake`; failed conversion is recoverable/audited; source remains accepted Version. `CRM-FR-HANDOVER-002`, `006` |
| 53 | **CRM-HANDOVER-003 — Operations checklist/activation** | As Operations, I want to review readiness before execution begins. | P0 | 052 | L | Required checklist, missing-info request, activation capability, and audit; Sales cannot activate; clarification does not mutate accepted quotation. `CRM-FR-HANDOVER-004`, `005` |
| 54 | **CRM-HANDOVER-004 — Handover visibility and recovery** | As Sales/Operations, I want clear linked status and retry/reject recovery. | P1 | 052, 053 | M | Both modules show authorized state/deep links; error categories and safe retry; void/reject/amendment path retains snapshot/history. `CRM-FR-HANDOVER-004`–`006` |

## 10. CRM-EPIC-008 — Finance, retention, complaints, and reporting

| Order | ID / feature | User story | Pri | Dep. | Size | Release | Acceptance criteria / requirement trace |
|---:|---|---|:---:|---|:---:|---|---|
| 55 | **CRM-FINANCE-001 — Authorized Finance projections** | As account owner/Finance, I want invoice/payment/outstanding summaries from one authoritative ledger. | P0 | COMPANY-003, HANDOVER-002 | XL | Queries use existing invoice and active non-voided payment logic; role-specific DTO; reconciliation sample approved; CRM performs no Finance write. `CRM-FR-FINANCE-001`, `002` |
| 56 | **CRM-RETENTION-001 — Account lifecycle metrics** | As account owner, I want last shipment, frequency, service/route, value, and open-work indicators. | P1 | 055 | XL | Calculation version/freshness displayed; shipment/Finance sources reconcile; permitted gross profit/margin restricted; missing sync is not inactivity. `CRM-FR-RETENTION-001`, `002`; `CRM-FR-REPORT-003` |
| 57 | **CRM-RETENTION-002 — Inactivity and health rules** | As Sales Manager, I want explainable churn risk and recommended follow-up. | P2 | 056, NOTIFY-001 | L | Segment/service thresholds configurable after approval; contributing signals shown; rule/version/date recorded; creates deduped review Task, not business truth. `CRM-FR-RETENTION-002`, `003`; `CRM-FR-AUTO-005` |
| 58 | **CRM-COMPLAINT-001 — Complaint schema/workflow** | As Customer Service, I want accountable service cases linked to customer and shipment. | P1 | COMPANY-002, ACTIVITY-003, ATTACHMENT-001 | L | Canonical categories/statuses, owner/SLA/root cause/action/resolution/response, typed links and constraints; resolution/closure/reopen rules audited. `CRM-FR-COMPLAINT-001`–`003` |
| 59 | **CRM-COMPLAINT-002 — Complaint UI/timeline** | As Customer Service, I want mobile-safe triage and a complete case history. | P1 | 058 | L | Scoped queue/detail/create/transition; overdue/escalation indicators; activities/attachments/customer response; unauthorized Finance/cost details excluded. `CRM-FR-COMPLAINT-001`–`003`; `CRM-NFR-MOBILE-001` |
| 60 | **CRM-REPORT-002 — Lifecycle dashboards** | As Director, I want conversion, revenue, margin, retention, repeat business, and complaint views with clear definitions. | P1 | 055–059 | XL | Daily/weekly/monthly/quarterly/year/custom WIB ranges; source/freshness/currency/inclusion rules shown; role-safe SQL/DTO; totals reconcile to authoritative modules. `CRM-FR-REPORT-001`–`005` |
| 61 | **CRM-REPORT-003 — Query/materialization hardening** | As platform owner, I want reports fast at production-like volume. | P2 | 060 | L | Query plans measured; bounded pagination/indexes; materialized view only when evidence requires; refresh health visible; default list result meets agreed target. `CRM-NFR-PERF-001`, `002` |

## 11. CRM-EPIC-009 — Search, import, export, bulk, and saved views

| Order | ID / feature | User story | Pri | Dep. | Size | Release | Acceptance criteria / requirement trace |
|---:|---|---|:---:|---|:---:|---|---|
| 62 | **CRM-SEARCH-001 — Scoped Postgres CRM search** | As staff, I want to find permitted CRM records quickly without an external search service. | P0 | SECURITY-002, COMPANY-001, LEAD-001 | L | Normalized/indexed Company/Contact/Lead/Opportunity/activity references; bounded/paginated results; no out-of-scope existence/count/snippet leak; `pg_trgm` only after verified. `CRM-FR-SEARCH-001`, `002` |
| 63 | **CRM-SEARCH-002 — Global cross-module search** | As staff, I want one search across later quotation/shipment/invoice/complaint records appropriate to my role. | P2 | 062, QUOTE-001, FINANCE-001, COMPLAINT-001 | L | Explicit result types/deep links; each source policy-scoped; restricted fields omitted; partial provider failure produces safe per-source status. `CRM-FR-SEARCH-001`–`003` |
| 64 | **CRM-IMPORT-001 — Staged import schema/upload** | As data steward, I want a private, checksummed Import Job before records change. | P1 | ATTACHMENT-001, PLATFORM-005 | L | Job/row state, attachment, idempotency, mapping version, counts, error codes, audit; upload performs no business-record mutation. `CRM-FR-IMPORT-001`, `002` |
| 65 | **CRM-IMPORT-002 — Mapping, validation, duplicate review** | As data steward, I want to clean spreadsheet rows and resolve duplicates before commit. | P1 | 064, COMPANY-004 | XL | CSV/XLSX sheet/header/map; dates/currency/phone/formula safety; entity templates; row valid/warn/error; duplicate candidates/resolution; downloadable sanitized report. `CRM-FR-IMPORT-001`, `003` |
| 66 | **CRM-IMPORT-003 — Transactional import commit** | As approver, I want an unchanged dry run committed once, with full reconciliation. | P0 | 065 | XL | Approval and file/mapping checksum rechecked; authorization rechecked; commit atomic/idempotent; row entity IDs and counts reconcile; retry does not duplicate. `CRM-FR-IMPORT-001`, `002`; `CRM-NFR-RELIABILITY-001` |
| 67 | **CRM-EXPORT-001 — Permission-safe export** | As authorized management, I want scoped CSV/XLSX output with an audit trail. | P1 | SECURITY-002, PLATFORM-005 | L | Server-generated bounded export; explicit field allow-list; cost/margin/Finance/personal permissions separate; filter/field/count audit; formula injection neutralized. `CRM-FR-EXPORT-001` |
| 68 | **CRM-BULK-001 — Previewed bulk actions** | As Sales Manager, I want assignment/status/follow-up changes applied safely to many records. | P2 | 066, TASK-002 | L | Preview IDs/count/conflicts; confirmation and authorization recheck; per-record result; one batch plus item-failure audit; no silent partial success. `CRM-FR-IMPORT-004` |
| 69 | **CRM-VIEW-001 — Saved personal/team views** | As Sales, I want reusable filters and columns without bypassing changed permissions. | P2 | OPPORTUNITY-004, SEARCH-001 | M | Versioned allow-listed filter/sort/column JSON; one default per module; private/team scope; inaccessible filters removed after permission change; no raw SQL. `CRM-FR-SEARCH-004` |

## 12. CRM-EPIC-010 — Integrations and automation

| Order | ID / feature | User story | Pri | Dep. | Size | Release | Acceptance criteria / requirement trace |
|---:|---|---|:---:|---|:---:|---|---|
| 70 | **CRM-AUTO-001 — Rule/execution engine** | As administrator, I want versioned, dry-runnable, idempotent automation rules. | P1 | NOTIFY-001, PLATFORM-005 | XL | Rule version, evaluation, dedupe, run/result/error/retry/manual recovery recorded; simulation changes no business records; actions use normal policy/transition services. `CRM-FR-AUTO-010`; `CRM-NFR-RELIABILITY-003` |
| 71 | **CRM-AUTO-002 — Lead/follow-up/escalation rules** | As Sales Manager, I want uncontacted/overdue/high-value work surfaced automatically. | P1 | 070, LEAD-006, OPPORTUNITY-008 | L | Approved intervals/grace/high-value thresholds; Task/notification dedupe; owner/manager routing; quiet hours; execution visible. `CRM-FR-AUTO-001`, `002`, `004`, `006`, `009` |
| 72 | **CRM-AUTO-003 — Assignment and existing-customer routing** | As account owner, I want reassignment and repeat inquiry alerts routed correctly. | P1 | 070, COMPANY-003, LEAD-003 | L | Old/new owners/managers notified; active account manager wins before fallback; ambiguous Company requires review; no duplicate Lead/notification. `CRM-FR-AUTO-007`, `008` |
| 73 | **CRM-INTEGRATION-001 — Event inbox/webhook security** | As platform owner, I want provider events authenticated, replay-safe, and recoverable. | P0 | 070 | XL | Signature/timestamp validation; idempotent external event ID; out-of-order handling; dead-letter/retry; tokens not stored in business/audit data. `CRM-NFR-RELIABILITY-001`, `003`; `CRM-NFR-SEC-001` |
| 74 | **CRM-INTEGRATION-002 — Gmail activity ingestion** | As Sales, I want authorized email threads logged without manual duplication. | P3 | 073, ACTIVITY-001 | XL | Provider/identity/consent decision approved; least scopes; message ID dedupe; attachments/privacy/retention policy; disconnect and manual fallback. `CRM-FR-ACTIVITY-003` |
| 75 | **CRM-INTEGRATION-003 — WhatsApp activity/send** | As Sales, I want approved WhatsApp messages linked to CRM and quotation evidence. | P3 | 073, QUOTE-007 | XL | Provider/template/consent approved; webhook dedupe/status; opt-out; safe customer payload; failure visible; manual logging remains available. `CRM-FR-ACTIVITY-003`; `CRM-FR-QUOTE-009`, `010` |
| 76 | **CRM-INTEGRATION-004 — Customer portal quotation view** | As customer, I want to view/accept the exact safe Quotation Version. | P3 | QUOTE-008, 073 | XL | Customer-session or signed-access policy approved; only linked customer can view; no confidential fields; acceptance evidence/idempotency; revoke/expiry. `CRM-FR-QUOTE-009`, `010`; `CRM-NFR-SEC-003` |
| 77 | **CRM-AUTO-004 — Scheduled reports and provider health** | As management/support, I want scheduled scoped reports and integration failures visible. | P3 | REPORT-002, 070, 073 | L | Recipient scope rechecked at generation; export link expires; delivery failure visible; provider latency/error/retry dashboards; no sensitive attachment in ordinary email. `CRM-NFR-OBS-002`; `CRM-FR-NOTIFY-002` |

## 13. Initial deployment cut line

The initial Commercial Foundation deployment may claim only stories through the following cut when each is implemented and verified:

- P0 Readiness: `CRM-PLATFORM-001`–`005`, `CRM-SECURITY-001`–`002`, `CRM-AUDIT-001` as applicable.
- Foundation 1: Company/Contact core (`CRM-COMPANY-001`–`004`, `CRM-CONTACT-001`–`002`), Lead (`CRM-LEAD-001`–`007` as included), Activity/Task (`CRM-ACTIVITY-001`–`003`, `CRM-TASK-001`–`002`), generic Attachment if shipped, and scoped CRM search.
- Foundation 2: `CRM-OPPORTUNITY-001`–`008` and `CRM-REPORT-001` as verified.

Do not describe `CRM-COMPANY-005`, `CRM-NOTIFY-001`, any Phase 2B import/export/saved-view story, or any Epic 006–010 later-phase feature as live merely because its schema, route placeholder, or documentation exists.

## 14. Backlog acceptance discipline

A story is done only when:

- Behavior, server-side authorization, validation, audit, responsive states, and error/recovery paths meet its criteria.
- Its migration is additive, checked, and verified on an isolated database where applicable.
- Both allowed and denied tests pass; customer-safe output has confidentiality regression coverage where applicable.
- Existing customer portal, public Quote Request, shipment, invoice, and payment behavior is not regressed.
- Documentation and requirement trace remain consistent.
- Preview acceptance is recorded. Production status requires a separate approved migration/deployment plus live smoke verification.
