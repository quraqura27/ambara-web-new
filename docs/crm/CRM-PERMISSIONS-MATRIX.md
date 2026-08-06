# Ambara Freight CRM — Permissions Matrix

**Document status:** Target authorization contract<br>
**Source-code baseline:** `origin/main` at `81ff43f421187eb76ef6c732ee141a7084a73dc3`<br>
**Related requirements:** CRM-NFR-SEC-001 through CRM-NFR-SEC-005<br>
**Related decisions:** CRM-DEC-008, CRM-DEC-009, CRM-DEC-019

> This matrix defines the target CRM authorization model. The source baseline currently has `superadmin`, `admin`, `operations`, `finance`, and `viewer` plus code-defined portal capabilities. New CRM roles, scopes, and field permissions are not implied to be live merely because they are defined here. The implementation must migrate roles deliberately and verify each role with authenticated tests.

## 1. Security model

Authorization is the intersection of four checks:

```text
allowed = authenticated
       AND role_has_permission_key
       AND record_is_in_scope
       AND requested_fields_are_allowed
       AND business_state_allows_action
```

- **Permission keys** are code-defined, reviewed, tested, and deployed with source.
- **Role assignments, teams, team membership, managers, record ownership, and scoped grants** are stored in the database.
- **Business-state rules** prevent invalid actions even when a role normally has the permission: for example, a sent Quotation Version cannot be edited.
- **Server-side data access** applies row scope and projects safe DTO fields. Client components never receive fields merely to hide them.
- **Normal deletion is archive-only.** No role receives a general hard-delete permission.
- **Cost confidentiality is locked:** supplier cost, gross profit, and margin may be viewed only by Super Admin, Director, Sales Manager, and Finance. Sales, Customer Service, Operations, Viewer, Legacy Admin, and all customer/public surfaces are denied.

## 2. Legend and default scopes

### 2.1 Cell values

| Mark | Meaning |
|---|---|
| — | Denied by default |
| ✓ | Allowed for the cell’s stated record scope |
| R | Read only |
| C | Create |
| E | Edit |
| A | Archive |
| RR | Restore |
| X | Export |
| AP | Approve according to policy |
| BG | Break-glass only; reason and heightened audit required |
| Config | Allowed only through versioned configuration workflow |

### 2.2 Record scopes

| Code | Scope | Definition |
|---|---|---|
| `OWN` | Assigned | User is current owner, creator while unassigned within a short creation window, or explicitly assigned collaborator. |
| `TEAM` | Managed team | `OWN` plus records owned by active members of teams the user manages. Nested teams are not implied. |
| `ALL` | Company-wide | All records of that class in Ambara’s single legal-entity workspace. |
| `SERVICE` | Customer-service safe | Company-wide customer/contact/communication records and customer-safe commercial/operational summaries needed to serve customers; excludes cost, margin, internal approval, and restricted sales notes. |
| `OPS` | Operationally linked | Won handovers and Shipments explicitly linked to the user/Operations queue; excludes pre-win commercial details not required for execution. |
| `FIN` | Finance linked | Invoices, payments, collections, billing/customer data, and approved commercial summaries needed for Finance. |
| `GRANT` | Explicit read grant | Read-only records individually or collection-scoped by an authorized administrator; never broadens field access. |

### 2.3 Default role scopes

| Role | Lead/Opportunity | Company/Contact | Quotation | Shipment/handover | Finance | Complaint |
|---|---|---|---|---|---|---|
| Super Admin | ALL | ALL | ALL | ALL | ALL | ALL |
| Director | ALL | ALL | ALL | ALL summaries | Approved summaries | ALL |
| Sales Manager | TEAM | TEAM plus shared master matches | TEAM | TEAM handovers + linked summaries | Approved indicators | TEAM |
| Sales | OWN | OWN-linked plus duplicate-candidate minimum | OWN | OWN handover + linked safe summaries | Approved indicators only | OWN-linked read |
| Customer Service | SERVICE | SERVICE | SERVICE read | SERVICE/linked shipment safe view | Billing/outstanding indicator only | SERVICE manage |
| Operations | — before win; OPS summary after win | OPS-linked | Accepted customer-safe snapshot only | OPS manage | — | OPS-linked manage |
| Finance | FIN summary | FIN | Approved/sent/accepted commercial + confidential financial fields | FIN-linked summary | FIN manage | Billing/rate-linked manage |
| Viewer | GRANT | GRANT | GRANT | GRANT | GRANT only if explicitly granted | GRANT |
| Legacy Admin | No new CRM scope until remapped | Existing portal capability only | Existing quote-request capability only | Existing portal capability only | Existing portal capability only | — |

