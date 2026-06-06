# Ambara Shipment Operations Apps Script

This folder contains a source-controlled Google Apps Script implementation for generating permanent internal tracking numbers in the `Shipments` tab.

It is prepared for local review only. Do not deploy it or overwrite the currently deployed Apps Script until the current production script has been backed up.

## What This Fix Does

- Watches edits to `Shipments.ready_to_generate`.
- Generates a permanent tracking number only when the edited value is checked/TRUE and `internal_tracking_no` is blank.
- Uses header names instead of fixed column indexes.
- Uses `LockService` to avoid concurrent duplicate generation.
- Checks existing `internal_tracking_no` values before writing a new code.
- Generates `AA26-XXXX-XXXX` using uppercase alphanumeric random characters with no customer, route, or service data embedded.
- Writes `internal_tracking_no`, `tracking_created_at`, `generation_status`, `updated_at`, and `created_at` when blank.
- Validates the configured initial tracking milestone against `Lists` before generation.
- Adds one public initial event to `Tracking_Events` for each newly generated `internal_tracking_no`.
- Resets `ready_to_generate` to `FALSE` after success so already processed rows do not stay queued.
- Provides `processReadyShipments()` for rows that were already checked before the trigger existed.
- Provides `backfillMissingInitialTrackingEvents()` for targeted recovery when an already generated tracking number is missing its initial public event.
- Provides `syncGeneratedShipmentsToDatabase()` for source-controlled Sheet-to-database sync recovery after the web endpoint is reviewed and configured.
- Uses `handleShipmentReadyEdit(e)` as the intended production edit-trigger entrypoint.

Bulk milestone updates are processed through `Bulk_Status_Updates` as an append-only event workflow.

## Why A Ready Row Can Stay Blank

A row with `ready_to_generate` checked can stay blank if one of these is true:

- no edit trigger is installed in the bound Sheet script project,
- the deployed script has no handler for the current `ready_to_generate` header,
- the Sheet structure changed and an old script still uses fixed column indexes,
- an error is being swallowed before `generation_status` can be written.

This implementation writes visible `ERROR:` statuses for row-level validation failures, so future failures should not be silent.

## `sla_days` Decision

`sla_days` is not required for tracking-number generation in this phase. The new format `AA26-XXXX-XXXX` intentionally carries no service, route, customer, or SLA meaning. SLA can remain operational metadata and can be validated by a separate workflow later if needed.

## Required Shipment Fields

Before generation, the script requires:

- `mawb`
- `title`
- `current_status`
- `service_type`
- `origin`
- `origin_iata`
- `destination`
- `destination_iata`
- `customer_name`
- `commodity`
- `total_pcs`
- `weight_kg`
- `chargeable_weight`

`current_status` is validated against the canonical status list:

- `pending`
- `received`
- `processed`
- `in_transit`
- `arrived_destination`
- `customs_review`
- `out_for_delivery`
- `delivered`
- `exception`
- `cancelled`

## Database Sync Foundation

This source package can sync generated `Shipments` rows to the Ambara database through:

```text
POST /api/internal/sync-shipment
```

Do not configure this against Production until the database migration, endpoint URL, secret, and Sheet columns have been reviewed.

Required Apps Script Properties:

- `AMBARA_SYNC_ENDPOINT` - the reviewed sync endpoint URL.
- `AMBARA_SYNC_SECRET` - the shared secret expected by the web endpoint.

Required new `Shipments` columns:

- `db_sync_status`
- `db_synced_at`
- `db_sync_error`

Recommended placement: add the three columns after `internal_notes`, or at the far right of `Shipments` if that is safer for the live Sheet. The script uses header names, so exact position is not required.

Sync payload fields sent to the web endpoint are allowlisted. Private fields such as shipper, consignee, address, phone, and internal notes must never be exposed by public tracking responses.

CN-ready fields supported by the sync payload:

- `shipper_address`
- `shipper_phone`
- `consignee_address`

The automatic post-generation hook only writes sync status if the three `db_sync_*` columns exist. If those columns are absent, tracking-number generation continues without attempting database sync.

Manual recovery:

