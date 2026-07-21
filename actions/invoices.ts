"use server";

import { randomUUID } from "crypto";

import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import {
  awbs,
  customers,
  invoiceAuditLog,
  invoiceDeductions,
  invoiceLineItems,
  invoices,
  mawbDocuments,
  mawbShipmentLinks,
  shipmentFlightLegs,
  shipments,
} from "@/lib/db/schema";
import {
  calculateInvoiceTotals,
  formatInvoiceNumber,
  invoiceEffectiveStatus,
  invoiceLineBillingBasis,
  normalizeCustomerCode,
  normalizeInvoiceStatus,
  numberValue,
  parseInvoiceSourceKey,
  resolveInvoicePaymentTerms,
  resolveInvoiceReference,
  type InvoiceBillingBasis,
  type InvoiceCurrency,
  uniqueInvoiceSources,
  invoiceCurrencies,
} from "@/lib/invoices/core";
import { formatInvoiceFlightNumber } from "@/lib/invoices/flight";
import {
  buildInvoiceCollectionsDashboard,
  type InvoiceCollectionFilters,
  type InvoiceCollectionSourceRow,
} from "@/lib/invoices/collections";
import {
  createInvoiceVerificationChecksum,
  createInvoiceVerificationToken,
} from "@/lib/invoices/verification";
import { normalizeInvoiceBankAccountCode } from "@/lib/invoices/bank-accounts";
import { isLocalPortalDevAccessEnabled, requirePortalUser } from "@/lib/portal-auth";
import { canManageInvoices } from "@/lib/portal-roles";

export type InvoiceCustomerOption = {
  code: string;
  companyName: string | null;
  fullName: string | null;
  id: number;
  invoiceableCount: number;
  npwp: string | null;
};

export type InvoiceableSource = {
  awbNumber: string | null;
  carrier: string | null;
  chargeableWeight: string | null;
  destination: string | null;
  flightNumber: string | null;
  id: string;
  origin: string | null;
  pieces: number | null;
  reference: string;
  shipmentDate: string | null;
  sourceId: string;
  sourceType: "awb" | "shipment";
};

export type InvoiceActionState = {
  formError?: string;
};

type SubmittedChargeLine = {
  billingBasis: InvoiceBillingBasis;
  description: string;
  manualChargeableWeight?: number | string | null;
  reference?: string | null;
  sourceKey?: string | null;
  unitRate: number | string;
};

type SubmittedDeduction = {
  amount: number | string;
  description: string;
};

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function booleanField(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function dateText(value: FormDataEntryValue | null) {
  const normalized = text(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function parseJsonArray<T>(value: FormDataEntryValue | null, label: string): T[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) throw new Error("not array");
    return parsed as T[];
  } catch {
    throw new Error(`${label} data is invalid.`);
  }
}

function isMissingColumnOrTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { cause?: { code?: string }; code?: string };
  return candidate.code === "42703" || candidate.code === "42P01" || candidate.cause?.code === "42703" || candidate.cause?.code === "42P01";
}

function hasFetchFailedCause(error: unknown, depth = 0): boolean {
  if (!error || depth > 4) return false;
  if (error instanceof Error && error.message.toLowerCase().includes("fetch failed")) return true;
  if (typeof error !== "object") return false;
  const candidate = error as { cause?: unknown; sourceError?: unknown };
  return hasFetchFailedCause(candidate.cause, depth + 1) || hasFetchFailedCause(candidate.sourceError, depth + 1);
}

function isLocalRecoverableReadError(error: unknown) {
  if (!isLocalPortalDevAccessEnabled()) return false;
  if (isMissingColumnOrTable(error)) return true;
  if (error instanceof Error && error.message.includes("NETLIFY_DATABASE_URL")) return true;
  return hasFetchFailedCause(error);
}

function customerName(customer: {
  companyName: string | null;
  fullName: string | null;
  id: number;
}) {
  return customer.companyName || customer.fullName || `Customer #${customer.id}`;
}

function customerAddress(customer: {
  address: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  provincePostal: string | null;
}) {
  return [customer.addressLine1 || customer.address, customer.addressLine2, customer.provincePostal]
    .filter(Boolean)
    .join("\n");
}

function sourceKey(sourceType: "awb" | "shipment", id: number | string) {
  return `${sourceType}:${id}`;
}

function dateOnly(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const normalized = value.trim();
  return /^\d{4}-\d{2}-\d{2}/.test(normalized) ? normalized.slice(0, 10) : null;
}