Duplicate-candidate searches return only the minimum identity needed to resolve a match. They do not grant access to full records outside normal scope.

## 3. Executive role/action matrix

This is the requested cross-role summary. Module-specific tables below are authoritative where a cell needs more detail.

| Role | View | Create / edit | Archive / restore | Export | Approve | Assign | Reassign | View supplier cost | View GP / margin | View Finance | Manage users | Manage settings |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Super Admin | ALL | ALL | A/RR ALL | X allowed fields; sensitive export reason | BG commercial; normal technical/admin | ALL | ALL | Yes | Yes | Yes | Yes | Yes |
| Director | ALL commercial | ALL commercial | A/RR commercial | X commercial; sensitive by capability | AP company-wide | ALL commercial | ALL commercial | Yes | Yes | Approved summaries | No | No; approves business policy outside system config |
| Sales Manager | TEAM | C/E TEAM | A TEAM; RR by capability | X TEAM customer/selling; no supplier-rate-book export | AP TEAM per policy | TEAM | TEAM | Yes, TEAM | Yes, TEAM | Approved indicators | No | No |
| Sales | OWN | C/E OWN | A OWN draft/non-protected; no RR | No bulk export by default; controlled OWN extract if granted | No | Accept own assignment only | No | **No** | **No** | Indicator only | No | No |
| Customer Service | SERVICE | C/E service data, communications, complaints | A service records by rule; no RR | Customer-safe service export only if granted | No commercial approval | Service queue only | Service queue only | **No** | **No** | Billing/outstanding indicator only | No | No |
| Operations | OPS | C/E operational handover/shipment | Per existing shipment policy | Operational export per existing capability | Confirm readiness; not commercial approval | OPS queue | OPS queue | **No** | **No** | No | No | No |
| Finance | FIN | C/E Finance; limited Company billing fields | Per Finance retention/void rules | X Finance; supplier-cost export only if explicitly granted | AP credit/tax/payment exceptions, not normal quote approval | Finance queue | Finance queue | Yes | Yes | Yes | No | No |
| Viewer | GRANT R | No | No | No | No | No | No | **No** | **No** | Only explicit read grant | No | No |
| Legacy Admin | Existing portal scope only | Existing portal actions only | Existing portal rules | Existing portal rules | No CRM approval | No CRM assignment | No CRM reassignment | **No** | **No** | Existing capability only | No | No |

**Hard delete:** denied for every role. A separately built, legally reviewed purge job may remove expired data according to retention policy; it is not an interactive role permission.

## 4. Proposed permission-key catalog

Permission keys are additive to the existing portal capabilities. Names below are canonical for implementation; aliases should not proliferate.

### 4.1 Workspace, identity, and configuration

| Key | Purpose | Default roles |
|---|---|---|
| `crm:view` | Enter CRM shell and use CRM-safe navigation | SA, D, SM, S, CS, O, F, V after assignment |
| `crm:user:manage` | Create/deactivate staff, reset credentials, revoke sessions | SA |
| `crm:role:assign` | Assign code-defined roles | SA |
| `crm:team:manage` | Create teams, managers, and memberships | SA |
| `crm:settings:manage` | Manage technical CRM settings and approved business-rule values | SA |
| `crm:audit:view` | View allowed audit events | SA, D; scoped SM; F for Finance audit |
| `crm:sensitive_access:audit` | View explicit sensitive-field access/export events | SA, D; security/audit grant |

### 4.2 Relationship master

