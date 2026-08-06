# CRM Repository Audit

**Document status:** Source-verified planning baseline
**Source baseline:** `origin/main` / `81ff43f421187eb76ef6c732ee141a7084a73dc3` (`Fix paid invoice payment voiding`, 2026-08-06)
**Audit date:** 2026-08-07
**Related documents:** [Product Requirements](./CRM-PRODUCT-REQUIREMENTS.md), [Data Model](./CRM-DATA-MODEL.md), [User Flows](./CRM-USER-FLOWS.md), [Permissions Matrix](./CRM-PERMISSIONS-MATRIX.md), [UI Information Architecture](./CRM-UI-INFORMATION-ARCHITECTURE.md), [Implementation Roadmap](./CRM-IMPLEMENTATION-ROADMAP.md), [Backlog](./CRM-BACKLOG.md), [Risks and Decisions](./CRM-RISKS-AND-DECISIONS.md)

## 1. Scope and evidence standard

This audit describes what is present in the named Git commit. It does not claim that the deployed Vercel application or any Neon database matches that commit.

### Verified

- Repository files, dependency declarations, scripts, migrations, route structure, schema declarations, and tests at commit `81ff43f`.
- The repository is a single Next.js application with a static marketing site, an authenticated staff portal, public/customer endpoints, and a shared Postgres database layer.
- Migration `018` is absent from the source tree while `019-default-mandiri-invoice-bank-account.sql` is present.

### Not verified

- Production or preview deployments, deployed commit, runtime environment values, custom domains, Vercel settings, Neon project/branch, database contents, row counts, installed extensions, schema drift, and applied-migration history.
- Whether every migration in the repository has been applied in any environment.
- Customer, shipment, quotation, invoice, payment, or staff data quality.
- Current external service health for Neon, R2, Resend, or Vercel.

Any live-data or deployment assertion therefore remains **Decision Required** until a separately approved read-only inspection is completed. No secrets or record contents are needed for that inspection.

## 2. Architecture summary

| Area | Source-verified implementation | CRM implication |
|---|---|---|
| Application | Next.js `16.3.0`, React `19.2.4`, App Router, TypeScript 5, Node `>=20.9.0` | Extend the monolith incrementally. Before implementation, follow `AGENTS.md` and read the relevant installed Next.js 16 guides because repository instructions warn of breaking conventions. |
| Rendering and mutations | Server Components, Client Components, Route Handlers, and `"use server"` actions | Use Server Components for CRM reads, authorized Server Actions for internal mutations, and Route Handlers only for downloads, webhooks, public APIs, or external integrations. |
| Database | Neon Serverless Postgres through Drizzle ORM `0.45.2`; `postgres` package for migrations | Add normalized CRM tables through checked, additive SQL migrations and matching Drizzle declarations. Keep one database and transactional boundaries. |
| Authentication | Custom staff JWT cookie plus database-backed session version; separate legacy customer-session validation | Extend existing staff auth rather than introduce a second identity system. Preserve the staff/customer token audience boundary. |
| Authorization | Code-defined roles and JSON capability lists | Add CRM capabilities in source; store teams, memberships, ownership, and role assignments in the database. Enforce field and row scope server-side. |
| Staff portal | Dark Tailwind portal shell with responsive sidebar, breadcrumbs, global search, and small shared UI primitives | Add `/crm` to the existing shell and reuse its responsive and accessibility patterns. Do not replace unrelated portal UI. |
| Public site/API | Static pages in `public/` and a consolidated legacy API dispatcher under `app/api/[[...path]]` | Preserve public quote/contact contracts. Convert website quote requests idempotently behind the existing intake boundary. |
| File storage | Cloudflare R2 via AWS S3 client; signed downloads; PDF/JPEG/PNG validation | Reuse the storage client and validation concepts for generic CRM attachments, but keep shipment documents and CRM attachments in separate tables/prefixes. |
| Email | Resend REST API used by legacy form handlers; `resend` is also declared as a dependency | Reuse one server-only email adapter after consolidating the two potential access styles. In-app notification state remains canonical. |
| PDF | `pdf-lib` and QR code generation for invoices | Reuse the server-side PDF pattern and visual assets for quotation PDFs; implement a quotation-specific renderer and customer-safe DTO. |
| Deployment | `vercel.json` declares Next.js and `npm run migrate && npm run build` | Decouple schema mutation from ordinary application builds before CRM rollout; use a controlled migration gate followed by build/deploy. |
| Testing | Node test files (`.test.mts`, `.test.cjs`) and ESLint; no consolidated `test` script | Add a deterministic CRM test command and CI gate. Existing focused tests show usable patterns. |
| Observability | Primarily `console.error`/`console.warn`; database audit tables for selected portal and invoice actions | Add structured request/action logging, safe error correlation, and CRM audit coverage before automation or integrations. |