async function getShipmentFlightNumberMap(shipmentIds: number[]) {
  const flightNumberByShipmentId = new Map<number, string | null>();
  if (shipmentIds.length === 0) return flightNumberByShipmentId;

  const [flightLegRows, mawbFlightRows] = await Promise.all([
    db
      .select({
        airlineDesignator: shipmentFlightLegs.airlineDesignator,
        flightNumber: shipmentFlightLegs.flightNumber,
        operationalSuffix: shipmentFlightLegs.operationalSuffix,
        shipmentId: shipmentFlightLegs.shipmentId,
      })
      .from(shipmentFlightLegs)
      .where(inArray(shipmentFlightLegs.shipmentId, shipmentIds))
      .orderBy(asc(shipmentFlightLegs.shipmentId), asc(shipmentFlightLegs.sequence)),
    db
      .select({
        flightNumber: mawbDocuments.flightNumber,
        shipmentId: mawbShipmentLinks.shipmentId,
      })
      .from(mawbShipmentLinks)
      .innerJoin(mawbDocuments, eq(mawbShipmentLinks.mawbDocumentId, mawbDocuments.id))
      .where(inArray(mawbShipmentLinks.shipmentId, shipmentIds))
      .orderBy(asc(mawbShipmentLinks.shipmentId), desc(mawbShipmentLinks.createdAt)),
  ]);

  const legsByShipmentId = new Map<number, typeof flightLegRows>();
  for (const row of flightLegRows) {
    const rows = legsByShipmentId.get(row.shipmentId) ?? [];
    rows.push(row);
    legsByShipmentId.set(row.shipmentId, rows);
  }

  const mawbFallbackByShipmentId = new Map<number, string | null>();
  for (const row of mawbFlightRows) {
    if (!mawbFallbackByShipmentId.has(row.shipmentId)) {
      mawbFallbackByShipmentId.set(row.shipmentId, row.flightNumber);
    }
  }

  for (const shipmentId of shipmentIds) {
    flightNumberByShipmentId.set(
      shipmentId,
      formatInvoiceFlightNumber(
        legsByShipmentId.get(shipmentId) ?? [],
        mawbFallbackByShipmentId.get(shipmentId),
      ),
    );
  }

  return flightNumberByShipmentId;
}

function uninvoicedShipmentWhere() {
  return sql`
    ${shipments.voidedAt} is null
    and not exists (
      select 1
      from invoice_line_items ili
      join invoices inv on inv.id = ili.invoice_id
      where ili.shipment_id = ${shipments.id}
        and coalesce(inv.status, 'sent') <> 'voided'
    )
    and not exists (
      select 1
      from awbs linked_awbs
      where linked_awbs.shipment_id = ${shipments.id}
    )
  `;
}

async function requireInvoiceUser() {
  const user = await requirePortalUser();
  if (!canManageInvoices(user)) {
    redirect("/dashboard");
  }
  return user;
}

export async function getInvoiceCustomerOptions(search = ""): Promise<InvoiceCustomerOption[]> {
  await requireInvoiceUser();
  const query = search.trim();
  const filters = [];
  if (query) {
    filters.push(
      or(
        ilike(customers.fullName, `%${query}%`),
        ilike(customers.companyName, `%${query}%`),
        ilike(customers.email, `%${query}%`),
        ilike(customers.invoiceCode, `%${query}%`),
        ilike(customers.phone, `%${query}%`),
      )!,
    );
  }
  const where = filters.length ? and(...filters) : undefined;

  let rows: Array<{
    companyName: string | null;
    fullName: string | null;
    id: number;
    invoiceCode: string | null;
    npwp: string | null;
  }>;
  let invoiceableCounts = new Map<number, number>();
  try {
    rows = await db
      .select({
          companyName: customers.companyName,
          fullName: customers.fullName,
          id: customers.id,
          invoiceCode: customers.invoiceCode,
          npwp: customers.npwp,
        })
      .from(customers)
      .where(where)
      .orderBy(customers.companyName, customers.fullName)
      .limit(75);

    const customerIds = rows.map((customer) => customer.id);
    if (customerIds.length > 0) {
      const [awbCounts, shipmentCounts] = await Promise.all([
        db
          .select({
            count: sql<number>`count(*)::int`,
            customerId: awbs.customerId,
          })
          .from(awbs)
          .where(and(inArray(awbs.customerId, customerIds), eq(awbs.invoiced, false)))
          .groupBy(awbs.customerId),
        db
          .select({
            count: sql<number>`count(*)::int`,
            customerId: shipments.customerId,
          })
          .from(shipments)
          .where(and(inArray(shipments.customerId, customerIds), uninvoicedShipmentWhere()))
          .groupBy(shipments.customerId),
      ]);

      invoiceableCounts = new Map(
        customerIds.map((customerId) => [
          customerId,
          (awbCounts.find((row) => row.customerId === customerId)?.count ?? 0) +
            (shipmentCounts.find((row) => row.customerId === customerId)?.count ?? 0),
        ]),
      );
    }
  } catch (error) {
    if (!isLocalRecoverableReadError(error)) throw error;
    rows = [];
  }

  return rows.map((customer) => ({
    ...customer,
    code: normalizeCustomerCode(customer.invoiceCode ?? ""),
    invoiceableCount: invoiceableCounts.get(customer.id) ?? 0,
  }));
}