| Key | Purpose | Default roles |
|---|---|---|
| `crm:company:view` | View Company within scope | SA, D, SM, S, CS, O, F, V by scope |
| `crm:company:create` | Create Company or provisional Company | SA, D, SM, S, CS |
| `crm:company:edit` | Edit permitted Company fields | SA, D, SM, S-own, CS-service, F-billing subset |
| `crm:company:archive` | Archive eligible Company | SA, D, SM-team |
| `crm:company:restore` | Restore after conflict review | SA, D |
| `crm:company:merge` | Merge duplicates and reassign links | SA, D; trained data steward grant |
| `crm:company:export` | Export permitted Company fields | SA, D, SM-team; CS/F scoped grant |
| `crm:contact:view` | View Contact within scope | Same scoped readers as Company |
| `crm:contact:create` | Create Contact | SA, D, SM, S, CS |
| `crm:contact:edit` | Edit permitted Contact fields/preferences | SA, D, SM, S-own, CS-service |
| `crm:contact:archive` | Archive eligible Contact | SA, D, SM-team, CS-service lead |
| `crm:contact:restore` | Restore Contact | SA, D, SM-team |
| `crm:contact:merge` | Merge duplicate Contacts | SA, D; data steward grant |

### 4.3 Leads, Opportunities, and work

| Key | Purpose | Default roles |
|---|---|---|
| `crm:lead:view` | View scoped Lead | SA, D, SM, S, CS-service; V grant |
| `crm:lead:create` | Create/convert Lead | SA, D, SM, S, CS |
| `crm:lead:edit` | Edit scoped Lead | SA, D, SM, S-own; CS customer-facing subset |
| `crm:lead:qualify` | Complete qualification/status transition | SA, D, SM, S-own |
| `crm:lead:override` | Override configurable qualification gate | D, SM-team; SA break-glass |
| `crm:lead:assign` | Assign unassigned record | SA, D, SM-team; assignment router |
| `crm:lead:reassign` | Change owner/team | SA, D, SM-team |
| `crm:lead:archive` | Archive eligible Lead | SA, D, SM-team, S-own with closed/draft constraints |
| `crm:lead:restore` | Restore Lead | SA, D, SM-team |
| `crm:opportunity:view` | View scoped Opportunity | SA, D, SM, S; CS safe; O/F linked; V grant |
| `crm:opportunity:create` | Create from qualified Lead/approved direct path | SA, D, SM, S |
| `crm:opportunity:edit` | Edit permitted scoped fields | SA, D, SM, S-own; CS safe subset |
| `crm:opportunity:transition` | Move allowed stages | SA, D, SM, S-own |
| `crm:opportunity:override` | Override configurable stage gate/reopen | D, SM-team; SA break-glass |
| `crm:opportunity:assign` | Assign owner | SA, D, SM-team |
| `crm:opportunity:reassign` | Reassign owner/team | SA, D, SM-team |
| `crm:activity:create` | Log scoped Activities | SA, D, SM, S, CS, O/F for linked records |
| `crm:activity:edit_own` | Correct own manual Activity within policy window | SA, D, SM, S, CS, O, F; history preserved |
| `crm:activity:redact` | Restrict/redact erroneous sensitive content | SA; D/data-protection grant |
| `crm:task:manage` | Create/update/complete own or assigned Tasks | SA, D, SM, S, CS, O, F by scope |
| `crm:task:assign` | Assign Tasks within permitted queue/team | SA, D, SM, CS lead, O lead, F lead |

### 4.4 Quotation and confidential pricing

| Key | Purpose | Default roles |
|---|---|---|
| `crm:quotation:view` | View customer-safe quotation fields in scope | SA, D, SM, S, CS; O accepted snapshot; F; V grant |
| `crm:quotation:create` | Create draft/version in scope | SA, D, SM, S-own |
| `crm:quotation:edit_draft` | Edit own/team draft before submission | SA, D, SM, S-own |
| `crm:quotation:submit` | Freeze and submit Version | SA, D, SM, S-own |
| `crm:quotation:approve` | Approve according to policy and separation of duties | D, SM-team; SA break-glass |
| `crm:quotation:send` | Produce/send approved customer-safe Version | SA, D, SM, S-own |
| `crm:quotation:acceptance_record` | Record authenticated/manual acceptance evidence | SA, D, SM, S-own; CS linked as configured |
| `crm:cost:view` | View supplier cost/source-rate detail | SA, D, SM-team, F |
| `crm:margin:view` | View gross profit and margin | SA, D, SM-team, F |
| `crm:cost:edit` | Enter/edit cost on mutable draft | SA, D, SM-team, F where process allows; Sales denied |
| `crm:cost:export` | Export cost/margin data | SA, D, F with explicit export grant; SM denied by default |
| `crm:rate_book:manage` | Maintain supplier rates | SA; designated D/SM/F rate steward |
| `crm:rate_book:export` | Export supplier rate book | SA, D, F with explicit grant and reason |

