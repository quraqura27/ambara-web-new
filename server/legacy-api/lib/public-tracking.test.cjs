const assert = require('node:assert/strict');
const test = require('node:test');

const { toPublicTrackingResponse } = require('./public-tracking');

const forbiddenKeys = [
  'customer_name',
  'customer_email',
  'title',
  'mawb',
  'shipper_name',
  'shipper_address',
  'shipper_phone',
  'consignee_name',
  'consignee_address',
  'consignee_phone',
  'internal_notes',
  'internal_note',
  'created_by',
  'vendor_raw_status',
  'bulk_update_job_id',
  'error_message',
  'documents',
  'voided_at',
  'voided_by',
  'void_reason',
  'void_note',
  'previous_status',
];

function collectKeys(value, keys = new Set()) {
  if (!value || typeof value !== 'object') {
    return keys;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
    return keys;
  }

  Object.entries(value).forEach(([key, child]) => {
    keys.add(key);
    collectKeys(child, keys);
  });

  return keys;
}

test('legacy public tracking response is shipment-field allowlisted', () => {
  const response = toPublicTrackingResponse(
    {
      tracking_number: '999-00000000',
      internal_tracking_no: 'AA26-TEST-0001',
      mawb: '999-00000000',
      title: 'Shipment 999-00000000',
      status: 'processed',
      origin: 'Jakarta',
      destination: 'Singapore',
      shipper_name: 'Private shipper',
      shipper_address: 'Private shipper address',
      shipper_phone: '+62 811-0000-0000',
      consignee_name: 'Private consignee',
      consignee_address: 'Private consignee address',
      consignee_phone: '+65 8000 0000',
      internal_notes: 'Private notes',
    },
    [
      {
        status: 'processed',
        label: 'Shipment processed at origin',
        location: 'Jakarta',
        event_time: '2026-06-05T02:00:00.000Z',
        updated_by: 'Bulk_Status_Updates row 2',
        internal_note: 'Private vendor account message',
        created_by: 99,
        vendor_raw_status: 'BAD_VENDOR_ERROR',
        bulk_update_job_id: 123,
        error_message: 'Raw vendor exception',
      },
    ],
  );

  assert.deepEqual(response.events.map((event) => event.label), [
    'Shipment processed at origin',
  ]);

  const keys = collectKeys(response);
  forbiddenKeys.forEach((key) => assert.equal(keys.has(key), false, key));
});

test('voided public tracking is generic and omits internal void data', () => {
  const response = toPublicTrackingResponse(
    {
      tracking_number: 'AA26-TEST-VOID',
      status: 'processed',
      title: 'Private customer shipment',
      voided_at: '2026-07-12T03:00:00.000Z',
      voided_by: 99,
      void_reason: 'wrong_shipment_data',
      void_note: 'Private internal note',
    },
    [{ label: 'Private operational event', internal_note: 'Private detail' }],
  );

  assert.equal(response.shipment.status, 'cancelled');
  assert.deepEqual(response.events.map((event) => event.label), ['Shipment cancelled']);
  const keys = collectKeys(response);
  forbiddenKeys.forEach((key) => assert.equal(keys.has(key), false, key));
});