export async function getInvoiceableSources(customerId: number): Promise<InvoiceableSource[]> {
  await requireInvoiceUser();
  if (!Number.isInteger(customerId) || customerId <= 0) return [];

  let rows: Array<{
    awbNumber: string | null;
    carrier: string | null;
    chargeableWeight: string | null;
    destination: string | null;
    flightNumber: string | null;
    id: string;
    origin: string | null;
    pieces: number | null;
    shipmentDate: string | null;
  }>;
  let shipmentRows: Array<{
    awbAirlineName: string | null;
    chargeableWeight: string | null;
    createdAt: Date | null;
    customerReference: string | null;
    destination: string | null;
    id: number;
    internalTrackingNo: string | null;
    mawb: string | null;
    origin: string | null;
    totalPcs: number | null;
    trackingNumber: string | null;
  }>;
  try {
    [rows, shipmentRows] = await Promise.all([
      db
        .select({
          awbNumber: awbs.awbNumber,
          carrier: awbs.carrier,
          chargeableWeight: awbs.chargeableWeight,
          destination: awbs.destination,
          flightNumber: awbs.flightNumber,
          id: awbs.id,
          origin: awbs.origin,
          pieces: awbs.pieces,
          shipmentDate: awbs.shipmentDate,
        })
        .from(awbs)
        .where(and(eq(awbs.customerId, customerId), eq(awbs.invoiced, false)))
        .orderBy(desc(awbs.shipmentDate), desc(awbs.createdAt))
        .limit(100),
      db
        .select({
          awbAirlineName: shipments.awbAirlineName,
          chargeableWeight: shipments.chargeableWeight,
          createdAt: shipments.createdAt,
          customerReference: shipments.customerReference,
          destination: shipments.destination,
          id: shipments.id,
          internalTrackingNo: shipments.internalTrackingNo,
          mawb: shipments.mawb,
          origin: shipments.origin,
          totalPcs: shipments.totalPcs,
          trackingNumber: shipments.trackingNumber,
        })
        .from(shipments)
        .where(and(eq(shipments.customerId, customerId), uninvoicedShipmentWhere()))
        .orderBy(desc(shipments.createdAt), desc(shipments.updatedAt))
        .limit(100),
    ]);
  } catch (error) {
    if (!isLocalRecoverableReadError(error)) throw error;
    rows = [];
    shipmentRows = [];
  }

  let shipmentFlightNumbers = new Map<number, string | null>();
  try {
    shipmentFlightNumbers = await getShipmentFlightNumberMap(shipmentRows.map((row) => row.id));
  } catch (error) {
    if (!isLocalRecoverableReadError(error)) throw error;
  }

  return [
    ...rows.map((row) => ({
      ...row,
      chargeableWeight: row.chargeableWeight === null ? null : String(row.chargeableWeight),
      id: sourceKey("awb", row.id),
      reference: row.awbNumber || row.id,
      shipmentDate: row.shipmentDate,
      sourceId: row.id,
      sourceType: "awb" as const,
    })),
    ...shipmentRows.map((row) => ({
      awbNumber: row.mawb,
      carrier: row.awbAirlineName,
      chargeableWeight: row.chargeableWeight === null ? null : String(row.chargeableWeight),
      destination: row.destination,
      flightNumber: shipmentFlightNumbers.get(row.id) ?? null,
      id: sourceKey("shipment", row.id),
      origin: row.origin,
      pieces: row.totalPcs,
      reference: resolveInvoiceReference({
        awbNumber: row.mawb,
        customerReference: row.customerReference,
        internalTrackingNumber: row.internalTrackingNo,
        trackingNumber: row.trackingNumber,
      }),
      shipmentDate: dateOnly(row.createdAt),
      sourceId: String(row.id),
      sourceType: "shipment" as const,
    })),
  ];
}