### 4.5 Handover, Finance, complaints, reporting, and data operations

| Key | Purpose | Default roles |
|---|---|---|
| `crm:handover:create` | Convert won Opportunity to Shipment intake | SA, D, SM, S-own |
| `crm:handover:view` | View handover within scope | SA, D, SM, S-own, CS-service, O-OPS |
| `crm:handover:review` | Request clarification/confirm readiness | SA break-glass, O-OPS |
| `crm:finance:summary:view` | View approved billing/outstanding indicators | SA, D, SM/S scoped indicator, CS service indicator, F |
| `crm:finance:detail:view` | View invoice/payment/collection details | SA, F; D only by explicit Finance grant |
| `crm:complaint:view` | View scoped Complaint | SA, D, SM/S linked, CS-service, O/F linked, V grant |
| `crm:complaint:create` | Create Complaint | SA, D, SM, S, CS, O/F linked |
| `crm:complaint:manage` | Triage/investigate/resolve within scope | SA, D, CS, O/F linked |
| `crm:complaint:close` | Close/reopen according to policy | SA, D, CS lead; assigned manager grant |
| `crm:report:view` | View safe dashboards in scope | All CRM roles by scope |
| `crm:report:commercial_sensitive` | Include cost/GP/margin metrics | SA, D, SM-team, F |
| `crm:export:customer_safe` | Export scoped non-sensitive CRM data | SA, D, SM-team; other scoped grants |
| `crm:import:stage` | Upload/map/dry-run an import | SA, D, SM-team; trained data steward |
| `crm:import:commit` | Commit reviewed import | SA; D/SM for approved entity/team template |
| `crm:bulk:update` | Preview/commit bulk safe-field changes | SA, D, SM-team; functional lead grants |

## 5. Module-level CRUD and workflow matrices

### 5.1 Company and Contact

| Action | SA | D | SM | S | CS | O | F | V | Legacy Admin |
|---|---|---|---|---|---|---|---|---|---|
| View Company/Contact | ALL | ALL | TEAM/shared | OWN-linked | SERVICE | OPS-linked | FIN | GRANT R | Existing customer view only |
| Create | ALL | ALL | TEAM | OWN | SERVICE | — | — | — | Existing customer action only |
| Edit general identity | ALL | ALL | TEAM | OWN-linked | SERVICE | — | Billing subset only | — | Existing fields only |
| Edit tax/NIB/compliance/risk | ALL | ALL | TEAM if granted | — | Compliance notes only if granted | — | Tax/billing subset | — | — |
| Edit credit/payment terms | ALL | Config/ALL | — | — | — | — | FIN | — | — |
| Assign account manager | ALL | ALL | TEAM | — | — | — | — | — | — |
| Archive | ALL | ALL | TEAM eligible | OWN draft/prospect only | SERVICE Contact eligible | — | — | — | Existing archive only |
| Restore | ALL | ALL | TEAM Contact/Lead-link only | — | — | — | — | — | — |
| Merge duplicate | ALL | ALL | Trained grant | — | Trained Contact grant | — | — | — | — |
| Export | ALL safe/sensitive grant | ALL | TEAM safe | — default | SERVICE safe grant | — | FIN billing | — | Existing export only |
| Manage portal credentials | Existing `customer:credentials` | — | — | — | — | — | — | — | Existing capability only |

### 5.2 Lead and Opportunity

| Action | SA | D | SM | S | CS | O | F | V | Legacy Admin |
|---|---|---|---|---|---|---|---|---|---|
| View Lead | ALL | ALL | TEAM | OWN | SERVICE safe | — | FIN-linked summary | GRANT R safe | — |
| Create/convert Lead | ALL | ALL | TEAM | OWN | SERVICE | — | — | — | — |
| Edit Lead | ALL | ALL | TEAM | OWN | Contact/service subset | — | — | — | — |
| Qualify/disqualify/dormant | ALL | ALL | TEAM | OWN | — | — | — | — | — |
| Override qualification | BG | ALL | TEAM | — | — | — | — | — | — |
| Assign/reassign | ALL | ALL | TEAM | Accept assignment | Service queue task only | — | Finance task only | — | — |
| View Opportunity | ALL | ALL | TEAM | OWN | SERVICE safe | OPS after win | FIN approved/linked | GRANT R safe | — |
| Create/edit Opportunity | ALL | ALL | TEAM | OWN | Service fields only | — | Finance fields only | — | — |
| Change normal stage | ALL | ALL | TEAM | OWN allowed transitions | — | — | — | — | — |
| Override/reopen | BG | ALL | TEAM | — | — | — | — | — | — |
| Mark won/lost | BG/ALL | ALL | TEAM | OWN if gates pass | — | — | — | — | — |
| Archive/restore | ALL | ALL | TEAM eligible | OWN eligible archive | — | — | — | — | — |
| Export customer/selling fields | ALL | ALL | TEAM | OWN only if explicitly granted | SERVICE grant | — | FIN | — | — |
| View/edit estimated cost | ALL | ALL | TEAM | **—** | **—** | **—** | FIN | **—** | **—** |
| View GP/margin | ALL | ALL | TEAM | **—** | **—** | **—** | FIN | **—** | **—** |