1. Confirm `AMBARA_SYNC_ENDPOINT` and `AMBARA_SYNC_SECRET` are set in Script Properties.
2. Confirm the three `db_sync_*` columns exist in `Shipments`.
3. Run `syncGeneratedShipmentsToDatabase()`.
4. Confirm successful rows show:
   - `db_sync_status` = `SYNCED`
   - `db_synced_at` populated
   - `db_sync_error` blank
5. Failed rows show `db_sync_status` = `ERROR` and a truncated diagnostic in `db_sync_error`. Fix the cause and rerun the manual recovery function.

Production rollout steps for sync:

1. Apply the reviewed database migration in the target environment.
2. Deploy the reviewed web app code with `SHEETS_SYNC_SECRET` configured only in the intended environment.
3. Add the three `db_sync_*` columns to the live Sheet.
4. Set the two Apps Script Properties.
5. Install or update the bound Apps Script from this source package.
6. Run a single reviewed test row before bulk recovery.
7. Run `syncGeneratedShipmentsToDatabase()` for recovery if needed.

## Initial Public Tracking Event

When a new `internal_tracking_no` is generated, the script appends one public event to `Tracking_Events` after validating this exact tuple in `Lists`:

- `tracking_status`: `pending`
- `tracking_label`: `Electronic information received`
- `tracking_description`: `Shipment information has been received and is awaiting physical handling.`

The event uses the generated `internal_tracking_no`, the same generation timestamp, the shipment `origin` as location, `visible_publicly = TRUE`, and `updated_by = ShipmentGenerator`.

The append path is idempotent. If the same initial event already exists for the tracking number, it is not appended again.

## Install After Review

1. Open the Google Sheet.
2. Go to `Extensions` -> `Apps Script`.
3. Back up the current Apps Script project first:
   - copy every existing script file into a local backup,
   - record current triggers from the Apps Script trigger page,
   - do not delete or overwrite the current Web App deployment.
4. Add `Code.gs` as a new file or merge its contents into the current bound project after checking for naming conflicts.
5. If using the Apps Script manifest editor, apply `appsscript.json`. It includes the current-spreadsheet scope plus `script.scriptapp`, which is required only for creating or repairing the installable trigger.
6. Save the project.
7. Create exactly one installable edit trigger manually, or run `installShipmentGeneratorTrigger()` once:
   - function: `handleShipmentReadyEdit`,
   - event source: `From spreadsheet`,
   - event type: `On edit`.
8. `installShipmentGeneratorTrigger()` preserves unrelated triggers, creates the generator trigger if missing, and removes duplicate generator triggers that use the same handler.
9. Do not add an `onEdit(e)` wrapper for this generator in production. A simple `onEdit(e)` automatic processor must not coexist with the installable trigger, because both can run for the same checkbox edit.
10. After deployment, manually run `processReadyShipments()` once if any rows were already checked before the trigger existed.
11. If a shipment was generated before initial-event creation existed, run `backfillMissingInitialTrackingEvents(["AA26-TEST-0001"])` with the appropriate tracking number. This does not alter the shipment row or permanent tracking number.

## Manual Recovery For Already Checked Rows

After the script is installed and reviewed:

1. Open Apps Script.
2. Select `processReadyShipments`.
3. Click Run.
4. Authorize the script if prompted.
5. Check the execution log summary.

This processes rows where `ready_to_generate` is TRUE. It is idempotent:

- rows with no `internal_tracking_no` are validated and generated,
- rows with an existing `internal_tracking_no` are not replaced,
- rows with `generation_status` already set to `CREATED` are left unchanged on rerun,
- failed rows keep `ready_to_generate` checked and receive an `ERROR:` status.

Run this once after deployment to recover already checked rows without requiring another checkbox toggle.

## Initial Event Backfill

`backfillMissingInitialTrackingEvents(targetTrackingNumbers)` exists for targeted recovery after a shipment was generated before initial-event creation existed. Pass an explicit list of tracking numbers, for example:

```javascript
backfillMissingInitialTrackingEvents(["AA26-TEST-0001"]);
```

The checked-in default target list is empty so this package does not carry a production one-time recovery target.

## Bulk Tracking Milestone Processing

Staff should add reviewed customer-visible milestones in `Bulk_Status_Updates`, then use the custom menu:

`Ambara Operations` -> `Process Bulk Tracking Updates`