export async function getInvoicesPage(options: { page?: number; search?: string } = {}) {
  await requireInvoiceUser();
  const pageSize = 25;
  const page = Math.max(1, options.page ?? 1);
  const search = options.search?.trim();
  const filters = [];
  if (search) {
    filters.push(
      or(
        ilike(invoices.invoiceNumber, `%${search}%`),
        ilike(invoices.customerNameSnapshot, `%${search}%`),
        ilike(customers.companyName, `%${search}%`),
        ilike(customers.fullName, `%${search}%`),
      )!,
    );
  }

  const where = filters.length ? and(...filters) : undefined;
  let rows: Array<{
    amountDue: string | null;
    currency: string | null;
    customerName: string | null;
    dueDate: string | null;
    generatedAt: Date | null;
    id: string;
    invoiceDate: string | null;
    invoiceNumber: string | null;
    netPayable: string | null;
    paidAt: Date | null;
    status: string | null;
  }>;
  let countRows: Array<{ count: number }>;

  try {
    [rows, countRows] = await Promise.all([
      db
        .select({
          amountDue: invoices.amountDue,
          currency: invoices.currency,
          customerName: invoices.customerNameSnapshot,
          dueDate: invoices.dueDate,
          generatedAt: invoices.generatedAt,
          id: invoices.id,
          invoiceDate: invoices.invoiceDate,
          invoiceNumber: invoices.invoiceNumber,
          netPayable: invoices.netPayable,
          paidAt: invoices.paidAt,
          status: invoices.status,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(where)
        .orderBy(desc(invoices.generatedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(where),
    ]);
  } catch (error) {
    if (!isLocalRecoverableReadError(error)) throw error;
    rows = [];
    countRows = [{ count: 0 }];
  }

  const total = countRows[0]?.count ?? 0;
  return {
    page,
    pageSize,
    rows: rows.map((row) => ({
      ...row,
      effectiveStatus: invoiceEffectiveStatus(row),
    })),
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getInvoiceCollectionsDashboard(filters: InvoiceCollectionFilters) {
  await requireInvoiceUser();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const conditions = [
    sql`(
      (coalesce(${invoices.status}, 'sent') = 'sent' and ${invoices.paidAt} is null)
      or (${invoices.paidAt} >= ${monthStart} and ${invoices.paidAt} < ${nextMonthStart})
    )`,
  ];

  if (filters.currency !== "all") {
    conditions.push(eq(invoices.currency, filters.currency));
  }

  if (filters.customer) {
    conditions.push(
      or(
        ilike(invoices.invoiceNumber, `%${filters.customer}%`),
        ilike(invoices.customerCode, `%${filters.customer}%`),
        ilike(invoices.customerNameSnapshot, `%${filters.customer}%`),
      )!,
    );
  }

  let rows: InvoiceCollectionSourceRow[];
  try {
    rows = await db
      .select({
        currency: invoices.currency,
        customerCode: invoices.customerCode,
        customerName: invoices.customerNameSnapshot,
        dueDate: invoices.dueDate,
        id: invoices.id,
        invoiceDate: invoices.invoiceDate,
        invoiceNumber: invoices.invoiceNumber,
        netPayable: invoices.netPayable,
        paidAt: invoices.paidAt,
        paymentTerms: invoices.paymentTerms,
        sentAt: invoices.sentAt,
        status: invoices.status,
      })
      .from(invoices)
      .where(and(...conditions))
      .orderBy(
        sql`case when ${invoices.dueDate} is null then 1 else 0 end`,
        asc(invoices.dueDate),
        desc(invoices.generatedAt),
      )
      .limit(5_000);
  } catch (error) {
    if (!isLocalRecoverableReadError(error)) throw error;
    rows = [];
  }

  return buildInvoiceCollectionsDashboard(rows, filters, now);
}

export async function getInvoiceDetail(id: string) {
  const user = await requirePortalUser();
  if (!canManageInvoices(user)) return null;

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) return null;

  const [lines, deductions] = await Promise.all([
    db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, id))
      .orderBy(invoiceLineItems.sortOrder),
    db
      .select()
      .from(invoiceDeductions)
      .where(eq(invoiceDeductions.invoiceId, id))
      .orderBy(invoiceDeductions.sortOrder),
  ]);

  return { deductions, invoice, lines };
}

export async function getPublicInvoiceVerification(token: string) {
  let invoice;
  try {
    [invoice] = await db
      .select({
        checksum: invoices.verificationChecksum,
        currency: invoices.currency,
        customerName: invoices.customerNameSnapshot,
        invoiceDate: invoices.invoiceDate,
        invoiceNumber: invoices.invoiceNumber,
        netPayable: invoices.netPayable,
        paidAt: invoices.paidAt,
        status: invoices.status,
        total: invoices.total,
      })
      .from(invoices)
      .where(and(eq(invoices.verificationToken, token), sql`${invoices.status} <> 'draft'`))
      .limit(1);
  } catch (error) {
    if (!isLocalRecoverableReadError(error)) throw error;
    return null;
  }

  return invoice ? { ...invoice, effectiveStatus: invoiceEffectiveStatus(invoice) } : null;
}

async function allocateInvoiceSequence(year: number) {
  const result = await db.execute<{ last_value: number }>(sql`
    insert into invoice_sequences (year, last_value, updated_at)
    values (${year}, 1, now())
    on conflict (year)
    do update set
      last_value = invoice_sequences.last_value + 1,
      updated_at = now()
    returning last_value
  `);
  const value = result.rows[0]?.last_value;
  if (!value) throw new Error("Unable to allocate invoice number.");
  return Number(value);
}

export async function finalizeInvoiceFromForm(
  _previousState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const user = await requireInvoiceUser();
  let invoiceId = "";
  const intent = text(formData.get("invoiceIntent"));
  const isDraft = true;
  if (intent !== "draft") {
    return { formError: "Create a draft first, then use Mark as sent after reviewing the saved invoice." };
  }

  try {
    const customerId = Number.parseInt(text(formData.get("customerId")), 10);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error("Select a customer before saving the invoice.");
    }

    const [customer] = await db
      .select({
        address: customers.address,
        addressLine1: customers.addressLine1,
        addressLine2: customers.addressLine2,
        companyName: customers.companyName,
        fullName: customers.fullName,
        id: customers.id,
        invoiceCode: customers.invoiceCode,
        npwp: customers.npwp,
        provincePostal: customers.provincePostal,
      })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);
    if (!customer) throw new Error("Selected customer is not available.");

    const chargeInputs = parseJsonArray<SubmittedChargeLine>(formData.get("chargeLines"), "Charge line")
      .map((line, index) => {
        const billingBasis = line.billingBasis === "per_kg" || line.billingBasis === "flat"
          ? line.billingBasis
          : null;
        const description = String(line.description ?? "").trim();
        const reference = String(line.reference ?? "").trim();
        const selectedSource = line.sourceKey ? parseInvoiceSourceKey(String(line.sourceKey)) : null;
        const unitRate = numberValue(line.unitRate);
        const manualChargeableWeight = numberValue(line.manualChargeableWeight);

        if (!billingBasis) throw new Error(`Charge ${index + 1} has an invalid billing basis.`);
        if (!description) throw new Error(`Charge ${index + 1} requires a service description.`);
        if (line.sourceKey && !selectedSource?.sourceId) {
          throw new Error(`Charge ${index + 1} has an invalid shipment source.`);
        }
        if (!selectedSource && !reference) {
          throw new Error(`Charge ${index + 1} requires a reference.`);
        }
        if (billingBasis === "per_kg" && !selectedSource && manualChargeableWeight <= 0) {
          throw new Error(`Charge ${index + 1} requires a positive chargeable weight.`);
        }
        if (unitRate < 0) {
          throw new Error(`Charge ${index + 1} cannot use a negative rate.`);
        }
        if (!isDraft && unitRate <= 0) {
          throw new Error(`Charge ${index + 1} requires a positive rate before sending.`);
        }

        return {
          billingBasis,
          description,
          manualChargeableWeight,
          reference,
          selectedSource,
          unitRate,
        };
      });
    const deductionInputs = parseJsonArray<SubmittedDeduction>(formData.get("deductions"), "Deduction")
      .filter((line) => line.description.trim() || numberValue(line.amount) > 0);

    if (chargeInputs.length === 0) {
      throw new Error("Add at least one shipment or manual service charge.");
    }

    const selectedSources = uniqueInvoiceSources(
      chargeInputs.map((line) => line.selectedSource
        ? sourceKey(line.selectedSource.sourceType, line.selectedSource.sourceId)
        : null),
    );
    const awbIds = selectedSources
      .filter((source) => source.sourceType === "awb")
      .map((source) => source.sourceId);
    const shipmentIds = selectedSources
      .filter((source) => source.sourceType === "shipment")
      .map((source) => Number.parseInt(source.sourceId, 10));
    if (shipmentIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new Error("One or more selected shipment lines are invalid.");
    }

    const [persistedAwbs, persistedShipments, invoicedShipmentRows] = await Promise.all([
      awbIds.length ? db.select().from(awbs).where(inArray(awbs.id, awbIds)) : [],
      shipmentIds.length
        ? db
            .select({
              chargeableWeight: shipments.chargeableWeight,
              createdAt: shipments.createdAt,
              customerReference: shipments.customerReference,
              customerId: shipments.customerId,
              destination: shipments.destination,
              id: shipments.id,
              internalTrackingNo: shipments.internalTrackingNo,
              mawb: shipments.mawb,
              origin: shipments.origin,
              totalPcs: shipments.totalPcs,
              trackingNumber: shipments.trackingNumber,
            })
            .from(shipments)
            .where(inArray(shipments.id, shipmentIds))
        : [],
      shipmentIds.length
        ? db
            .select({ shipmentId: invoiceLineItems.shipmentId })
            .from(invoiceLineItems)
            .innerJoin(invoices, eq(invoiceLineItems.invoiceId, invoices.id))
            .where(
              and(
                inArray(invoiceLineItems.shipmentId, shipmentIds),
                sql`coalesce(${invoices.status}, 'sent') <> 'voided'`,
              ),
            )
        : [],
    ]);
    if (persistedAwbs.length !== awbIds.length || persistedShipments.length !== shipmentIds.length) {
      throw new Error("One or more selected shipment sources are no longer available.");
    }
    const persistedAwbsById = new Map(persistedAwbs.map((row) => [row.id, row]));
    const persistedShipmentsById = new Map(persistedShipments.map((row) => [row.id, row]));
    const invalidAwb = persistedAwbs.find((row) => row.customerId !== customerId || row.invoiced);
    if (invalidAwb) {
      throw new Error("One or more selected AWBs are already invoiced or belong to another customer.");
    }
    const invalidShipment = persistedShipments.find((row) => row.customerId !== customerId);
    if (invalidShipment || invoicedShipmentRows.length > 0) {
      throw new Error("One or more selected shipments are already invoiced or belong to another customer.");
    }
    const shipmentFlightNumbers = await getShipmentFlightNumberMap(shipmentIds);

    const chargeLines = chargeInputs.map((line, index) => {
      const common = {
        billingBasis: line.billingBasis,
        description: line.description,
        flatAmount: line.billingBasis === "flat" ? line.unitRate : null,
        pricePerKg: line.billingBasis === "per_kg" ? line.unitRate : null,
        sortOrder: index + 1,
        type: "charge" as const,
        unitRate: line.unitRate,
      };

      if (!line.selectedSource) {
        const chargeableWeight = line.billingBasis === "per_kg"
          ? line.manualChargeableWeight
          : null;
        return {
          ...common,
          awbId: null,
          awbNumber: null,
          chargeableWeight,
          destination: null,
          flightNumber: null,
          lineTotal: line.billingBasis === "per_kg"
            ? numberValue(chargeableWeight) * line.unitRate
            : line.unitRate,
          origin: null,
          pieces: null,
          reference: line.reference,
          shipmentDate: null,
          shipmentId: null,
        };
      }

      if (line.selectedSource.sourceType === "shipment") {
        const shipmentId = Number.parseInt(line.selectedSource.sourceId, 10);
        const shipment = persistedShipmentsById.get(shipmentId);
        if (!shipment) throw new Error("Selected shipment is not available.");
        const chargeableWeight = line.billingBasis === "per_kg"
          ? numberValue(shipment.chargeableWeight)
          : null;
        if (line.billingBasis === "per_kg" && numberValue(chargeableWeight) <= 0) {
          throw new Error(`Correct the chargeable weight for ${resolveInvoiceReference({
            awbNumber: shipment.mawb,
            customerReference: shipment.customerReference,
            internalTrackingNumber: shipment.internalTrackingNo,
            trackingNumber: shipment.trackingNumber,
          })} before invoicing.`);
        }
        return {
          ...common,
          awbId: null,
          awbNumber: shipment.mawb,
          chargeableWeight,
          destination: shipment.destination,
          flightNumber: shipmentFlightNumbers.get(shipmentId) ?? null,
          lineTotal: line.billingBasis === "per_kg"
            ? numberValue(chargeableWeight) * line.unitRate
            : line.unitRate,
          origin: shipment.origin,
          pieces: shipment.totalPcs,
          reference: resolveInvoiceReference({
            awbNumber: shipment.mawb,
            customerReference: shipment.customerReference,
            internalTrackingNumber: shipment.internalTrackingNo,
            trackingNumber: shipment.trackingNumber,
          }),
          shipmentDate: dateOnly(shipment.createdAt),
          shipmentId,
        };
      }

      const awb = persistedAwbsById.get(line.selectedSource.sourceId);
      if (!awb) throw new Error("Selected AWB is not available.");
      const chargeableWeight = line.billingBasis === "per_kg"
        ? numberValue(awb.chargeableWeight)
        : null;
      if (line.billingBasis === "per_kg" && numberValue(chargeableWeight) <= 0) {
        throw new Error(`Correct the chargeable weight for ${awb.awbNumber || awb.id} before invoicing.`);
      }
      return {
        ...common,
        awbId: awb.id,
        awbNumber: awb.awbNumber,
        chargeableWeight,
        destination: awb.destination,
        flightNumber: awb.flightNumber,
        lineTotal: line.billingBasis === "per_kg"
          ? numberValue(chargeableWeight) * line.unitRate
          : line.unitRate,
        origin: awb.origin,
        pieces: awb.pieces,
        reference: awb.awbNumber || awb.id,
        shipmentDate: awb.shipmentDate,
        shipmentId: null,
      };
    });

    const vatEnabled = booleanField(formData.get("vatEnabled"));
    const pphEnabled = booleanField(formData.get("pphEnabled"));
    const totals = calculateInvoiceTotals({
      deductions: deductionInputs,
      depositAmount: text(formData.get("depositAmount")),
      lines: chargeLines,
      pphEnabled,
      vatEnabled,
    });

    const invoiceDate = dateText(formData.get("invoiceDate"));
    if (!invoiceDate) {
      throw new Error("Choose a valid invoice date.");
    }
    const resolvedPaymentTerms = resolveInvoicePaymentTerms({
      customDueDate: dateText(formData.get("dueDate")),
      customLabel: text(formData.get("customPaymentTerms")),
      invoiceDate,
      paymentTermCode: text(formData.get("paymentTermCode")),
    });
    const showPaymentTerms = !pphEnabled && booleanField(formData.get("showPaymentTerms"));
    const invoiceYear = Number.parseInt(invoiceDate.slice(0, 4), 10);
    const customerCode = normalizeCustomerCode(customer.invoiceCode ?? "");
    if (!customerCode && !isDraft) {
      throw new Error("Set this customer's 3-letter invoice code in Customer Directory before sending.");
    }
    invoiceId = randomUUID();
    const now = new Date();
    const sequence = isDraft ? null : await allocateInvoiceSequence(invoiceYear);
    const invoiceNumber = sequence ? formatInvoiceNumber({ customerCode, sequence, year: invoiceYear }) : null;
    const verificationToken = invoiceNumber ? createInvoiceVerificationToken() : null;
    const verificationChecksum = invoiceNumber && verificationToken
      ? createInvoiceVerificationChecksum({
          amount: totals.netPayable,
          invoiceNumber,
          token: verificationToken,
        })
      : null;
    const retainUntil = new Date(now);
    retainUntil.setFullYear(retainUntil.getFullYear() + 5);

    const queries: BatchItem<"pg">[] = [
      db.insert(invoices).values({
        id: invoiceId,
        amountDue: String(totals.amountDue),
        archived: false,
        bankAccount: normalizeInvoiceBankAccountCode(text(formData.get("bankAccount"))),
        city: text(formData.get("city")) || "Tangerang",
        currency: (invoiceCurrencies.includes(text(formData.get("currency")) as InvoiceCurrency)
          ? text(formData.get("currency"))
          : "IDR"),
        customerAddressSnapshot: customerAddress(customer),
        customerCode,
        customerId,
        customerNameSnapshot: customerName(customer),
        customerNpwpSnapshot: customer.npwp,
        depositAmount: String(totals.depositAmount),
        dueDate: resolvedPaymentTerms.dueDate,
        formatVersion: 2,
        generatedAt: now,
        generatedBy: user.id,
        invoiceDate,
        invoiceNumber,
        netAmount: String(totals.netAmount),
        netPayable: String(totals.netPayable),
        paymentTerms: resolvedPaymentTerms.paymentTerms,
        period: text(formData.get("period")) || null,
        pphAmount: String(totals.pphAmount),
        pphBaseAmount: String(totals.pphBaseAmount),
        pphEnabled,
        pphRate: String(totals.pphRate),
        retainUntil: retainUntil.toISOString().slice(0, 10),
        showPaymentTerms,
        showPeriod: Boolean(text(formData.get("period"))),
        sentAt: isDraft ? null : now,
        status: isDraft ? "draft" : "sent",
        subtotal: String(totals.subtotal),
        total: String(totals.total),
        totalPengurangan: String(totals.totalPengurangan),
        vatAmount: String(totals.vatAmount),
        vatEnabled,
        vatRate: String(totals.vatRate),
        verificationChecksum,
        verificationToken,
        withholdingProofRef: text(formData.get("withholdingProofRef")) || null,
      }),
      ...chargeLines.map((line) =>
        db.insert(invoiceLineItems).values({
          awbId: line.awbId,
          awbNumber: line.awbNumber,
          billingBasis: line.billingBasis,
          chargeableWeight: line.chargeableWeight === null ? null : String(line.chargeableWeight),
          description: line.description,
          destination: line.destination,
          flatAmount: line.flatAmount === null ? null : String(line.flatAmount),
          flightNumber: line.flightNumber,
          invoiceId,
          lineTotal: String(line.lineTotal),
          lineType: "service",
          origin: line.origin,
          pieces: line.pieces,
          pricePerKg: line.pricePerKg === null ? null : String(line.pricePerKg),
          reference: line.reference,
          shipmentDate: line.shipmentDate,
          shipmentId: line.shipmentId,
          sortOrder: line.sortOrder,
        }),
      ),
      ...deductionInputs.map((line, index) =>
        db.insert(invoiceDeductions).values({
          amount: String(numberValue(line.amount)),
          description: line.description.trim() || "Deduction",
          invoiceId,
          sortOrder: index + 1,
        }),
      ),
      db.insert(invoiceAuditLog).values({
        action: isDraft ? "invoice.draft_saved" : "invoice.sent",
        entityId: invoiceId,
        entityType: "invoice",
        metadata: {
          awbCount: awbIds.length,
          chargeCount: chargeLines.length,
          invoiceNumber,
          netPayable: totals.netPayable,
          pphEnabled,
          shipmentCount: shipmentIds.length,
          status: isDraft ? "draft" : "sent",
        },
        performedBy: user.id,
      }),
    ];

    if (awbIds.length > 0) {
      queries.push(
        db
          .update(awbs)
          .set({ invoiceId, invoiced: true, updatedAt: now })
          .where(inArray(awbs.id, awbIds)),
      );
    }

    await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
    revalidatePath("/invoices");
    revalidatePath("/invoices/collections");
    revalidatePath("/dashboard");
  } catch (error) {
    return {
      formError: error instanceof Error ? error.message : "Invoice could not be saved.",
    };
  }

  redirect(`/invoices/${invoiceId}`);
}

export async function markDraftInvoiceSentFromForm(id: string, formData: FormData) {
  const user = await requireInvoiceUser();
  const confirmed = text(formData.get("confirmed"));
  if (confirmed !== "yes" || text(formData.get("confirmationCode")) !== "MARK SENT") {
    throw new Error("Type MARK SENT to confirm the dispatch record.");
  }

  const [invoice] = await db
    .select({
      customerCode: invoices.customerCode,
      formatVersion: invoices.formatVersion,
      invoiceDate: invoices.invoiceDate,
      netPayable: invoices.netPayable,
      status: invoices.status,
    })
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (!invoice) throw new Error("Invoice not found.");
  if (normalizeInvoiceStatus(invoice.status) !== "draft") throw new Error("Only draft invoices can be sent.");
  const invoiceDate = invoice.invoiceDate ?? new Date().toISOString().slice(0, 10);
  const invoiceYear = Number.parseInt(invoiceDate.slice(0, 4), 10);
  const customerCode = normalizeCustomerCode(invoice.customerCode ?? "");
  if (!customerCode) {
    throw new Error("Set this customer's 3-letter invoice code in Customer Directory before sending.");
  }

  if (invoice.formatVersion >= 2) {
    const draftLines = await db
      .select({
        billingBasis: invoiceLineItems.billingBasis,
        chargeableWeight: invoiceLineItems.chargeableWeight,
        flatAmount: invoiceLineItems.flatAmount,
        lineTotal: invoiceLineItems.lineTotal,
        lineType: invoiceLineItems.lineType,
        pricePerKg: invoiceLineItems.pricePerKg,
      })
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, id));
    if (draftLines.length === 0) throw new Error("Add at least one charge before sending.");
    const invalidLine = draftLines.find((line) => {
      const billingBasis = invoiceLineBillingBasis(line);
      return billingBasis === "per_kg"
        ? numberValue(line.chargeableWeight) <= 0 || numberValue(line.pricePerKg) <= 0
        : numberValue(line.flatAmount ?? line.lineTotal) <= 0;
    });
    if (invalidLine) {
      throw new Error("Every charge requires a positive quantity and rate before sending.");
    }
  }

  const sequence = await allocateInvoiceSequence(invoiceYear);
  const invoiceNumber = formatInvoiceNumber({ customerCode, sequence, year: invoiceYear });
  const verificationToken = createInvoiceVerificationToken();
  const verificationChecksum = createInvoiceVerificationChecksum({
    amount: numberValue(invoice.netPayable),
    invoiceNumber,
    token: verificationToken,
  });
  const now = new Date();

  const result = await db.execute<{ updated: boolean }>(sql`
    with updated_invoice as (
      update invoices
      set invoice_number = ${invoiceNumber}, sent_at = ${now}, status = 'sent',
          verification_checksum = ${verificationChecksum}, verification_token = ${verificationToken}
      where id = ${id} and status = 'draft' and invoice_number is null
      returning id
    ), inserted_audit as (
      insert into invoice_audit_log (action, entity_type, entity_id, performed_by, performed_at, metadata)
      select 'invoice.marked_sent', 'invoice', id::text, ${user.id}, ${now}, ${JSON.stringify({
        deliveryMethod: "external_or_manual",
        invoiceNumber,
      })}::jsonb
      from updated_invoice
      returning id
    )
    select exists(select 1 from updated_invoice) as updated
  `);

  if (!result.rows[0]?.updated) {
    throw new Error("Only draft invoices can be sent.");
  }

  revalidatePath("/invoices");
  revalidatePath("/invoices/collections");
  revalidatePath(`/invoices/${id}`);
}