### 5.3 Activity and Task

| Action | SA | D | SM | S | CS | O | F | V | Legacy Admin |
|---|---|---|---|---|---|---|---|---|---|
| View timeline | ALL | ALL | TEAM | OWN | SERVICE | OPS-linked | FIN-linked | GRANT R | Existing audit only |
| Log Activity | ALL | ALL | TEAM | OWN | SERVICE | OPS-linked | FIN-linked | — | — |
| Correct own manual Activity | ALL | ALL | TEAM policy window | OWN policy window | SERVICE policy window | OPS policy window | FIN policy window | — | — |
| Redact restricted content | ALL | Explicit grant | — | — | — | — | — | — | — |
| Create/complete Task | ALL | ALL | TEAM | OWN/assigned | SERVICE/assigned | OPS/assigned | FIN/assigned | — | — |
| Assign Task | ALL | ALL | TEAM | Self/collaborator if allowed | SERVICE queue | OPS queue | FIN queue | — | — |
| Reassign another user’s Task | ALL | ALL | TEAM | — | CS lead only | Ops lead only | Finance lead only | — | — |
| Archive/cancel | ALL | ALL | TEAM | OWN/assigned | SERVICE/assigned | OPS/assigned | FIN/assigned | — | — |
| Export timeline | Sensitive grant | ALL safe | TEAM safe | — | SERVICE safe grant | — | FIN audit grant | — | — |

Activities are append-oriented. A correction records before/after metadata or superseding event; it does not erase history. Private/internal activity fields are separately projected from customer-visible communication.

### 5.4 Quotation and supplier rates

| Action | SA | D | SM | S | CS | O | F | V | Legacy Admin |
|---|---|---|---|---|---|---|---|---|---|
| View customer-safe quotation | ALL | ALL | TEAM | OWN | SERVICE | Accepted OPS snapshot | FIN | GRANT R | Existing inquiry only |
| Create/edit draft selling fields | ALL | ALL | TEAM | OWN | — | — | Read/comment if configured | — | — |
| View supplier rate/cost | ALL | ALL | TEAM | **—** | **—** | **—** | FIN | **—** | **—** |
| Edit draft cost | ALL | ALL | TEAM | **—** | **—** | **—** | FIN if assigned | **—** | **—** |
| View GP/margin | ALL | ALL | TEAM | **—** | **—** | **—** | FIN | **—** | **—** |
| Submit for approval | ALL | ALL | TEAM | OWN | — | — | — | — | — |
| Approve/reject | BG | ALL policy | TEAM policy, no self-approval when separated | — | — | — | Credit/tax exception only | — | — |
| Create revision | ALL | ALL | TEAM | OWN | — | — | — | — | — |
| Generate customer PDF | ALL | ALL | TEAM | OWN approved | SERVICE approved | — | FIN copy | GRANT if explicitly permitted | — |
| Send/share | ALL | ALL | TEAM | OWN approved | SERVICE if assigned | — | — | — | — |
| Record acceptance/rejection | ALL | ALL | TEAM | OWN | SERVICE if assigned | — | — | — | — |
| Withdraw | BG/ALL | ALL | TEAM | OWN before acceptance if policy | — | — | — | — | — |
| Export quotation list | ALL | ALL | TEAM safe | Own safe grant | SERVICE safe grant | — | FIN | — | — |
| Export cost/rate book | Explicit grant | Explicit grant | **— by default** | **—** | **—** | **—** | Explicit grant | **—** | **—** |
| Manage supplier rate book | ALL | Rate-steward grant | Rate-steward TEAM | **—** | **—** | **—** | Rate-steward grant | **—** | **—** |