The recommended target remains a modular monolith. Microservices, a separate CRM database, and multi-tenancy add cost without solving a current requirement.

## 3. Relevant repository map

| Path | Current responsibility | Reuse or constraint |
|---|---|---|
| `lib/db/schema.ts` | Drizzle declarations for shipments, operational tasks, staff, customers, quote requests, documents, invoices, payments, and audit data | Canonical source declaration to extend. It currently uses many unconstrained text statuses and mixed identifier types. |
| `lib/db/index.ts`, `lib/db/env.ts` | Lazy Neon HTTP/Drizzle client and runtime database URL resolution | Reuse. The environment names retain `NETLIFY_` despite Vercel deployment. |
| `migrations/`, `scripts/migrate.cjs` | Numbered SQL files, checksums, `schema_migrations`, selected object verification, `--check` mode | Reuse after allocating the next approved number and adding expected-object checks. `018` cannot be assumed available merely because it is absent. |
| `lib/portal-auth.ts`, `actions/auth.ts` | Staff JWT creation/validation, 8-hour HTTP-only cookie, session revalidation, login throttling | Reuse; add login activity audit and ensure CRM reads/mutations call capability guards. |
| `lib/portal-roles.ts`, `lib/portal-capabilities.json` | Source-defined roles and capability sets | Extend with CRM permissions. Current roles do not represent Director, Sales Manager, Sales, or Customer Service. |
| `components/portal/portal-shell.tsx`, `components/ui/core.tsx`, `app/globals.css` | Responsive navigation, page frame, minimal Button/Card/Input components, Tailwind theme | Reuse. CRM needs additional form, table, dialog, tabs, combobox, toast, and accessible Kanban patterns. |
| `actions/quotes.ts`, `lib/quotes/core.ts`, `app/(portal)/quotes/` | Internal triage for website quote requests | Keep as inquiry intake/compatibility. Do not rename these records to freight quotations. |
| `server/legacy-api/handlers/submit-contact.js`, `submit-quote.js` | Public intake validation, rate limiting, persistence, and email acknowledgement | Preserve public behavior. Add an idempotent CRM conversion adapter after the intake transaction. |
| `actions/customers.ts`, `lib/customers/duplicates.ts`, `app/(portal)/customers/` | Customer CRUD, archive, credential management, exact normalized duplicate signals | Preserve for compatibility; reuse normalization logic as one signal within a stronger company/contact review workflow. |
| `actions/shipments.ts`, `actions/guided-shipment.ts`, `lib/shipments/*` | Shipment creation, readiness, status, service model, void/restore, and idempotency | Accepted quotations should create a gated shipment intake draft through an adapter, not a second shipment system. |
| `actions/documents.ts`, `lib/documents/core.ts`, `lib/r2/index.ts` | Validated, versioned shipment documents in R2 with signed download | Reuse storage primitives; do not overload the shipment-only `documents` table for CRM attachments. |
| `actions/invoices.ts`, `lib/invoices/*`, invoice routes | Invoice generation, lifecycle, payments, collections, export, verification, PDF | Finance remains authoritative. CRM reads safe summaries and never writes payment state. |
| `lib/portal-audit.ts`, `portal_audit_logs`, `invoice_audit_log` | Selected append-only action records | Consolidate the audit service contract while preserving existing tables during incremental migration. |
| `app/api/[[...path]]/route.ts`, `server/legacy-api/` | Adapter from Next Route Handler to legacy function-style handlers with access policy | Leave current public/customer APIs unchanged until a versioned integration phase. |
| `next.config.js`, `proxy.ts`, `docs/portal-security-runbook.md` | Security headers, CSP, redirects, blocked legacy admin paths, deployment security gate | Add `/crm/:path*` to portal CSP coverage and preserve existing staff/customer isolation. |

## 4. Current domain model and boundaries

### 4.1 Customer data is a compatibility aggregate, not a neutral company master

`customers` currently combines:

- Company and person identity (`company_name`, `full_name`, contact fields, addresses, country, NPWP).
- Billing compatibility (`customer_id`, `invoice_code`).
- Customer portal credentials (`password_hash`, `session_version`).
- Archive state.

Shipments and invoices refer to customer IDs, and legacy customer-session validation queries this table directly. It therefore should not be repurposed in-place to represent vendors, airlines, overseas agents, or shipping lines.

**Recommendation:** introduce neutral `crm_companies`, `crm_contacts`, branches, and company-role records. Add a one-to-one compatibility bridge from a CRM Company to an existing customer row when that company is a customer/portal/billing account. Profile live data before backfill. During transition, one company service owns shared fields and writes deliberate compatibility snapshots; two independently editable masters are prohibited.

### 4.2 `quote_requests` is inquiry intake

The existing record holds public form fields, contact identity, basic cargo/route values, an assignee, next action, due time, notes, and a small status set (`new`, `reviewing`, `quoted`, `won`, `lost`, `closed`). The portal supports triage and audit but does not model:

- Opportunity value, stage, probability, or lost reason taxonomy.
- Supplier rates, cost, selling price, margin, currency snapshots, or taxes.
- Multiple quotation options/routes.
- Immutable versions, approval, PDF, sending, acceptance, or expiry.

It must remain an inquiry source. The conversion to a Lead should have a unique source reference so retries cannot create duplicate Leads.

### 4.3 Operations is already substantial

The shipment schema already provides:

- `operational_stage` defaulting to `intake`.
- Readiness, assignee, blocker, next action, due dates, cargo risk and compliance flags.
- Unique idempotency key.
- Packages, operational tasks, flight legs, documents, tracking, void/restore, and audit patterns.

Therefore, accepted-quotation conversion should create an existing shipment in `intake` with a unique link to the accepted Quotation Version and an immutable commercial handover snapshot. Operations explicitly activates it. A separate operational handover subsystem would duplicate the current queue.

### 4.4 Finance remains authoritative

Invoices hold customer snapshots and lifecycle state. `invoice_payments` records partial payments and voids. CRM may derive account summaries such as invoiced revenue, outstanding balance, and last payment date from authorized Finance projections. It must not infer payment state from quotation acceptance, overwrite invoices, or duplicate payment rows.

### 4.5 Existing audit is partial

`portal_audit_logs` and `invoice_audit_log` cover selected actions but use different field shapes. They do not provide a complete, queryable change history for all records, login success/failure history, field-level before/after values, exports, merges, or explicit sensitive-field reveal events.

The CRM requires one audit-write service with action names, actor, entity, timestamp, reason, request correlation, and redacted metadata. Passwords, tokens, attachment object keys, and full cost payloads must never enter audit metadata.

## 5. Authentication, authorization, and security

### Current controls

- Staff authentication uses bcrypt password verification and a signed JWT in an HTTP-only, SameSite Lax cookie with an eight-hour maximum age.
- Each request revalidates the account's active state, role, email, and `session_version` against Postgres.
- Login throttling uses a pseudonymous key and database state.
- Capabilities are checked in server actions and route layouts for existing modules.
- Staff and customer signing secrets/audiences are separated by source design.
- CSP, clickjacking, MIME-sniffing, referrer, permissions, cross-origin, and HSTS headers are declared.
- R2 downloads use five-minute signed URLs; upload validation checks size, allowed MIME type, and magic bytes.

### CRM gaps

- There are no Sales, Sales Manager, Director, or Customer Service roles.
- There are no teams, memberships, record ownership scopes, delegated access, or field-level cost/margin permissions.
- Existing capability helpers answer module/action access but not `own` versus `team` versus `all` row scope.
- Some data relationships use integer columns without declared foreign keys, so server validation carries more responsibility.
- Login events and exports are not comprehensively audited.
- In-memory public-form rate limiting is instance-local and unsuitable as a strong abuse control across serverless instances.
- No centralized schema-validation library is declared. Validation is hand-written in actions and helpers.

### Required security architecture

1. Keep permission keys and role defaults code-defined and reviewed in Git.
2. Store staff role assignments, teams, memberships, and record owners in Postgres.
3. Resolve authorization through a server-only policy function that combines capability, field permission, row scope, and archive state.
4. Return minimal DTOs. Supplier cost, supplier identity where confidential, gross profit, gross margin, internal notes, approval comments, and audit metadata are absent from customer-facing DTO types.
5. Restrict cost and margin to Sales Manager, Director, Finance, and Super Admin by the approved policy; ordinary Sales, Customer Service, Operations, and Viewer receive selling/customer-safe views only.
6. Audit explicit cost reveals, cost/margin exports, quotation approvals, permission changes, merges, archive/restore, ownership changes, and shipment conversion.
7. Use parameterized Drizzle queries; add database constraints for lifecycle invariants rather than relying only on forms.