export async function markInvoicePaidFromForm(id: string, formData: FormData) {
  const user = await requireInvoiceUser();
  const confirmed = text(formData.get("confirmed"));
  if (confirmed !== "yes") throw new Error("Paid confirmation is required.");

  const [invoice] = await db
    .select({ status: invoices.status })
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (!invoice) throw new Error("Invoice not found.");
  const status = normalizeInvoiceStatus(invoice.status);
  if (status === "draft") throw new Error("Send the invoice before marking it paid.");
  if (status === "voided") throw new Error("Voided invoices cannot be marked paid.");
  if (status === "archived") throw new Error("Archived invoices cannot be marked paid.");

  const paidDate = dateText(formData.get("paidAt"));
  const paidAt = paidDate ? new Date(`${paidDate}T00:00:00`) : new Date();
  const paymentReference = text(formData.get("paymentReference")) || null;
  if (!paymentReference) throw new Error("Payment reference is required.");

  await db.batch([
    db
      .update(invoices)
      .set({ paidAt, paymentReference, status: "paid" })
      .where(eq(invoices.id, id)),
    db.insert(invoiceAuditLog).values({
      action: "invoice.paid",
      entityId: id,
      entityType: "invoice",
      metadata: { paidAt: paidAt.toISOString(), paymentReference },
      performedBy: user.id,
    }),
  ]);

  revalidatePath("/invoices");
  revalidatePath("/invoices/collections");
  revalidatePath(`/invoices/${id}`);
}

