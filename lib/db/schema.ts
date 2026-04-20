import { pgTable, text, serial, timestamp, uuid, integer, numeric, date, boolean, bigint, char } from 'drizzle-orm/pg-core';

export const shipments = pgTable('shipments', {
  id: serial('id').primaryKey(),
  trackingNumber: text('tracking_number'), // Legacy tracking
  internalTrackingNo: text('internal_tracking_no'), // Spec v3: 16-char formula
  customerId: integer('customer_id'),
  status: text('status'), // Received, Departed, Arrived, Customs, Delivered
  origin: text('origin'),
  destination: text('destination'),
  serviceType: text('service_type'), // PP, PD, DP, DD
  createdBy: text('created_by'), // Spec v3: Clerk User ID (string)
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
  customerId: bigint('customer_id', { mode: 'number' }),
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
  rawPdfUrl: text('raw_pdf_url').notNull(), // Cloudflare R2 URL
  parseStatus: text('parse_status').notNull().default('pending'),
  parseRawText: text('parse_raw_text'),
  invoiced: boolean('invoiced').default(false).notNull(),
  invoiceId: uuid('invoice_id'),
  uploadedBy: text('uploaded_by').notNull(), // Changed to text for Clerk IDs
  editedBy: text('edited_by'), // Changed to text for Clerk IDs
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
  country: text('country'),
  countryCode: text('country_code').default('ID'), // 2-char code for shipment tracking formulas
  npwp: text('npwp'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: text('invoice_number').unique().notNull(),
  customerId: integer('customer_id').references(() => customers.id),
  shipmentId: integer('shipment_id').references(() => shipments.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('IDR'),
  status: text('status').default('PENDING'), // PENDING, PAID, OVERDUE, VOID
  dueDate: timestamp('due_date'),
  issuedAt: timestamp('issued_at').defaultNow(),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').default('CUSTOMER'), // MASTER_ADMIN, OPERATIONS, FINANCE, CUSTOMER
  status: text('status').default('PENDING'), // PENDING, ACTIVE, SUSPENDED
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