### 5.5 Handover, Shipment, Finance, and Complaint

| Action | SA | D | SM | S | CS | O | F | V | Legacy Admin |
|---|---|---|---|---|---|---|---|---|---|
| Create Shipment intake from won deal | ALL | ALL | TEAM | OWN | — | — | — | — | — |
| View handover | ALL | ALL | TEAM | OWN | SERVICE | OPS | FIN summary | GRANT R safe | Existing shipment only |
| Request handover clarification | BG | — | — | — | Collaborate | OPS | — | — | Existing operations only |
| Confirm Operations readiness | BG | — | — | — | — | OPS | — | — | Existing operations only |
| View active Shipment | Existing portal ALL | Existing/summary | TEAM-linked summary | OWN-linked summary | SERVICE | OPS | FIN-linked | GRANT | Existing capability |
| Edit shipment execution | Existing capability | — default | — | — | — | Existing `shipment:edit/status` | — | — | Existing capability |
| View Finance indicator | ALL | Approved | TEAM-linked | OWN-linked | SERVICE-linked | — | FIN | GRANT if explicit | Existing capability |
| View invoice/payment detail | ALL | Explicit Finance grant | — | — | — | — | FIN | Explicit grant | Existing capability |
| Mutate invoice/payment | Existing Finance capability | — | — | — | — | — | FIN under Finance rules | — | Existing capability |
| Create Complaint | ALL | ALL | TEAM | OWN-linked | SERVICE | OPS-linked | FIN-linked | — | — |
| Investigate Complaint | ALL | ALL | TEAM-linked | Collaborate | SERVICE | OPS-linked | FIN-linked | — | — |
| Resolve/close/reopen | BG/ALL | ALL | Manager-linked | — | SERVICE lead/policy | Resolve assigned action only | Resolve Finance action only | — | — |

This CRM matrix does not weaken existing shipment or Finance capability checks. When both systems apply, the more restrictive rule wins.

### 5.6 Search, dashboards, imports, bulk actions, and audit

| Action | SA | D | SM | S | CS | O | F | V | Legacy Admin |
|---|---|---|---|---|---|---|---|---|---|
| Global search | ALL fields permitted | ALL commercial | TEAM | OWN | SERVICE | OPS | FIN | GRANT | Existing portal entities only |
| Commercial dashboard | ALL | ALL | TEAM | OWN no cost/margin | SERVICE safe | OPS handover only | FIN/approved | GRANT safe | Existing dashboard only |
| Cost/margin dashboard | ALL | ALL | TEAM | **—** | **—** | **—** | FIN | **—** | **—** |
| Create saved personal view | ALL | ALL | TEAM scope | OWN scope | SERVICE | OPS | FIN | GRANT | — |
| Publish team view | ALL | ALL | TEAM | — | CS lead grant | Ops lead grant | Finance lead grant | — | — |
| Stage import/dry-run | ALL | ALL | TEAM trained | — | Trained Contact import | — | Trained billing master | — | — |
| Commit import | ALL | Approved ALL | Approved TEAM | — | — | — | Finance template only | — | — |
| Bulk assign/status/follow-up | ALL | ALL | TEAM | — default | SERVICE queue grant | OPS queue grant | FIN queue grant | — | — |
| View business audit | ALL | ALL | TEAM events | Own event summary | SERVICE event summary | OPS events | FIN events | — | Existing audit only |
| View sensitive-access audit | ALL | Explicit grant | — | — | — | — | Finance-cost access if granted | — | — |

## 6. Field-level permissions

Field projection is authoritative. “Masked” fields are returned only when the product has an explicit masked representation; otherwise denied fields are omitted.