export async function archiveInvoiceFromForm(id: string, formData: FormData) {
  const user = await requireInvoiceUser();
  const confirmed = text(formData.get("confirmed"));
  const reason = text(formData.get("reason"));
  const [invoice] = await db.select({ invoiceNumber: invoices.invoiceNumber }).from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) throw new Error("Invoice not found.");
  if (confirmed !== "yes" || text(formData.get("confirmationCode")) !== (invoice.invoiceNumber || id)) throw new Error("Type the exact invoice identifier to archive it.");
  if (!reason) throw new Error("Archive reason is required.");

  await db.batch([
    db
      .update(invoices)
      .set({ archived: true, status: "archived" })
      .where(eq(invoices.id, id)),
    db.insert(invoiceAuditLog).values({
      action: "invoice.archived",
      entityId: id,
      entityType: "invoice",
      metadata: { reason },
      performedBy: user.id,
    }),
  ]);
  revalidatePath("/invoices");
  revalidatePath("/invoices/collections");
  revalidatePath(`/invoices/${id}`);
}

export async function voidInvoiceFromForm(id: string, formData: FormData) {
  const user = await requireInvoiceUser();
  const confirmed = text(formData.get("confirmed"));
  const reason = text(formData.get("reason"));
  if (!reason) throw new Error("Void reason is required.");

  const [invoice] = await db
    .select({ invoiceNumber: invoices.invoiceNumber, status: invoices.status })
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (!invoice) throw new Error("Invoice not found.");
  if (confirmed !== "yes" || text(formData.get("confirmationCode")) !== (invoice.invoiceNumber || id)) throw new Error("Type the exact invoice identifier to void it.");
  if (normalizeInvoiceStatus(invoice.status) === "voided") throw new Error("Invoice is already voided.");

  const lineRows = await db
    .select({ awbId: invoiceLineItems.awbId, shipmentId: invoiceLineItems.shipmentId })
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id));
  const awbIds = [...new Set(lineRows
    .map((row) => row.awbId)
    .filter((value): value is string => Boolean(value)))];
  const shipmentIds = [...new Set(lineRows
    .map((row) => row.shipmentId)
    .filter((value): value is number => typeof value === "number"))];
  const now = new Date();
  const queries: BatchItem<"pg">[] = [
    db
      .update(invoices)
      .set({ archived: false, status: "voided" })
      .where(eq(invoices.id, id)),
    db.insert(invoiceAuditLog).values({
      action: "invoice.voided",
      entityId: id,
      entityType: "invoice",
      metadata: { awbCount: awbIds.length, reason, shipmentCount: shipmentIds.length },
      performedBy: user.id,
    }),
  ];

  if (awbIds.length > 0) {
    queries.push(
      db
        .update(awbs)
        .set({ invoiceId: null, invoiced: false, updatedAt: now })
        .where(inArray(awbs.id, awbIds)),
    );
  }

  await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
  revalidatePath("/invoices");
  revalidatePath("/invoices/collections");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/dashboard");
}
