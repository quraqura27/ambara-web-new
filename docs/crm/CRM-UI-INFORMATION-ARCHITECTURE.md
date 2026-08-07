# Ambara Freight CRM — UI and Information Architecture

**Document status:** Target UX architecture with initial-slice boundary<br>
**Source-code baseline:** `origin/main` at `81ff43f421187eb76ef6c732ee141a7084a73dc3`<br>
**Related requirements:** CRM-NFR-MOBILE-001, CRM-NFR-MOBILE-002, CRM-NFR-ACCESS-001, CRM-NFR-ACCESS-002

> The routes and behaviors below describe the target CRM. Only rows marked **Initial slice** belong to the first implementation/deployment. **Foundation backlog** and **Later phase** rows must not be reported as live until separately implemented, tested, migrated, deployed, and verified.

## 1. UX principles

1. **Freight context before generic sales mechanics.** Route, service, commodity, cargo measures, Incoterm, target date, readiness, and next action are first-class information.
2. **The next useful action is visible.** Every active Lead/Opportunity page shows owner, current stage, next Task, due state, and missing prerequisites near the top.
3. **Mobile handles daily work.** A salesperson or customer-service user can review a new Lead, update status, log a call/WhatsApp, and create/complete a Task at 360 px.
4. **Dense work is desktop-recommended.** Bulk import/export, rate sourcing, multi-option costing, complex filters, permission administration, and large data review can require desktop while remaining safely viewable on mobile.
5. **Progressive disclosure.** Start with identity, route/cargo, owner, and next action. Reveal qualification, commercial, compliance, cost, Finance, and audit sections only when relevant and permitted.
6. **Permission-safe by construction.** Navigation, search groups, tabs, columns, counts, filters, downloads, and error text reflect server-authorized data. Hidden UI is not authorization.
7. **One identity, linked histories.** Company is the neutral relationship hub. Legacy Customers, Shipments, Invoices, and existing website inquiries remain linked compatibility/authoritative records, not duplicated UI masters.
8. **Source and status are explicit.** Users can distinguish raw inquiry, normalized Lead, forecast Opportunity, external quotation reference, native Quotation Version, Shipment, and Invoice.
9. **No false completion.** “Saved,” “sent,” “accepted,” “converted,” “paid,” and “notified” appear only after the authoritative transaction succeeds.
10. **Safe language.** DDP/DDU, undername, customs, duties/taxes, and regulated goods are presented as case-by-case and dependent on shipment/customer/document/regulatory readiness.

## 2. Initial deployment versus target product

| Capability | Delivery status | UX boundary |
|---|---|---|
| Company and Contact core records | **Initial slice** | Basic create/list/detail/edit with duplicate signals and legacy Customer link where available |
| Lead intake/qualification core | **Initial slice** | Manual Lead plus quote-request bridge, ownership, status, route/cargo, next action |
| Opportunity and pipeline core | **Initial slice** | Basic Opportunity list/detail and pipeline stages; cost/margin never exposed to Sales |
| Activity and Task core | **Initial slice** | Manual Activities, open/completed Tasks, due/overdue work |
| Ownership and team-safe authorization | **Initial slice** | Server-enforced assignment/scope needed by the slice; broader team administration may remain restricted |
| CRM search core | **Initial slice** | Search initial CRM entities plus safe links to existing portal records as implemented |
| CRM audit core | **Initial slice** | Core create/update/status/assignment events |
| Existing website quote-request bridge | **Initial slice** | Existing `/quotes` remains; CRM can link/convert without pretending it is a native quotation |
| Saved views | **Foundation backlog — not initial** | Filters may be usable without persistence; no claim of private/team saved views |
| CSV/XLSX import/export and bulk update | **Foundation backlog — not initial** | Existing unrelated shipment/invoice export remains separate; no CRM bulk-data claim |
| Automated reminders/escalations | **Foundation backlog — not initial** | Due/overdue can be calculated; no claim of scheduler/email automation |
| Full KPI/retention dashboards | **Foundation backlog / Phase 5** | Initial counts may be shown; no claim of authoritative revenue/retention analytics |
| Native freight costing, Quotation Versions, approval, PDF, sharing | **Phase 3 — not initial** | Use explicit external quotation reference only |
| Accepted quotation to Shipment intake | **Phase 4 — not initial** | Existing manual Shipment creation remains authoritative until conversion ships |
| Complaints and account health | **Phase 5 — not initial** | Planned routes remain absent or clearly unavailable |
| Gmail/WhatsApp/provider integration | **Phase 6 — not initial** | Activities are manually logged |

