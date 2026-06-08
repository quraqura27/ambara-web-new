# CN Label Staff Workflow

This guide covers the staff steps for preparing shipment address fields, syncing generated shipments to the Ambara database, and printing Consignment Note labels from the portal.

Do not edit `internal_tracking_no` after it has been generated or shared. The Consignment Note number and database shipment identity are both `internal_tracking_no`. MAWB is stored separately and is not printed on the CN label.

## Sheet Fields To Complete

Use the `Shipments` sheet and fill these address and phone columns before printing operational labels:

- `shipper_address`
- `shipper_phone`
- `consignee_address`
- `consignee_phone`

Phone numbers should be entered as text where possible, so leading zeroes and plus signs are preserved by the Sheet.

The CN label can display these synced fields:

- `internal_tracking_no`
- `service_type`
- `origin`
- `origin_iata`
- `destination`
- `destination_iata`
- `shipper_name`
- `consignee_name`
- `goods_description`
- `commodity`
- `total_pcs`
- `chargeable_weight`
- `created_at`

The sync payload accepts additional operational fields such as `mawb`, `current_status`, `cargo_type`, and `weight_kg`, but the CN label intentionally does not print MAWB, current status, cargo type, gross weight, charges, internal notes, or sync fields.

## New Shipment Workflow

1. Paste or enter the shipment row in `Shipments`.
2. Fill all required shipment fields, including origin, destination, service, commodity, total pieces, and weights.
3. Fill `shipper_address`, `shipper_phone`, `consignee_address`, and `consignee_phone` before generation when the data is available.
4. Set `ready_to_generate` to `TRUE`.
5. If the edit trigger does not run automatically, open Apps Script and run `processReadyShipments()`.
6. Confirm the row has an `internal_tracking_no`.
7. Confirm `generation_status` is `CREATED` or `ALREADY_CREATED`.
8. Confirm database sync status:
   - `db_sync_status` = `SYNCED`
   - `db_synced_at` is filled
   - `db_sync_error` is blank
9. Open the portal shipment detail and print the CN only after the row is synced.

The automatic post-generation sync runs only when the three `db_sync_*` columns exist and the Apps Script properties are configured.

## Updating Missing Address Or Phone Fields

Use this when a shipment already has an `internal_tracking_no`, but CN labels are missing shipper or consignee address or phone data.

1. In `Shipments`, fill the missing fields:
   - `shipper_address`
   - `shipper_phone`
   - `consignee_address`
   - `consignee_phone`
2. If `db_sync_status` is `SYNCED`, change it to `PENDING` or clear the cell. Rows already marked `SYNCED` are skipped by the manual database sync.
3. Clear `db_sync_error`.
4. Clear `db_synced_at` if you want the new sync timestamp to be obvious.
5. Open Apps Script and run `syncGeneratedShipmentsToDatabase()`.
6. Confirm the row returns to:
   - `db_sync_status` = `SYNCED`
   - `db_synced_at` filled with the latest sync time
   - `db_sync_error` blank
7. Refresh the portal shipment detail or CN print page and confirm the address or phone appears.

The sync endpoint is idempotent. Re-syncing an existing shipment updates the database row with the same `internal_tracking_no`; it does not create a second shipment when the tracking number already exists.

## Single CN Print

1. Sign in to the Ambara portal with an allowed role: `admin`, `superadmin`, or `operations`.
2. Open the shipment detail page.
3. Click `Print CN`.
4. Confirm the tracking number is correct and prominent.
5. Confirm the label count equals `total_pcs`.
6. Confirm each piece sequence is correct, for example `1/5`, `2/5`, through `5/5`.
7. Confirm barcode and QR are visible.
8. Print with printer/page settings for `100 x 150 mm`, landscape, one label per page.

## Bulk CN Print

1. Sign in to the Ambara portal with an allowed role: `admin`, `superadmin`, or `operations`.
2. Open the shipment list.
3. Select shipment checkboxes.
4. Click `Bulk Print CN`.
5. Confirm the bulk print URL contains the selected tracking numbers.
6. Confirm the total label count equals the sum of `total_pcs` for all selected shipments.
7. Confirm missing shipment IDs, if any, are shown clearly before printing.
8. Print with printer/page settings for `100 x 150 mm`, landscape, one label per page.

## Troubleshooting

| Symptom | Staff check | Action |
| --- | --- | --- |
| `db_sync_status` = `ERROR` | Read `db_sync_error`. | Fix the missing field or endpoint issue, then run `syncGeneratedShipmentsToDatabase()` again. |
| Address or phone missing on CN | Check the four address/phone fields in `Shipments`. | Fill missing Sheet fields, reset `db_sync_status` from `SYNCED` to `PENDING` or blank, then re-sync. |
| CN route redirects to sign-in | User is not signed in or session expired. | Sign in again with `admin`, `superadmin`, or `operations`. |
| Shipment not found in portal | Database row may not be synced. | Confirm `internal_tracking_no` exists and `db_sync_status` is `SYNCED`; run manual sync if needed. |
| Barcode or QR not visible | Browser or printer preview may not have loaded images. | Refresh the CN page and confirm images appear before printing. |
| Wrong label quantity | `total_pcs` may be blank or incorrect. | Correct `total_pcs`, reset sync status if already `SYNCED`, run manual sync, then refresh the CN page. |
| Public tracking works but CN is missing private data | Public tracking intentionally hides address and phone fields. | Verify the database sync status and the CN page; do not expect private fields in public tracking. |

## Staff Checklist

- Shipment row has complete shipper and consignee address/phone fields.
- `internal_tracking_no` exists and was not edited manually.
- `generation_status` is `CREATED` or `ALREADY_CREATED`.
- `db_sync_status` is `SYNCED`.
- `db_synced_at` is filled.
- `db_sync_error` is blank.
- Portal CN page shows the expected address and phone data.
- Label count equals `total_pcs`.
- Printer is set to `100 x 150 mm`, landscape, one label per page.
