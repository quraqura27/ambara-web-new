import { sql } from 'drizzle-orm';
import { pgTable, text, serial, timestamp, uuid, integer, numeric, date, boolean, bigint, bigserial, char, index, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';

export const shipments = pgTable('shipments', {
  id: serial('id').primaryKey(),
  trackingNumber: text('tracking_number').notNull(),
  mawb: text('mawb'),
  awbAirlinePrefix: text('awb_airline_prefix'),
  awbAirlineName: text('awb_airline_name'),
  awbAirlineUnresolved: boolean('awb_airline_unresolved').notNull().default(false),
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
  operationalStage: text('operational_stage').notNull().default('intake'),
  hsCode: text('hs_code'),
  incoterm: text('incoterm'),
  clearanceMode: text('clearance_mode'),
  cargoRisks: jsonb('cargo_risks').$type<string[]>().notNull().default([]),
  documentReadiness: text('document_readiness').notNull().default('not_ready'),
  assignedTo: integer('assigned_to'),
  blocker: text('blocker'),
  nextAction: text('next_action'),
  actionDueAt: timestamp('action_due_at', { withTimezone: true }),
  slaDueAt: timestamp('sla_due_at', { withTimezone: true }),
  volumetricWeightKg: numeric('volumetric_weight_kg'),
  customsReviewRequired: boolean('customs_review_required').notNull().default(false),
  regulatedCargo: boolean('regulated_cargo').notNull().default(false),
  readinessUpdatedAt: timestamp('readiness_updated_at', { withTimezone: true }),
  readinessUpdatedBy: integer('readiness_updated_by'),
  idempotencyKey: text('idempotency_key'),
  unlinkedReason: text('unlinked_reason'),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidedBy: integer('voided_by'),
  voidReason: text('void_reason'),
  voidNote: text('void_note'),
  previousStatus: text('previous_status'),
  restoredAt: timestamp('restored_at', { withTimezone: true }),
  restoredBy: integer('restored_by'),
  restoreReason: text('restore_reason'),
  createdByStaff: integer('created_by_staff'),
  updatedByStaff: integer('updated_by_staff'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_shipments_mawb')
    .on(table.mawb)
    .where(sql`${table.mawb} is not null and btrim(${table.mawb}) <> ''`),
  index('shipments_awb_airline_prefix_idx')
    .on(table.awbAirlinePrefix)
    .where(sql`${table.awbAirlinePrefix} is not null and btrim(${table.awbAirlinePrefix}) <> ''`),
  uniqueIndex('shipments_internal_tracking_no_unique_idx')
    .on(table.internalTrackingNo)
    .where(sql`${table.internalTrackingNo} is not null and btrim(${table.internalTrackingNo}) <> ''`),
  uniqueIndex('shipments_idempotency_key_unique_idx')
    .on(table.idempotencyKey)
    .where(sql`${table.idempotencyKey} is not null and btrim(${table.idempotencyKey}) <> ''`),
  index('shipments_voided_at_idx')
    .on(table.voidedAt)
    .where(sql`${table.voidedAt} is not null`),
  index('shipments_operational_queue_idx').on(table.operationalStage, table.actionDueAt),
  index('shipments_document_readiness_idx').on(table.documentReadiness),
]);

export const shipmentPackages = pgTable('shipment_packages', {
  id: serial('id').primaryKey(),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  packageNumber: integer('package_number').notNull(),
  pieces: integer('pieces').notNull().default(1),
  lengthCm: numeric('length_cm').notNull(),
  widthCm: numeric('width_cm').notNull(),
  heightCm: numeric('height_cm').notNull(),
  grossWeightKg: numeric('gross_weight_kg'),
  volumetricWeightKg: numeric('volumetric_weight_kg').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('shipment_packages_shipment_number_unique_idx').on(table.shipmentId, table.packageNumber),
  index('shipment_packages_shipment_idx').on(table.shipmentId),
]);

export const shipmentOperationalTasks = pgTable('shipment_operational_tasks', {
  id: serial('id').primaryKey(),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  taskType: text('task_type').notNull().default('next_action'),
  title: text('title').notNull(),
  status: text('status').notNull().default('open'),
  ownerId: integer('owner_id'),
  blocker: text('blocker'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: integer('completed_by'),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('shipment_operational_tasks_queue_idx').on(table.status, table.dueAt),
  index('shipment_operational_tasks_shipment_idx').on(table.shipmentId),
  index('shipment_operational_tasks_owner_idx').on(table.ownerId, table.status),
]);

export const shipmentFlightLegs = pgTable('shipment_flight_legs', {
  id: serial('id').primaryKey(),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  sequence: integer('sequence').notNull(),
  airlineDesignator: text('airline_designator').notNull(),
  flightNumber: text('flight_number').notNull(),
  operationalSuffix: text('operational_suffix'),
  airlineName: text('airline_name').notNull(),
  airlineUnresolved: boolean('airline_unresolved').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('shipment_flight_legs_shipment_sequence_unique_idx')
    .on(table.shipmentId, table.sequence),
  index('shipment_flight_legs_shipment_idx').on(table.shipmentId),
  index('shipment_flight_legs_designator_idx').on(table.airlineDesignator),
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
  sessionVersion: integer('session_version').notNull().default(1),
  lastLogin: timestamp('last_login'),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const portalLoginAttempts = pgTable('portal_login_attempts', {
  throttleKey: text('throttle_key').primaryKey(),
  attemptCount: integer('attempt_count').notNull().default(0),
  windowStartedAt: timestamp('window_started_at', { withTimezone: true }).defaultNow().notNull(),
  blockedUntil: timestamp('blocked_until', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('portal_login_attempts_blocked_idx').on(table.blockedUntil)]);

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

export const mawbDocuments = pgTable('mawb_documents', {
  id: serial('id').primaryKey(),
  idempotencyKey: text('idempotency_key'),
  mawbNumber: text('mawb_number').notNull(),
  awbPrefix: text('awb_prefix').notNull(),
  awbSerial: text('awb_serial').notNull(),
  carrierCode: text('carrier_code').notNull(),
  carrierName: text('carrier_name').notNull(),
  actionMode: text('action_mode').notNull(),
  serviceType: text('service_type').notNull().default('PTP'),
  agentName: text('agent_name'),
  shipperName: text('shipper_name').notNull(),
  shipperAddress: text('shipper_address').notNull(),
  consigneeName: text('consignee_name').notNull(),
  consigneeAddress: text('consignee_address').notNull(),
  shipmentCustomerId: integer('shipment_customer_id'),
  shipmentCustomerName: text('shipment_customer_name'),
  shipmentContactPhone: text('shipment_contact_phone'),
  departureAirport: text('departure_airport').notNull(),
  originIata: char('origin_iata', { length: 3 }).notNull(),
  destinationAirport: text('destination_airport').notNull(),
  destinationIata: char('destination_iata', { length: 3 }).notNull(),
  routingTo1: text('routing_to_1'),
  routingBy1: text('routing_by_1'),
  routingTo2: text('routing_to_2'),
  routingBy2: text('routing_by_2'),
  flightNumber: text('flight_number'),
  flightDate: date('flight_date'),
  executedDate: date('executed_date'),
  executedPlace: text('executed_place'),
  currency: text('currency').notNull().default('IDR'),
  declaredValueForCarriage: text('declared_value_for_carriage'),
  declaredValueForCustoms: text('declared_value_for_customs'),
  insuranceAmount: text('insurance_amount'),
  pieces: integer('pieces').notNull(),
  grossWeight: numeric('gross_weight').notNull(),
  chargeableWeight: numeric('chargeable_weight').notNull(),
  rate: numeric('rate').notNull().default('0'),
  weightCharge: numeric('weight_charge').notNull().default('0'),
  otherChargesTotal: numeric('other_charges_total').notNull().default('0'),
  totalPrepaid: numeric('total_prepaid').notNull().default('0'),
  otherChargesJson: text('other_charges_json').notNull(),
  commodity: text('commodity'),
  goodsDescription: text('goods_description'),
  handlingInformation: text('handling_information'),
  natureQuantity: text('nature_quantity'),
  createdByStaff: integer('created_by_staff'),
  updatedByStaff: integer('updated_by_staff'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('mawb_documents_mawb_number_idx').on(table.mawbNumber),
  index('mawb_documents_created_at_idx').on(table.createdAt),
  uniqueIndex('mawb_documents_idempotency_key_unique_idx')
    .on(table.idempotencyKey)
    .where(sql`${table.idempotencyKey} is not null and btrim(${table.idempotencyKey}) <> ''`),
]);

export const mawbShipmentLinks = pgTable('mawb_shipment_links', {
  id: serial('id').primaryKey(),
  mawbDocumentId: integer('mawb_document_id').notNull().references(() => mawbDocuments.id, { onDelete: 'cascade' }),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  linkMode: text('link_mode').notNull(),
  copiedFieldsJson: text('copied_fields_json'),
  createdByStaff: integer('created_by_staff'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('mawb_shipment_links_document_idx').on(table.mawbDocumentId),
  index('mawb_shipment_links_shipment_idx').on(table.shipmentId),
  uniqueIndex('mawb_shipment_links_unique_idx').on(table.mawbDocumentId, table.shipmentId),
]);

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  customerId: text('customer_id'),
  invoiceCode: text('invoice_code'),
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
  sessionVersion: integer('session_version').notNull().default(1),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  archivedBy: integer('archived_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  uniqueIndex('customers_invoice_code_unique_idx')
    .on(table.invoiceCode)
    .where(sql`${table.invoiceCode} is not null and btrim(${table.invoiceCode}) <> ''`),
]);

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
  invoiceNumber: text('invoice_number'),
  customerId: bigint('customer_id', { mode: 'number' }),
  customerCode: text('customer_code'),
  customerNameSnapshot: text('customer_name_snapshot'),
  customerAddressSnapshot: text('customer_address_snapshot'),
  customerNpwpSnapshot: text('customer_npwp_snapshot'),
  subtotal: numeric('subtotal'),
  totalPengurangan: numeric('total_pengurangan'),
  netAmount: numeric('net_amount'),
  vatEnabled: boolean('vat_enabled'),
  vatRate: numeric('vat_rate'),
  vatAmount: numeric('vat_amount'),
  total: numeric('total'),
  pphEnabled: boolean('pph_enabled'),
  pphRate: numeric('pph_rate'),
  pphBaseAmount: numeric('pph_base_amount'),
  pphAmount: numeric('pph_amount'),
  depositAmount: numeric('deposit_amount'),
  amountDue: numeric('amount_due'),
  netPayable: numeric('net_payable'),
  invoiceDate: date('invoice_date'),
  dueDate: date('due_date'),
  paymentTerms: text('payment_terms'),
  currency: text('currency').default('IDR'),
  city: text('city'),
  bankAccount: text('bank_account'),
  formatVersion: integer('format_version').notNull().default(1),
  period: text('period'),
  status: text('status').notNull().default('draft'),
  verificationToken: text('verification_token'),
  verificationChecksum: text('verification_checksum'),
  withholdingProofRef: text('withholding_proof_ref'),
  sentAt: timestamp('sent_at'),
  paidAt: timestamp('paid_at'),
  paymentReference: text('payment_reference'),
  archived: boolean('archived').default(false),
  showPeriod: boolean('show_period'),
  showPaymentTerms: boolean('show_payment_terms'),
  generatedBy: bigint('generated_by', { mode: 'number' }),
  generatedAt: timestamp('generated_at'),
  retainUntil: date('retain_until'),
}, (table) => [
  index('invoices_customer_idx').on(table.customerId),
  index('invoices_status_idx').on(table.status),
  index('invoices_sent_at_idx').on(table.sentAt),
  index('invoices_paid_at_idx').on(table.paidAt),
  uniqueIndex('invoices_invoice_number_unique_idx')
    .on(table.invoiceNumber)
    .where(sql`${table.invoiceNumber} is not null and btrim(${table.invoiceNumber}) <> ''`),
  uniqueIndex('invoices_verification_token_unique_idx')
    .on(table.verificationToken)
    .where(sql`${table.verificationToken} is not null and btrim(${table.verificationToken}) <> ''`),
]);

export const invoiceSequences = pgTable('invoice_sequences', {
  year: integer('year').primaryKey(),
  lastValue: integer('last_value').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quoteRequests = pgTable('quote_requests', {
  id: serial('id').primaryKey(),
  referenceNumber: text('reference_number').notNull(),
  freightType: text('freight_type'),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  readyDate: date('ready_date'),
  incoterms: text('incoterms'),
  cargoDescription: text('cargo_description'),
  weightKg: numeric('weight_kg'),
  volumeCbm: numeric('volume_cbm'),
  numPackages: integer('num_packages'),
  cargoValueUsd: numeric('cargo_value_usd'),
  needsInsurance: text('needs_insurance'),
  specialRequirements: text('special_requirements'),
  contactName: text('contact_name').notNull(),
  companyName: text('company_name'),
  email: text('email').notNull(),
  phone: text('phone'),
  notes: text('notes'),
  status: text('status').notNull().default('new'),
  assignedTo: integer('assigned_to'),
  nextAction: text('next_action'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  internalNotes: text('internal_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('quote_requests_reference_unique_idx').on(table.referenceNumber),
  index('quote_requests_queue_idx').on(table.status, table.dueAt),
]);

export const shipmentDocuments = pgTable('documents', {
  id: serial('id').primaryKey(),
  shipmentId: integer('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  docType: text('doc_type').notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type').notNull().default('application/pdf'),
  checksumSha256: text('checksum_sha256'),
  version: integer('version').notNull().default(1),
  supersedesDocumentId: integer('supersedes_document_id'),
  status: text('status').notNull().default('current'),
  note: text('note'),
  uploadedBy: integer('uploaded_by'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  archivedBy: integer('archived_by'),
}, (table) => [
  uniqueIndex('documents_shipment_type_version_unique_idx').on(table.shipmentId, table.docType, table.version),
  index('documents_shipment_status_idx').on(table.shipmentId, table.status),
]);

export const invoiceLineItems = pgTable('invoice_line_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  awbId: uuid('awb_id').references(() => awbs.id),
  billingBasis: text('billing_basis'),
  shipmentId: integer('shipment_id').references(() => shipments.id),
  lineType: text('line_type').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  origin: text('origin'),
  destination: text('destination'),
  shipmentDate: date('shipment_date'),
  awbNumber: text('awb_number'),
  flightNumber: text('flight_number'),
  pieces: integer('pieces'),
  chargeableWeight: numeric('chargeable_weight'),
  description: text('description'),
  pricePerKg: numeric('price_per_kg'),
  reference: text('reference'),
  flatAmount: numeric('flat_amount'),
  lineTotal: numeric('line_total').notNull(),
}, (table) => [
  index('invoice_line_items_invoice_idx').on(table.invoiceId, table.sortOrder),
]);

export const invoiceDeductions = pgTable('invoice_deductions', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  description: text('description').notNull(),
  amount: numeric('amount').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
}, (table) => [
  index('invoice_deductions_invoice_idx').on(table.invoiceId, table.sortOrder),
]);

export const invoiceAuditLog = pgTable('invoice_audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  performedBy: bigint('performed_by', { mode: 'number' }).notNull(),
  performedAt: timestamp('performed_at').defaultNow().notNull(),
  metadata: jsonb('metadata'),
}, (table) => [
  index('invoice_audit_entity_idx').on(table.entityType, table.entityId),
  index('invoice_audit_user_idx').on(table.performedBy, table.performedAt),
]);

export const trackingUpdates = pgTable('tracking_updates', {
  id: serial('id').primaryKey(),
  shipmentId: integer('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // pending, in_transit, delivered, exception
  description: text('description').notNull(),
  location: text('location'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