When the initial rollout succeeds, release notes must list only the **Initial slice** behavior actually verified. Planning documentation is not evidence that a route is deployed.

## 3. Shell and navigation

### 3.1 Integration with the existing portal

The CRM extends the authenticated portal rather than creating a separate application. Reuse the existing responsive shell, capability-aware navigation, breadcrumbs, form controls, cards, badges, tables, and dark visual language. Add a CRM navigation group; do not rename or relocate existing Operations/Finance routes unless a separate compatibility plan is approved.

### 3.2 Target navigation hierarchy

```text
Home
├── Operations Home                          /dashboard                    existing
└── CRM Home                                 /crm                         initial slice

Commercial Work
├── My Work                                  /crm/my-work                 foundation backlog; Tasks is initial queue
├── Inquiries                                /quotes                      existing compatibility queue + initial bridge
├── Leads                                    /crm/leads                   initial slice
├── Pipeline                                 /crm/pipeline                initial slice
├── Opportunities                            /crm/opportunities           initial slice
├── Quotations                               /crm/quotations              Phase 3
└── Activities                               /crm/activities              initial slice or detail-first

Relationships
├── Companies                                /crm/companies               initial slice
├── Contacts                                 /crm/contacts                initial slice
└── Complaints                               /crm/complaints              Phase 5

Insights
├── Reports                                  /crm/reports                 backlog / Phase 5
└── Retention                                /crm/retention               Phase 5

Data and Administration
├── Imports                                  /crm/imports                 foundation backlog
├── CRM Audit                                /crm/audit                   foundation backlog; initial events are written only
└── CRM Settings                             /crm/settings                later, Super Admin only

Existing modules remain in their current groups
├── Shipments / Operations / MAWB / Documents / Delivery
├── Invoices / Collections / Invoice Export
├── Customers                                /customers                    compatibility
├── Quote Requests                           /quotes                       compatibility
└── Staff Accounts                           /accounts                     existing
```

### 3.3 Role-specific navigation

- Sales sees CRM Home, Leads, Pipeline, Opportunities, Activities, Tasks, Companies, Contacts, and the existing Quote Requests queue when allowed.
- Sales Manager adds team views, approval queue when Phase 3 ships, sensitive commercial reporting, and team audit.
- Director sees company-wide commercial navigation and approvals.
- Customer Service sees My Work, Inquiries, Companies, Contacts, Activities, and later Complaints; Opportunity/Quotation links use customer-safe summaries.
- Operations sees existing Operations navigation plus later Won Handovers; it does not receive pre-win Pipeline navigation by default.
- Finance keeps existing Finance navigation and receives linked Company/approved commercial summaries, not full Lead workflow.
- Viewer sees only explicitly granted read-only destinations.
- Legacy Admin retains existing portal navigation and receives no implicit CRM group until remapped.

## 4. Route map

“Initial slice” means intended in the first implementation. Exact route presence and behavior must be verified before deployment is reported complete.

### 4.1 CRM home and work

| Route | Page | Delivery | Core behavior |
|---|---|---|---|
| `/crm` | CRM Home | Initial slice | Role-scoped counts, overdue work, recent activity, quick actions, and safe Pipeline summary available from implemented data |
| `/crm/my-work` | My Work | Foundation backlog | Combined queue; initial users work from `/crm/tasks`, `/crm/leads`, and `/crm/opportunities` |
| `/crm/activities` | Activity list | Initial slice or detail-first | Chronological role-scoped Activities with type/owner/date/related-record filters |
| `/crm/tasks` | Task list | Initial slice | Open, overdue, completed, assigned-to-me/team filters and quick completion |
| `/crm/audit` | CRM audit | Foundation backlog | Initial slice writes core audit events but does not claim a dedicated audit reader |

### 4.2 Inquiry and Lead