## 6. Application conventions

### Reads and mutations

The repository primarily uses direct Drizzle queries in Server Actions and Server Components. CRM should introduce a server-only data-access layer rather than allow pages to assemble unrestricted records. A recommended layering is:

1. `lib/crm/domain/*`: enums, calculations, transition rules, safe pure functions.
2. `lib/crm/policy/*`: capability, field, and row-scope decisions.
3. `lib/crm/data/*`: scoped queries returning explicit DTOs.
4. `actions/crm/*`: input validation, authorization, transaction, audit, revalidation/redirect.
5. `app/(portal)/crm/*`: route composition and presentation.

Route Handlers are reserved for public inquiry conversion, signed downloads, import/export files, webhooks, and provider callbacks.

### Forms and validation

Current forms extract and validate `FormData` manually. `lib/forms/action-state.ts` supplies a simple field/form error shape. No Zod, Valibot, Yup, React Hook Form, or similar package is declared.

For the Commercial Foundation, shared typed validators can remain dependency-free if they are centralized and tested. Before the quotation engine, adopt one schema-validation strategy because charge/currency/version payloads are too complex for page-local string parsing. Choosing a new validation dependency is **Decision Required**; the implementation must not introduce multiple competing validators.

### Search

Current searches use case-insensitive wildcard matching with targeted indexes. CRM v1 should remain in Postgres using normalized email/phone/name fields, B-tree/partial indexes for queues and ownership, and carefully bounded queries. `pg_trgm` is optional only after read-only confirmation that the target database supports it. No external search service is justified in the first release.

## 7. Storage, communications, and documents

### Attachments

Reusable controls include sanitized names, MIME/magic-byte checks, 8 MB limit, SHA-256 checksum, versioning, R2 object prefixes, compensating delete on failed metadata commit, and short-lived download URLs.

CRM needs a generic attachment record with explicit typed links and confidentiality classification. It must not store a permanent public URL. R2 object keys must not be returned to unauthorized clients or written into user-visible audit metadata.

### Email and notifications

Legacy form handlers call the Resend HTTP API with retry behavior and masked summaries. The declared `resend` SDK is not used in the inspected source. CRM should expose one email adapter and persist provider message IDs, delivery state, and failure reason without storing secrets.

In-app notifications are canonical because email can fail or be delayed. Email is an escalation/delivery channel. WhatsApp and ordinary email conversations are manually logged in the Commercial Foundation; integrations belong to Phase 6.

### PDF

Invoice PDF generation proves server-side `pdf-lib` rendering, logo loading, QR codes, filenames, and route delivery. Quotation PDFs should reuse those technical patterns but never share invoice domain types. PDF generation must accept a customer-safe immutable quotation-version DTO so internal cost cannot leak through a template branch.

## 8. Deployment, migrations, tests, and monitoring

### Migration findings

- `scripts/migrate.cjs` loads `.env.local`, connects with `postgres`, creates/verifies `schema_migrations`, checks checksums, and applies each numbered file from `006` upward transactionally.
- Only selected migrations have explicit expected-object checks. A new CRM migration must add its expected tables, columns, constraints, and indexes to `migrate:check` coverage.
- `vercel.json` runs `npm run migrate && npm run build`, so an ordinary deployment build may mutate whichever database the build environment selects.
- `018` is absent and `019` exists. Absence is not proof that `018` is free or reserved. Its ownership must be confirmed before allocating a new number.

**Required gate:** create and validate migrations against an isolated non-production branch, run `migrate:check`, backfill through separately reviewed scripts, obtain production approval, apply migration once, then deploy application code. Remove database mutation from the generic build command or constrain it behind a deliberate release job before Phase 1 production rollout.

### Testing findings

- The repository contains focused Node tests for security, roles, customers, shipments, documents, tracking, invoices, and migrations.
- ESLint and `next build` are available.
- There is no consolidated `npm test` or CRM test script in `package.json`.
- No browser end-to-end framework is declared.