| Field group | SA | D | SM | S | CS | O | F | V/customer/public |
|---|---|---|---|---|---|---|---|---|
| Company legal/trading identity | ALL | ALL | TEAM | OWN-linked | SERVICE | OPS-linked | FIN | Explicit safe subset |
| Tax number/NIB/registration | ALL | ALL | TEAM if granted | Masked/need-to-know | Compliance need-to-know | — | FIN | — |
| Contact email/phone/WhatsApp | ALL | ALL | TEAM | OWN-linked | SERVICE | OPS-linked | FIN billing contact | Only explicit Contact/self scope |
| Consent/contact preferences | ALL | ALL | TEAM | OWN-linked edit | SERVICE edit | Read if linked | Read billing | Contact/self safe subset |
| Credit/payment terms/risk | ALL | ALL | Read approved TEAM | Read approved OWN | Indicator only | — | FIN edit | — |
| Customer target rate | ALL | ALL | TEAM | OWN | SERVICE if customer-provided and needed | Accepted scope only | FIN | Customer’s own submitted value only |
| Selling price/approved terms | ALL | ALL | TEAM | OWN | SERVICE | Accepted OPS snapshot | FIN | Exact customer Version only |
| Supplier identity/source-rate evidence | ALL | ALL | TEAM | **—** | **—** | **—** | FIN | **—** |
| Supplier cost/buy rate | ALL | ALL | TEAM | **—** | **—** | **—** | FIN | **—** |
| Gross profit/margin | ALL | ALL | TEAM | **—** | **—** | **—** | FIN | **—** |
| Internal sales notes | ALL | ALL | TEAM | OWN | Restricted customer-safe subset only | — | Linked Finance note only | — |
| Approval triggers/comments | ALL | ALL | TEAM if approver | Decision result only where needed | — | — | Finance exception | — |
| Customer-visible communication | ALL | ALL | TEAM | OWN | SERVICE | OPS-linked | FIN-linked | Recipient/self only |
| Internal operational notes | Existing capability | Summary | Linked summary | — | SERVICE-relevant | OPS | Linked Finance summary | — |
| Invoice/payment detail | Existing Finance access | Explicit grant | Indicator | Indicator | Indicator | — | FIN | Customer’s own permitted invoices only |
| Password hash/session token/reset secret | **Never returned** | **Never returned** | **Never returned** | **Never returned** | **Never returned** | **Never returned** | **Never returned** | **Never returned** |
| Audit metadata/login details | ALL safe | Approved audit | TEAM event summary | Own action summary | Service summary | Ops summary | Finance summary | — |

### 6.1 Sensitive-access audit behavior

- Audit explicit **Show costing**, sensitive export, supplier-rate download, permission/role changes, merge, archive/restore, approval, and break-glass use.
- Do not create a noisy permanent business audit entry for every ordinary list/detail render. Use separate privacy/security telemetry where required.
- Sensitive-access logs identify user, record/query class, purpose/reason where required, time, and outcome; they do not copy supplier rate values into logs.
- Customer-safe PDF/API/email tests are fail-closed and treated as security controls.

## 7. Assignment and team rules

1. A Lead and Opportunity each have one primary owner and one owning team. Optional collaborators do not inherit reassignment rights.
2. Sales can accept assignment to themselves but cannot transfer records to another user.
3. Sales Manager can assign/reassign within managed teams. Moving across team boundaries requires Director or Super Admin.
4. Director can assign company-wide commercial records. Super Admin can perform technical recovery but should use business owner/manager workflows for ordinary assignment.
5. Customer Service, Operations, and Finance queues use functional ownership separate from the commercial owner.
6. An inactive user cannot receive new records. Deactivation requires a preview and transfer plan for owned records, Tasks, approvals, and notifications.
7. Reassignment requires reason and records old/new owner/team. In-app notifications go to both users and relevant manager without exposing unauthorized fields.
8. Manager scope is based on active team membership at request time. Historical reports use snapshot owner/team fields where needed so reorganization does not rewrite past performance.
9. Cross-team collaboration grants are explicit, time-bounded where practical, read/write-specific, and cannot add cost/margin access to a role that lacks the field permission.

## 8. Approval and separation-of-duties rules

- Sales cannot approve Quotations or discounts.
- Sales Manager may approve team Quotations within configured policy and cannot self-approve when the rule requires a separate approver.
- Director may approve company-wide commercial exceptions within policy.
- Finance may approve only configured credit, tax, payment-term, or Finance exceptions; Finance visibility of cost/margin does not grant normal quotation approval.
- Super Admin commercial approval is break-glass, requires reason, and must notify Director/audit owner.
- Approval is bound to exact Quotation Version checksum and policy version. Any material change requires a new Version and new approval evaluation.
- Thresholds, margin floors, discount authority, and override paths are `Decision Required` in CRM-DEC-018.

## 9. Export policy