| Route | Page | Delivery | Core behavior |
|---|---|---|---|
| `/quotes` | Existing inquiry queue | Initial slice bridge | Existing website Quote Request workflow remains authoritative; detail exposes idempotent create/open CRM Lead action |
| `/quotes/[id]` | Existing inquiry detail | Initial slice bridge | Preserves source details and links or converts to one CRM Lead |
| `/crm/leads` | Lead list | Initial slice | Bounded scoped list with search and status/archive filters |
| `/crm/leads/new` | New Lead | Initial slice | Progressive manual intake for WhatsApp, email, referral, partner, customer, or outreach |
| `/crm/leads/[id]` | Lead detail | Initial slice | Header, qualification, route/cargo, Timeline, Tasks, Company/Contact, audit summary |
| `/crm/leads/[id]` edit section | Edit Lead | Initial slice | Structured inline edit with server validation and submitted-value recovery; conflict versioning remains backlog |

### 4.3 Opportunity and Pipeline

| Route | Page | Delivery | Core behavior |
|---|---|---|---|
| `/crm/pipeline` | Pipeline board | Initial slice | Stage sections/cards plus table alternative; explicit validated stage action, no drag/drop claim |
| `/crm/opportunities` | Opportunity table | Initial slice | Bounded scoped results, search, stage/status/archive filters, fixed safe columns, mobile cards |
| `/crm/opportunities/new` | New Opportunity | Initial slice | Prefer entry from qualified Lead; direct path requires permission/reason |
| `/crm/opportunities/[id]` | Opportunity detail | Initial slice | Overview, route/cargo, next action, Activities, Tasks, external quotation reference, linked history |
| `/crm/opportunities/[id]` edit section | Edit Opportunity | Initial slice | Inline editable forecast and bridge fields within scope; confidential costing fields are absent |
| `/crm/opportunities/[id]` stage action | Won/lost/on-hold action | Initial slice | Explicit transition, lost reason, quotation evidence prerequisite, and audit |

### 4.4 Company and Contact

| Route | Page | Delivery | Core behavior |
|---|---|---|---|
| `/crm/companies` | Company list | Initial slice | Neutral Company master with role, country, owner, archive state, and exact duplicate guards |
| `/crm/companies/new` | New Company | Initial slice | Legal/trading identity, roles, primary address, primary Contact, compatibility preview |
| `/crm/companies/[id]` | Company detail | Initial slice | Overview, Contacts, Activities, Leads, Opportunities; later Quotations/Shipments/Finance/Complaints |
| `/crm/companies/[id]` edit section | Edit Company | Initial slice | Inline general fields; compliance fields permission-filtered |
| `/crm/companies/[id]/duplicates` | Duplicate review | Foundation backlog or privileged initial path | Candidate evidence, field/link preview, merge handoff |
| `/crm/contacts` | Contact list | Initial slice | Name, Company, role, country, email/phone, owner/activity state |
| `/crm/contacts/new` | New Contact | Initial slice | Company-context or standalone creation; exact company/email/phone/WhatsApp guards |
| `/crm/contacts/[id]` | Contact detail | Initial slice | Identity/preferences, Company roles, communication Timeline, related commercial records |
| `/crm/contacts/[id]` edit section | Edit Contact | Initial slice | Permission-safe inline contact details, ownership, Company link, archive/restore |

### 4.5 Quotation — Phase 3, not initial

| Route | Page | Behavior |
|---|---|---|
| `/crm/quotations` | Quotation list | Status, validity, Company, route, owner, sent/decision dates; cost/margin columns permission-gated |
| `/crm/quotations/new?opportunity={id}` | New quotation | Create `v1` from Opportunity snapshot |
| `/crm/quotations/[id]` | Quotation detail | Current Version, full history, options, approvals, activity, acceptance |
| `/crm/quotations/[id]/versions/[version]` | Immutable Version | Snapshot, route/options/charges, terms, diff, approval, customer-safe preview |
| `/crm/quotations/[id]/versions/[version]/edit` | Draft editor | Sectioned freight costing; immutable states redirect to view |
| `/crm/quotation-approvals` | Approval queue | Trigger, value/risk, due time, compare, approve/reject/request changes |

### 4.6 Handover, complaints, reporting, data — not initial

