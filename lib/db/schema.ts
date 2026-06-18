import { sql } from 'drizzle-orm';
import { pgTable, text, serial, timestamp, uuid, integer, numeric, date, boolean, bigint, char, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const shipments = pgTable('shipments', {
  id: serial('id').primaryKey(),
  trackingNumber: text('tracking_number').notNull(),
  mawb: text('mawb'),
  title: text('title').notNull(),
  internalTrackingNo: text('internal_tracking_no'), // AA[YY][CC][8digits][SVC]
  customerReference: text('customer_reference'),
  customerId: integer('customer_id'),
  status: text('status').notNull().default('pending'),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  serviceType: text('service_type'), // PP, PD, DP, DD
  shipperName: text('shipper_name'),
  shipperAddress: text('shipper_address'),
  shipperPhone: text('shipper_phone'),
  consigneeName: text('consignee_name'),
  consigneeAddress: text('consignee_address'),
  consigneePhone: text('consignee_phone'),
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  goodsDescription: text('goods_description'),
  originIata: text('origin_iata'),
  destinationIata: text('destination_iata'),
  totalPcs: integer('total_pcs'),
  weightKg: numeric('weight_kg'),
  chargeableWeight: numeric('chargeable_weight'),
  isDamaged: boolean('is_damaged').default(false),
  deliveredAt: timestamp('delivered_at'),
  cargoType: text('cargo_type').default('general'),
  commodity: text('commodity'),
  idempotencyKey: text('idempotency_key'),
  unlinkedReason: text('unlinked_reason'),
  createdByStaff: integer('created_by_staff'),
  updatedByStaff: integer('updated_by_staff'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_shipments_mawb')
    .on(table.mawb)
    .where(sql`${table.mawb} is not null and btrim(${table.mawb}) <> ''`),
  uniqueIndex('shipments_internal_tracking_no_unique_idx')
    .on(table.internalTrackingNo)
    .where(sql`${table.internalTrackingNo} is not null and btrim(${table.internalTrackingNo}) <> ''`),
  uniqueIndex('shipments_idempotency_key_unique_idx')
    .on(table.idempotencyKey)
    .where(sql`${table.idempotencyKey} is not null and btrim(${table.idempotencyKey}) <> ''`),
]);

export const parcels = pgTable('parcels', {
  id: serial('id').primaryKey(),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  ambaraParcelId: text('ambara_parcel_id').notNull().unique(),
  parcelNumber: integer('parcel_number').notNull(),
  receiverName: text('receiver_name').notNull(),
  receiverPhone: text('receiver_phone').notNull(),
  receiverAddress: text('receiver_address').notNull(),
  destinationCity: text('destination_city').notNull(),
  postalCode: text('postal_code'),
  weight: numeric('weight').notNull(),
  pieces: integer('pieces').notNull().default(1),
  serviceType: text('service_type'),
  commodity: text('commodity'),
  deliveryInstruction: text('delivery_instruction'),
  codAmount: numeric('cod_amount'),
  currentStatus: text('current_status').notNull().default('DRAFT'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('parcels_shipment_id_idx').on(table.shipmentId),
  index('parcels_ambara_parcel_id_idx').on(table.ambaraParcelId),
  index('parcels_current_status_idx').on(table.currentStatus),
  index('parcels_receiver_phone_idx').on(table.receiverPhone),
]);

export const deliveryBatches = pgTable('delivery_batches', {
  id: serial('id').primaryKey(),
  batchCode: text('batch_code').notNull().unique(),
  vendorName: text('vendor_name').notNull(),
  vendorServiceType: text('vendor_service_type'),
  handoverDate: date('handover_date'),
  slaDeadline: timestamp('sla_deadline'),
  batchStatus: text('batch_status').notNull().default('DRAFT'),
  totalParcels: integer('total_parcels').notNull().default(0),
  notes: text('notes'),
  lastCheckedAt: timestamp('last_checked_at'),
  lastCheckedBy: integer('last_checked_by'),
  nextCheckDueAt: timestamp('next_check_due_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('delivery_batches_status_idx').on(table.batchStatus),
  index('delivery_batches_batch_code_idx').on(table.batchCode),
  index('delivery_batches_sla_deadline_idx').on(table.slaDeadline),
]);

export const parcelVendorTracking = pgTable('parcel_vendor_tracking', {
  id: serial('id').primaryKey(),
  parcelId: integer('parcel_id').notNull().references(() => parcels.id, { onDelete: 'cascade' }),
  deliveryBatchId: integer('delivery_batch_id').notNull().references(() => deliveryBatches.id, { onDelete: 'cascade' }),
  vendorName: text('vendor_name').notNull(),
  vendorTrackingNumber: text('vendor_tracking_number'),
  vendorTrackingUrl: text('vendor_tracking_url'),
  vendorReferenceNumber: text('vendor_reference_number'),
  exportRowId: text('export_row_id'),
  matchMethod: text('match_method'),
  matchConfidence: integer('match_confidence'),
  lastVendorStatus: text('last_vendor_status'),
  lastVendorEventTime: timestamp('last_vendor_event_time'),
  podUrl: text('pod_url'),
  receiverName: text('receiver_name'),
  matchedAt: timestamp('matched_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('parcel_vendor_tracking_parcel_idx').on(table.parcelId),
  index('parcel_vendor_tracking_batch_idx').on(table.deliveryBatchId),
  uniqueIndex('parcel_vendor_tracking_vendor_tracking_unique_idx')
    .on(table.vendorTrackingNumber)
    .where(sql`${table.vendorTrackingNumber} is not null and btrim(${table.vendorTrackingNumber}) <> ''`),
  uniqueIndex('parcel_vendor_tracking_export_row_unique_idx')
    .on(table.exportRowId)
    .where(sql`${table.exportRowId} is not null and btrim(${table.exportRowId}) <> ''`),
]);

export const trackingEvents = pgTable('tracking_events', {
  id: serial('id').primaryKey(),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  parcelId: integer('parcel_id').references(() => parcels.id, { onDelete: 'cascade' }),
  statusCode: text('status_code').notNull().default('pending'),
  status: text('status'),
  label: text('label').notNull(),
  publicDescription: text('public_description'),
  description: text('description'),
  internalNote: text('internal_note'),
  location: text('location'),
  eventTime: timestamp('event_time').defaultNow().notNull(),
  source: text('source').notNull().default('manual'),
  visibleToCustomer: boolean('visible_to_customer').notNull().default(true),
  createdBy: integer('created_by'),
  state: text('state').default('done'),
  correctedEventId: integer('corrected_event_id'),
  correctionReason: text('correction_reason'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('tracking_events_shipment_id_idx').on(table.shipmentId),
  index('tracking_events_parcel_id_idx').on(table.parcelId),
  index('tracking_events_event_time_idx').on(table.eventTime),
  index('tracking_events_visible_idx').on(table.visibleToCustomer),
]);

export const vendorStatusMapping = pgTable('vendor_status_mapping', {
  id: serial('id').primaryKey(),
  vendorName: text('vendor_name').notNull().default('*'),
  vendorRawStatus: text('vendor_raw_status').notNull(),
  ambaraStatusCode: text('ambara_status_code').notNull(),
  publicDescriptionTemplate: text('public_description_template'),
  isException: boolean('is_exception').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  uniqueIndex('vendor_status_mapping_unique_idx').on(table.vendorName, table.vendorRawStatus),
]);

export const bulkShipmentImportJobs = pgTable('bulk_shipment_import_jobs', {
  id: serial('id').primaryKey(),
  uploadedFilename: text('uploaded_filename'),
  totalRows: integer('total_rows').notNull().default(0),
  validRows: integer('valid_rows').notNull().default(0),
  errorRows: integer('error_rows').notNull().default(0),
  warningRows: integer('warning_rows').notNull().default(0),
  createdShipments: integer('created_shipments').notNull().default(0),
  createdParcels: integer('created_parcels').notNull().default(0),
  status: text('status').notNull().default('pending'),
  idempotencyKey: text('idempotency_key'),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => [
  uniqueIndex('bulk_shipment_import_jobs_idempotency_unique_idx')
    .on(table.idempotencyKey)
    .where(sql`${table.idempotencyKey} is not null and btrim(${table.idempotencyKey}) <> ''`),
]);

export const bulkShipmentImportItems = pgTable('bulk_shipment_import_items', {
  id: serial('id').primaryKey(),
  importJobId: integer('import_job_id').notNull().references(() => bulkShipmentImportJobs.id, { onDelete: 'cascade' }),
  rowNumber: integer('row_number').notNull(),
  shipmentId: integer('shipment_id').references(() => shipments.id, { onDelete: 'set null' }),
  parcelId: integer('parcel_id').references(() => parcels.id, { onDelete: 'set null' }),
  customerReference: text('customer_reference'),
  receiverName: text('receiver_name'),
  validationStatus: text('validation_status').notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('bulk_shipment_import_items_job_idx').on(table.importJobId),
]);

export const bulkUpdateJobs = pgTable('bulk_update_jobs', {
  id: serial('id').primaryKey(),
  deliveryBatchId: integer('delivery_batch_id').references(() => deliveryBatches.id, { onDelete: 'set null' }),
  updateType: text('update_type').notNull(),
  source: text('source').notNull(),
  uploadedFilename: text('uploaded_filename'),
  totalRows: integer('total_rows').notNull().default(0),
  matchedRows: integer('matched_rows').notNull().default(0),
  unmatchedRows: integer('unmatched_rows').notNull().default(0),
  duplicateRows: integer('duplicate_rows').notNull().default(0),
  status: text('status').notNull().default('pending'),
  idempotencyKey: text('idempotency_key'),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => [
  index('bulk_update_jobs_batch_idx').on(table.deliveryBatchId),
  uniqueIndex('bulk_update_jobs_idempotency_unique_idx')
    .on(table.idempotencyKey)
    .where(sql`${table.idempotencyKey} is not null and btrim(${table.idempotencyKey}) <> ''`),
]);

export const bulkUpdateItems = pgTable('bulk_update_items', {
  id: serial('id').primaryKey(),
  bulkUpdateJobId: integer('bulk_update_job_id').notNull().references(() => bulkUpdateJobs.id, { onDelete: 'cascade' }),
  parcelId: integer('parcel_id').references(() => parcels.id, { onDelete: 'set null' }),
  vendorTrackingNumber: text('vendor_tracking_number'),
  oldStatus: text('old_status'),
  newStatus: text('new_status'),
  vendorRawStatus: text('vendor_raw_status'),
  eventTime: timestamp('event_time'),
  receiverName: text('receiver_name'),
  podUrl: text('pod_url'),
  matchStatus: text('match_status').notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('bulk_update_items_job_idx').on(table.bulkUpdateJobId),
  index('bulk_update_items_parcel_idx').on(table.parcelId),
]);

export const staffAccounts = pgTable('staff_accounts', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // superadmin, operations, finance
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const awbs = pgTable('awbs', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: bigint('customer_id', { mode: 'number' }).notNull(),
  awbNumber: text('awb_number'),
  carrier: text('carrier'),
  origin: char('origin', { length: 3 }),
  destination: char('destination', { length: 3 }),
  flightNumber: text('flight_number'),
  shipmentDate: date('shipment_date'),
  pieces: integer('pieces'),
  chargeableWeight: numeric('chargeable_weight'),
  shipper: text('shipper'), // New field v15.0
  consignee: text('consignee'), // New field v15.0
  commodity: text('commodity'),
  rawPdfUrl: text('raw_pdf_url').notNull(), // Cloudflare R2 URL (Optional for manual entry)
  invoiced: boolean('invoiced').default(false).notNull(),
  invoiceId: uuid('invoice_id'),
  uploadedBy: text('uploaded_by').notNull(), // Optional for manual shipments
  editedBy: text('edited_by'),
  shipmentId: integer('shipment_id'), // Spec v3: Link to the tracking record
  shipperId: integer('shipper_id'), // Link to CRM
  consigneeId: integer('consignee_id'), // Link to CRM
  editedAt: timestamp('edited_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  customerId: text('customer_id'),
  type: text('type'), // b2b, shipper, consignee
  fullName: text('full_name'),
  companyName: text('company_name'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  provincePostal: text('province_postal'),
  country: text('country'),
  countryCode: text('country_code').default('ID'),
  npwp: text('npwp'),
  contactPerson: text('contact_person'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const portalAuditLogs = pgTable('portal_audit_logs', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  performedBy: integer('performed_by').notNull(),
  reason: text('reason'),
  metadataJson: text('metadata_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('portal_audit_logs_entity_idx').on(table.entityType, table.entityId),
  index('portal_audit_logs_user_idx').on(table.performedBy, table.createdAt),
]);

export const portalUxEvents = pgTable('portal_ux_events', {
  id: serial('id').primaryKey(),
  eventName: text('event_name').notNull(),
  category: text('category'),
  route: text('route'),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('portal_ux_events_name_idx').on(table.eventName, table.createdAt),
  index('portal_ux_events_user_idx').on(table.userId, table.createdAt),
]);

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: text('invoice_number').unique().notNull(),
  customerId: bigint('customer_id', { mode: 'number' }),
  subtotal: numeric('subtotal'),
  totalPengurangan: numeric('total_pengurangan'),
  netAmount: numeric('net_amount'),
  vatEnabled: boolean('vat_enabled'),
  vatAmount: numeric('vat_amount'),
  total: numeric('total'),
  depositAmount: numeric('deposit_amount'),
  amountDue: numeric('amount_due'),
  invoiceDate: date('invoice_date'),
  dueDate: date('due_date'),
  paymentTerms: text('payment_terms'),
  currency: text('currency').default('IDR'),
  city: text('city'),
  bankAccount: text('bank_account'),
  period: text('period'),
  archived: boolean('archived').default(false),
  showPeriod: boolean('show_period'),
  showPaymentTerms: boolean('show_payment_terms'),
  generatedBy: bigint('generated_by', { mode: 'number' }),
  generatedAt: timestamp('generated_at'),
  retainUntil: date('retain_until'),
});

export const trackingUpdates = pgTable('tracking_updates', {
  id: serial('id').primaryKey(),
  shipmentId: integer('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // pending, in_transit, delivered, exception
  description: text('description').notNull(),
  location: text('location'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