CRM acceptance requires unit tests for normalization and transitions, policy/DTO tests for confidentiality, database integration tests on a disposable branch, source tests for migrations, and responsive browser tests for the highest-risk flows. Tests must prove both allowed and denied behavior.

### Logging and monitoring findings

The inspected code relies mostly on console logging plus database audit rows. There is no source-verified error-tracking, tracing, or metrics provider. Add structured logs with correlation IDs and redaction before public conversion or email automation. Provider selection is **Decision Required**; the first release can ship with safe structured platform logs and database audit if alerts and retention are explicitly configured.

## 9. Reuse decisions

| Existing capability | Decision |
|---|---|
| Staff JWT, session version, login throttle | Reuse and extend; do not add a second staff login. |
| Code-defined capability map | Reuse; add CRM keys and a scoped policy layer. |
| `customers` | Preserve as customer portal/billing compatibility; bridge to neutral Company. |
| Customer duplicate helpers | Reuse normalization concepts; expand to scored duplicate candidates and human merge review. |
| `quote_requests` and `/quotes` | Preserve as website inquiry intake and expose the idempotent **Convert to Lead** bridge on `/quotes/{id}`; do not treat requests as quotations. A dedicated CRM inquiry route remains backlog. |
| Shipment intake, idempotency, readiness queue | Reuse for accepted-quotation handover. |
| Operational tasks | Keep for shipment execution; CRM Tasks remain commercial follow-ups. |
| Invoice/payment tables | Read through Finance-safe projections only. |
| R2 storage and validation | Reuse primitives; add CRM-specific table/object prefix/policy. |
| Invoice PDF renderer | Reuse techniques/assets; create quotation renderer with separate DTO. |
| Portal audit and invoice audit | Preserve; introduce a shared service and CRM-specific complete action coverage. |
| Portal shell and UI primitives | Extend incrementally. |
| Legacy API dispatcher | Preserve public contracts; do not build new internal CRM APIs into it. |

## 10. Prerequisite work

### P0 blockers before production CRM data writes

1. Read-only environment inventory: deployed commit, Neon target/branch, applied migrations/checksums, schema drift, extensions, and backups. Production state remains unverified until completed.
2. Confirm the next migration number; do not assume `018` is available.
3. Move database mutation out of the generic Vercel build or establish an equally explicit single-run release gate.
4. Approve the CRM roles, team scopes, and managers-only cost/margin policy; implement server-side policy tests.
5. Profile and map legacy customer data before creating company links or backfills.
6. Add a repeatable test command and isolated database test target.
7. Define rollback: application compatibility rollback plus forward-fix database strategy for additive migrations.

### Recommended debt, not a Phase 1 blocker

- Consolidate duplicated email access behind one adapter.
- Standardize action-state and validation conventions.
- Add structured error/metrics provider after a management decision.
- Incrementally replace unconstrained text statuses with checks or typed lookup records as each module is touched.
- Consolidate audit readers while preserving historical tables.
- Rename `NETLIFY_DATABASE_URL` only through a compatibility period; it is confusing but not itself a functional blocker.

## 11. Main conflicts and risk conclusions

1. **Customer master coupling:** in-place expansion of `customers` would mix suppliers and agents with portal credentials and Finance references. The bridge model is safer.
2. **Quotation naming collision:** current Quotes are inbound requests. Native freight Quotations require separate tables and routes.
3. **Authorization mismatch:** current roles cannot express Sales ownership or team visibility. A UI-only role check would leak commercial data.
4. **Build-time migration coupling:** deployment could mutate the wrong database before application verification.
5. **Unverified production state:** source and live schema may differ; backfill design cannot be approved from Git alone.
6. **Status sprawl:** current text values and proposed CRM lifecycles need canonical enums/check constraints and transition services.
7. **Audit fragmentation:** partial logs are insufficient for cost reveals, approvals, exports, and merges.
8. **Adoption risk:** the Foundation Release must support external quotation references/attachments so sales users do not maintain an invisible parallel pipeline while native quotation work is pending.

## 12. Audit conclusion

The repository can support a freight-specific CRM without a rewrite. Its strongest reusable foundations are the authenticated portal, Drizzle/Neon data layer, capability checks, shipment intake/idempotency, R2 documents, PDF generation, invoice/payment references, and responsive portal shell. The first safe delivery is a Commercial Foundation built as new normalized CRM modules, bridged to existing customer/inquiry/operations/Finance records. The production database and deployment must be inspected read-only and migrations must be separated from ordinary builds before the first production write.