| Route | Delivery | Behavior |
|---|---|---|
| `/crm/handovers` | Phase 4 | Won Opportunities awaiting conversion/Operations confirmation |
| `/crm/handovers/[id]` | Phase 4 | Accepted snapshot, checklist, clarification, linked Shipment intake |
| `/crm/complaints` | Phase 5 | SLA/priority/status/owner queue |
| `/crm/complaints/new` | Phase 5 | Company/Contact/Shipment/Invoice-linked capture |
| `/crm/complaints/[id]` | Phase 5 | Investigation, tasks, root cause, resolution, customer/internal timeline |
| `/crm/reports` | Foundation backlog / Phase 5 | Metric definitions, date/currency/freshness controls, role-scoped charts/tables |
| `/crm/retention` | Phase 5 | Account health, inactivity, repeat business, churn review queue |
| `/crm/imports` | Foundation backlog | Import jobs and templates |
| `/crm/imports/new` | Foundation backlog | Upload, sheet/header, mapping, dry-run |
| `/crm/imports/[id]` | Foundation backlog | Validation, duplicates, errors, approval, commit, result |
| `/crm/settings/teams` | Later | Team/membership management |
| `/crm/settings/pipeline` | Later | Versioned stages/probabilities/loss reasons |
| `/crm/settings/rules` | Later | Approved reminder/approval/retention/SLA values |

## 5. Compatibility routes

### 5.1 Existing `/quotes`

- Keep `/quotes` and `/quotes/[id]` functional during the initial rollout.
- Label these records **Website inquiries** or **Quote requests**, not native Quotations.
- A bridge may show/open the linked CRM Lead and idempotent conversion action.
- `/crm/inquiries` may reuse the same source data with CRM-specific matching/ownership context.
- Do not redirect `/quotes` until bookmarks, role access, audit, search, and all existing workflow actions are verified against the replacement.
- After safe migration, a redirect can be considered; preserve reference-number URLs or a lookup redirect.

### 5.2 Existing `/customers`

- Keep `/customers` and current portal credential, shipment, and invoice relationships intact.
- `/crm/companies` becomes the neutral relationship view; it must show the linked legacy Customer account when present.
- Editing Company identity must not silently diverge from compatibility fields. Until the synchronization/migration service is active, show a clear source-of-truth notice and limit conflicting edits.
- Do not redirect `/customers` until all shipment, invoice, customer portal, search, and credential paths use the compatibility link safely.

### 5.3 Existing Shipment and Finance routes

- Existing `/shipments`, `/operations`, `/mawbs`, `/documents`, `/delivery-batches`, `/invoices`, and `/invoices/collections` remain authoritative.
- CRM detail pages link to them using role-safe summaries.
- No CRM page duplicates shipment status mutation, payment recording, invoice voiding, or collection truth.

## 6. Page anatomy

### 6.1 CRM Home

The home page is role-composed; it does not fetch all data and hide cards afterward.

**Initial slice cards/sections, when supported by implemented data**

- New/uncontacted Leads.
- My/team overdue Tasks and missing next actions.
- Opportunities by stage and safe estimated selling value.
- Expected close in next 7/30 days.
- Recently assigned records and recent Activities.
- Quick actions: New Lead, log Activity, create Task, search Company.

**Later cards**

- Quotation approvals and validity expiry.
- Won/lost conversion, weighted pipeline, sales cycle.
- Revenue, gross profit, and margin (authorized roles only, authoritative data/freshness labeled).
- Retention, inactive customers, complaints, and handovers.

The Director/SM view adds team selector and sensitive metrics only when authorized. Sales never receives cost/margin data. CS, O, and F receive functional work queues rather than irrelevant commercial cards.

### 6.2 My Work

Prioritize actions rather than records:

1. Overdue Tasks.
2. New assigned Leads not contacted.
3. Tasks due today, then next seven days.
4. Opportunities past expected close.
5. Records missing next action.
6. Later: quotation follow-up/expiry and approval.

Each row/card shows related record, Company/Contact, required action, due time, owner, priority, and one safe quick action. Completion prompts for outcome and next action.

### 6.3 List/table pages

**Desktop**

