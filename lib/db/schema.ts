import { pgTable, text, serial, timestamp, uuid, integer, numeric, date, boolean, bigint, char } from 'drizzle-orm/pg-core';

export const shipments = pgTable('shipments', {
  id: serial('id').primaryKey(),
  trackingNumber: text('tracking_number').notNull(), // Legacy tracking / MAWB
  title: text('title').notNull(),
  internalTrackingNo: text('internal_tracking_no'), // AA[YY][CC][8digits][SVC]
  customerId: integer('customer_id'),
  status: text('status').notNull().default('pending'),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  serviceType: text('service_type'), // PP, PD, DP, DD
  shipperName: text('shipper_name'),
  shipperAddress: text('shipper_address'),
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
  createdByStaff: integer('created_by_staff'),
  updatedByStaff: integer('updated_by_staff'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

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