1. Export is a separate permission from view. A role may view records and still be denied bulk export.
2. Export reuses row/field scopes and has maximum count/time-range limits.
3. Sales is denied bulk CRM export by default. A controlled own-record extract can be granted without cost/margin.
4. Sales Manager may export team customer/selling data but not the supplier rate book by default.
5. Supplier cost/rate-book export is limited to explicitly granted SA/D/F and requires a purpose/reason.
6. Personal/contact, Finance, cost/margin, and audit exports are separate capabilities.
7. Every export records requester, permission, filters, field set/category, count, generated file checksum/expiry, and outcome; it never logs raw sensitive values.
8. Downloads use authorized short-lived access and are not publicly addressable.

## 10. Legacy-role transition

| Current source role | Initial mapping | CRM migration behavior |
|---|---|---|
| `superadmin` | Super Admin | Retain existing capabilities; add CRM permissions only after role tests. |
| `admin` | Legacy Admin | Preserve existing portal capability set. Do **not** infer Director, Sales Manager, cost, margin, Finance, or CRM admin authority. Individually remap. |
| `operations` | Operations | Retain shipment/quote-request operational capabilities; add CRM won-handover scope only. |
| `finance` | Finance | Retain Finance capability; add scoped CRM/quotation cost visibility after tests. It does not gain quotation approval automatically. |
| `viewer` | Viewer | Retain read-only portal behavior; CRM requires explicit GRANT scope. |
| No current equivalent | Director, Sales Manager, Sales, Customer Service | Create as new code-defined roles, then assign deliberately. |

Migration sequence:

1. Add permission keys and roles without changing existing assignments.
2. Add team/membership/ownership data and default-deny CRM access.
3. Create a read-only staff mapping report for management approval.
4. Assign/test one role cohort at a time with authenticated read/write/negative tests.
5. Keep Legacy Admin until all accounts are remapped; remove it only after zero active assignments and an audited review.

## 11. Authorization acceptance tests

At minimum, automated tests and authenticated staging smoke tests must prove:

1. Sales sees/edits assigned Leads and Opportunities only and cannot infer another owner’s records through URL, search, counts, saved views, notifications, exports, or error messages.
2. Sales responses never include supplier cost, rate source, gross profit, margin, approval comments, or internal restricted notes—even for owned records.
3. Sales Manager sees managed-team records and confidential fields, but not another team; cannot export supplier rate book by default.
4. Director sees all commercial records and approval queue; Finance details still require the documented Finance permission.
5. Customer Service can manage customer communications/Complaints and see safe status without confidential pricing or restricted notes.
6. Operations sees only won handovers/linked operational context, cannot access pre-win pipeline or cost/margin, and cannot approve quotations.
7. Finance sees invoice/payment detail plus approved commercial cost/margin; cannot mutate commercial stage or approve normal quotation by virtue of visibility.
8. Viewer is read-only and limited to explicit GRANT scope.
9. Legacy Admin retains current portal behavior but gains no implicit CRM or cost/margin access.
10. Direct Server Action, Route Handler, download URL, forged form, and stale browser requests enforce the same rules as visible UI.
11. Search and dashboard aggregates exclude inaccessible rows and fields; zero-result behavior does not confirm hidden records.
12. Kanban transition, bulk update, import commit, archive/restore, merge, approval, export, and shipment conversion recheck authorization at commit.
13. Role/team deactivation and reassignment invalidate access without waiting for a client refresh.
14. Customer/public PDF/API/email/portal DTO tests assert sensitive fields are structurally absent.
15. Explicit cost reveal, sensitive export, approval, permission change, reassignment, merge, archive/restore, and break-glass actions create the required audit records without copying secrets/rates into logs.

## 12. Decisions still requiring approval

- **CRM-DEC-018 — `Decision Required`:** quotation approval thresholds, margin floors, discount/exception authority, and self-approval rules.
- **CRM-DEC-019 — `Decision Required`:** initial team topology, managers, cross-team collaboration, and branch visibility.
- **CRM-DEC-022 — `Decision Required`:** data-retention periods, purge/legal-hold rules, and sensitive-access audit duration.
- **CRM-DEC-029 — `Decision Required`:** which tax, NIB, compliance, risk, credit, and personal fields are mandatory and which roles may edit them at each lifecycle stage.

Cost/margin visibility itself is not unresolved: it is limited to Super Admin, Director, Sales Manager, and Finance as specified above.