- Sticky page header with title, result count, primary create action, and export/bulk actions only when available.
- Filter row/drawer with active-filter chips and **Clear all**.
- Server-side pagination and stable sort; default 25–50 rows, never unbounded.
- Column chooser only for permitted fields. Sensitive columns do not exist in the client configuration for unauthorized roles.
- Entire row is not an ambiguous click target; primary identity link and action menu are explicit.
- Preserve filters/page in URL for shareable authorized views.

**Mobile**

- Cards replace wide tables; each card shows identity, status/stage, owner, route/service, next action/due, and one primary action.
- Filters open a full-height sheet with result count and **Apply**.
- Sort uses a compact select. No forced horizontal table scrolling for core work.
- Pagination uses **Previous/Next** or bounded “Load more,” retaining scroll position on return.

**Foundation backlog**

- Saved personal/team views and bulk column configuration are planned, not part of the initial deployment claim.

### 6.4 Pipeline Kanban

**Desktop**

- Columns follow canonical Opportunity stages and show count plus safe estimated selling value.
- Cards show Opportunity, Company, service/route, owner, next action/due, expected close, priority, and safe selling estimate.
- Cost/margin badges are rendered only for SA/D/SM/F.
- Dragging is an optimistic convenience only after the server validates permission, stage prerequisites, and record version. On rejection, return card to source and explain the exact prerequisite.
- Lost/won/on-hold opens a structured dialog rather than dropping directly into a terminal column.

**Mobile**

- Use a stage selector/tab plus vertical cards, not a tiny horizontally dragged board.
- **Move stage** opens an accessible action sheet with allowed transitions and missing prerequisites.
- Terminal transitions use the same dialogs as desktop.

If the initial slice implements table-based stage changes before drag/drop, label the pipeline as a pipeline view without claiming full drag interaction.

### 6.5 Detail-page template

```text
[Back] Record ID / status               [Primary action] [More]
Record name / Company
Owner · Team · Service · Route · Updated time
[Next action card: task, due, overdue/missing indicator]

Tabs or anchored sections
Overview | Activities | Tasks | Related records | Documents | Audit
```

**Lead Overview**

- Identity and source.
- Qualification checklist/score.
- Service, route, cargo, Incoterm, target date/frequency/volume/target rate.
- Missing information and next action.
- Company/Contact link and duplicate warning.

**Opportunity Overview**

- Stage, probability, expected close, owner/team, next action.
- Service, route, cargo, forecast selling revenue.
- Cost/margin section only for SA/D/SM/F.
- External quotation reference in initial slice.
- Native Quotations, handover, Shipment, and Finance summaries appear only when those phases ship.

**Company Overview**

- Legal/trading identity, roles, branches, country, account owner, risk/activity state.
- Contacts and communication preferences.
- Initial slice: Activities, Leads, Opportunities, legacy Customer link.
- Later: Quotations, Shipments, Finance, Complaints, retention.

Tabs are permission-composed on the server. An absent tab does not leak its count in badges, HTML, JSON, or prefetch data.

### 6.6 Forms

Use sections and a visible summary rather than one long form.

**Lead**

1. Source and identity.
2. Service and route.
3. Cargo and timing.
4. Commercial context.
5. Owner and next action.
6. Notes/documents.

**Company/Contact**

1. Legal/trading or person identity.
2. Roles and relationship.
3. Addresses/branches or communication details.
4. Compliance/Finance fields only when relevant and permitted.
5. Owner/preferences/status.

**Quotation draft — Phase 3**

1. Customer and scope.
2. Cargo/readiness.
3. Route Options.
4. Supplier rates and cost (authorized desktop workflow).
5. Customer charges/selling price.
6. Terms, exclusions, validity.
7. Customer-safe preview and approval triggers.

Form behavior:

- Requiredness follows lifecycle stage; incomplete drafts are allowed where safe.
- Validation summary links to the exact field/section.
- Preserve user input on recoverable error.
- Prevent double-submit and use idempotency for create/conversion actions.
- Warn before navigation when unsaved changes exist. Do not claim autosave unless it is implemented and conflict-safe.
- Display derived volumetric/chargeable calculations with formula/basis and server confirmation.
- “Unknown,” “not provided,” “not applicable,” and zero are distinct.

## 7. Search and filtering

### 7.1 Global search