The processor only reads rows where `process_update` is checked. It resolves the value in `internal_tracking_no` against both `Shipments.internal_tracking_no` and `Shipments.mawb`, validates the exact `new_status` / `label` / `description` tuple against `Lists`, appends one public `Tracking_Events` row, updates `Shipments.current_status`, and records `processing_status` plus `processed_at`.

The workflow is append-only. Ordinary processing does not overwrite or delete historical `Tracking_Events` rows.

Idempotency uses the source bulk row as a stable key. Events created from row `N` are written with `updated_by = Bulk_Status_Updates row N`, and successful rows are marked `PROCESSED: Bulk_Status_Updates!RN` with `process_update` reset to `FALSE`. Rerunning a processed row does not append a duplicate event. To record a repeated label at a legitimate later checkpoint, staff should create a new bulk-update row with the later event time and location.

Invalid rows receive `ERROR:` in `processing_status`. Invalid rows do not update `Shipments.current_status` and do not append to `Tracking_Events`.

## New Shipment Starting Status

Preferred operating rule: new shipments should normally be created with `current_status = pending`. Staff should then add customer-visible progress through `Bulk_Status_Updates`.

If a shipment is entered late at a later known status, do not fabricate unknown milestones. Add only verified historical events through reviewed bulk-update rows, in chronological order, then process them through the same menu action.

## Merge Checklist For Existing Live Apps Script

When the current live Apps Script source is available:

1. Preserve any existing `doGet(e)` or public tracking Web App endpoint.
2. Preserve existing deployment URLs unless a deliberate new deployment version is reviewed and approved.
3. Add the generator without changing public tracking read behavior.
4. Check for naming conflicts before adding this code:
   - `SHIPMENT_GENERATOR_CONFIG`
   - `handleShipmentReadyEdit`
   - `processReadyShipments`
   - helper names ending in `_`
5. Check trigger conflicts:
   - do not keep a generator `onEdit(e)` simple trigger,
   - install only one edit trigger for `handleShipmentReadyEdit`,
   - confirm no existing trigger already processes `ready_to_generate`.
6. Check shared constants such as sheet names, header row numbers, and timezone assumptions.
7. Prefer adding this generator as a separate `.gs` file inside the existing bound Apps Script project if there are no function-name conflicts.
8. If conflicts exist, rename this generator's helpers before deployment rather than modifying the public tracking endpoint.
9. The existing public tracking project may already contain an older `appendInitialTrackingEvent_` helper. Keep this generator's `appendInitialTrackingEventForShipment_` path separate unless the older helper is reviewed and updated to validate `Lists` tuples.
10. Keep `TrackingMilestones.gs` as a separate file unless function-name conflicts are found in the live project.

## Verify Example MAWB `999-00000000`

1. Find the row where `mawb` is `999-00000000`.
2. Confirm `ready_to_generate` is TRUE and `internal_tracking_no` is blank.
3. Run `processReadyShipments()`.
4. Confirm exactly one `internal_tracking_no` was written and matches `AA26-XXXX-XXXX`.
5. Confirm:
   - `generation_status` is `CREATED`,
   - `tracking_created_at` is populated,
   - `created_at` is populated if it was blank,
   - `updated_at` is populated,
   - `ready_to_generate` is FALSE.
6. Run `processReadyShipments()` again.
7. Confirm the tracking number did not change and no second number was created.
8. If you check `ready_to_generate` again on that same row, confirm the tracking number and `CREATED` status stay unchanged.

## Rollback

Before installing, keep a backup of the current bound Apps Script files and trigger list.

To roll back the script:

1. Remove the edit trigger that points to `handleShipmentReadyEdit`, if one was created.
2. Restore the backed-up Apps Script files.
3. Save the project.
4. Do not clear a generated `internal_tracking_no` after it has been shared publicly or operationally.
5. If rollback is needed before the generated code is used anywhere, manually clear only the cells written by this script on the affected row:
   - `internal_tracking_no`
   - `tracking_created_at`
   - `generation_status`
   - `created_at`, only if it was blank before generation
   - `updated_at`, only if you recorded the previous value

## Local Tests

Run the helper tests from the repository root:

```bash
node --test google-apps-script/shipment-operations/test/core.test.cjs
```

These tests do not call Google APIs and do not modify the live Sheet.