- Extend the current portal search incrementally.
- Search groups: Leads, Companies, Contacts, Opportunities, later Quotations/Complaints/Activities, and existing Shipments/Invoices where permitted.
- Each group shows at most a bounded preview and **View all** link with query retained.
- Results show matched context (for example Company + Contact or route) without rendering inaccessible fields.
- Minimum query length and debouncing may be used; exact IDs/references can search immediately.
- No result must not distinguish “does not exist” from “exists but inaccessible.”
- Search state belongs in the URL on results pages.

### 7.2 Core filters

| Entity | Initial filters | Planned filters |
|---|---|---|
| Lead | owner/team, status, priority, source, service, origin/destination, inquiry/follow-up date | score range, volume, saved views |
| Opportunity | owner/team, stage, service, route, expected close, priority | revenue/margin range, probability, source, saved views |
| Company | role, country, account owner, active/inactive | risk, service, revenue/activity, retention |
| Contact | Company, role, country, active/inactive | preferred channel, last activity |
| Activity/Task | owner, type/status, due/date range, related entity | outcome, automation source |
| Quotation | — initial external reference only | status, validity, service, route, approver, customer, amount, margin (authorized) |

Filters containing cost/margin do not appear for unauthorized roles and are rejected if manually supplied in a URL.

## 8. Mobile workflows

### 8.1 New Lead triage

1. Open new-Lead card.
2. Tap email/phone/WhatsApp link (external app behavior remains explicit).
3. Return and tap **Log activity**.
4. Select outcome and set next Task/due date.
5. Update status or missing-information checklist.

Target: common path in no more than two page transitions after opening the Lead; no horizontal scrolling.

### 8.2 Log call/WhatsApp

- Sticky **Log activity** action on Lead/Company/Contact/Opportunity detail.
- Preselect related record, owner, current time, and channel from chosen action.
- Require outcome/summary only to the approved minimum.
- Offer **Complete current task** and **Create next task** in the same submit.
- Manual activity is labeled manual; it does not claim provider delivery/read receipt.

### 8.3 Task completion

- Swipe is not the sole mechanism; provide visible **Complete** action.
- Completion sheet captures outcome and next action.
- Reschedule requires a new due date and may require reason if overdue.
- Offline/network failure leaves the Task visibly uncompleted and offers retry; no optimistic false success.

### 8.4 Quotation status and approval — Phase 3

- Mobile may view customer-safe options, totals, terms, validity, diff summary, trigger list, and—only for authorized roles—cost/margin.
- Approval uses explicit **Approve**, **Reject**, **Request changes** buttons plus confirmation.
- Dense rate sourcing and charge-grid editing is desktop-recommended; mobile editing is not required for first quotation release.

### 8.5 Dashboard

- Stack one-column work cards, with highest-priority queue first.
- Charts must have readable summaries/tables and avoid relying on hover.
- Date range/team filters remain reachable at the top.

## 9. System states

### 9.1 Loading

- Route-level skeleton matches final layout; do not show stale totals as if current.
- Inline mutations disable only the affected action and show progress text.
- Long-running import/export/PDF jobs use durable job status rather than a perpetual spinner.
- Screen readers receive polite status announcements.

### 9.2 Empty

| Context | Message/action |
|---|---|
| No records ever | Explain the module and show permitted create/import action. |
| No filter results | State filters caused no match; show **Clear filters**. |
| No Tasks | “No open tasks in this view”; do not imply all work is compliant if missing-next-action exceptions exist. |
| No Activities | Prompt to log first interaction if permitted. |
| No cost access | Omit section entirely; do not display “restricted cost exists.” |
| Planned feature absent | Do not ship a misleading empty live page. Use no navigation/route or an explicit authorized “Planned” boundary in non-production only. |

### 9.3 Validation and business-rule error

- Place field error next to input and top summary with focus link.
- State what is missing/invalid and how to fix it.
- For transition blockers, list prerequisites and direct links.
- Do not clear unaffected values.

### 9.4 Permission error

- Use a neutral “You do not have access to this action or record.”
- Offer a safe destination; never identify hidden owner/customer/value.
- Log server-side denial safely. Do not instruct users to manipulate roles themselves.

### 9.5 Concurrency conflict

- Say the record changed, identify non-sensitive changed fields/time/user when permitted, and offer **Review latest**.
- Preserve user draft locally where safe.
- Never silently overwrite protected stage, owner, approval, acceptance, close, merge, or conversion changes.

### 9.6 System/integration error

- Use safe correlation ID and retry guidance.
- Distinguish “record saved, notification failed” from “record not saved.”
- Provider failure never produces a false sent/delivered state.

## 10. Confirmations and destructive actions

| Action | Confirmation |
|---|---|
| Normal status/stage change | Show from/to state and prerequisite side effects |
| Won | Accepted evidence, selected scope, Tasks closed, handover next step |
| Lost/disqualified | Structured reason, Tasks to close, reactivation option |
| Reassign | Old/new owner/team, open Tasks, reason |
| Archive Company/Contact | Dependency summary, reason, exact-name confirmation for high-impact Company |
| Restore | Duplicate/conflict preview and safe restored status |
| Merge | Survivor, field winners, relationship counts, portal/customer compatibility, typed confirmation |
| Submit quotation | Version freezes and cannot be edited |
| Approve/reject | Exact Version, totals/validity, triggered rules, required reason on reject |
| Send quotation | Version, recipients, channel, validity, attachments |
| Shipment conversion | Accepted source, Company, route/cargo, one-intake guarantee |
| Bulk action/import commit | Entity, filters/file, count, sample/errors, target owner/team, idempotency |

Use archive/void/close language appropriate to the entity. Do not label reversible archive as delete.

## 11. Bulk-action behavior — foundation backlog, not initial

1. User selects rows on the current page or explicitly chooses **all matching filters**.
2. UI states selected count and filter snapshot; changing filters clears selection.
3. Available actions are intersection of user permission and every selected record’s valid state.
4. Server previews authorized affected/skipped/conflicting records and consequences.
5. User confirms action, value, and reason where required.
6. Commit re-runs query and authorization; changed/inaccessible rows are skipped with explicit count or block according to action safety.
7. Result shows succeeded, skipped, failed, and downloadable error details. No silent partial success.
8. One batch audit links item-level mutations/errors.

Initial deployment must not expose non-functional bulk controls or claim CRM import/export support merely because existing shipment/invoice bulk tools exist.

## 12. Accessibility and responsive acceptance

- All inputs have programmatic labels, help/error association, sensible keyboard order, and visible focus.
- Status/stage/priority/overdue use text/icon in addition to color.
- Tables have captions/headers; card alternatives retain the same primary information.
- Dialog focus is trapped and returns to the invoking control; Escape behavior never discards committed work.
- Kanban is operable without drag: every card has a stage-change action.
- Charts include text totals and accessible tabular summaries.
- Tap targets are at least approximately 44 × 44 CSS pixels for primary mobile controls.
- At 360 px, Lead review/update, Activity log, Task creation/completion, Company lookup, quotation status review, and later approval have no page-level horizontal overflow.
- At 200% zoom on desktop, core reading/editing remains usable.
- Reduced-motion preference is respected.

## 13. Initial-slice UX acceptance

Before reporting the first CRM slice live, verify the exact deployed routes and prove:

1. Portal navigation is capability-aware and existing Operations/Finance links still work.
2. Company, Contact, Lead, Opportunity, Activity, and Task list/detail/create/edit paths work for intended roles and fail safely for denied roles.
3. Quote-request bridge preserves `/quotes`, links/returns the existing Lead on retry, and labels source records as inquiries.
4. Lead/Opportunity pages show owner, status/stage, next action/due state, route/service, and missing prerequisites without conflating entities.
5. Pipeline stage changes enforce server prerequisites; no UI claims drag/drop if only explicit stage action is implemented.
6. Search returns only implemented authorized entity groups and links safely to existing records.
7. Audit displays only implemented core events and is not described as complete sensitive-access telemetry until that work exists.
8. Sales cannot access another owner’s records or any supplier cost/margin through route, search, HTML, RSC payload, Server Action, error, or aggregate.
9. Core workflows pass at 360 px and keyboard-only navigation.
10. Saved views, CRM imports/exports, automation, native quotation/PDF, shipment conversion, complaints, retention, and provider integrations are absent from production claims and navigation unless separately delivered.
