"use server";

import { randomUUID } from "crypto";

import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
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
  shipments,
} from "@/lib/db/schema";
import {
  calculateInvoiceTotals,
  deriveCustomerCode,
  formatInvoiceNumber,
  normalizeCustomerCode,
  numberValue,
  type InvoiceCurrency,
  invoiceCurrencies,
} from "@/lib/invoices/core";
import {
  createInvoiceVerificationChecksum,
  createInvoiceVerificationToken,
} from "@/lib/invoices/verification";
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

export type InvoiceableAwb = {
  awbNumber: string | null;
  carrier: string | null;
  chargeableWeight: string | null;
  destination: string | null;
  flightNumber: string | null;
  id: string;
  origin: string | null;
  pieces: number | null;
  shipmentDate: string | null;
  sourceId: string;
  sourceType: "awb" | "shipment";
};

export type InvoiceActionState = {
  formError?: string;
};

type SubmittedAwbLine = {
  awbId: string;
  pricePerKg: number | string;
};

type SubmittedServiceLine = {
  amount: number | string;
  description: string;
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

function parseSourceKey(value: string) {
  const normalized = value.trim();
  const match = /^(awb|shipment):(.+)$/.exec(normalized);
  if (match) {
    return {
      sourceId: match[2] ?? "",
      sourceType: match[1] as "awb" | "shipment",
    };
  }
  return normalized ? { sourceId: normalized, sourceType: "awb" as const } : null;
}

function dateOnly(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const normalized = value.trim();
  return /^\d{4}-\d{2}-\d{2}/.test(normalized) ? normalized.slice(0, 10) : null;
}

function shipmentAwbNumber(shipment: {
  internalTrackingNo: string | null;
  mawb: string | null;
  trackingNumber: string | null;
}) {
  return shipment.mawb || shipment.internalTrackingNo || shipment.trackingNumber;
}

function uninvoicedShipmentWhere() {
  return sql`
    not exists (
      select 1
      from invoice_line_items ili
      join invoices inv on inv.id = ili.invoice_id
      where ili.shipment_id = ${shipments.id}
        and coalesce(inv.status, 'finalized') <> 'voided'
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
        ilike(customers.phone, `%${query}%`),
      )!,
    );
  }
  const where = filters.length ? and(...filters) : undefined;

  let rows: Array<{
    companyName: string | null;
    fullName: string | null;
    id: number;
    npwp: string | null;
  }>;
  let invoiceableCounts = new Map<number, number>();
  try {
    rows = await db
      .select({
        companyName: customers.companyName,
        fullName: customers.fullName,
        id: customers.id,
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
    code: deriveCustomerCode(customerName(customer)),
    invoiceableCount: invoiceableCounts.get(customer.id) ?? 0,
  }));
}

export async function getInvoiceableAwbs(customerId: number): Promise<InvoiceableAwb[]> {
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

  return [
    ...rows.map((row) => ({
      ...row,
      chargeableWeight: row.chargeableWeight === null ? null : String(row.chargeableWeight),
      id: sourceKey("awb", row.id),
      shipmentDate: row.shipmentDate,
      sourceId: row.id,
      sourceType: "awb" as const,
    })),
    ...shipmentRows.map((row) => ({
      awbNumber: shipmentAwbNumber(row),
      carrier: row.awbAirlineName,
      chargeableWeight: row.chargeableWeight === null ? null : String(row.chargeableWeight),
      destination: row.destination,
      flightNumber: null,
      id: sourceKey("shipment", row.id),
      origin: row.origin,
      pieces: row.totalPcs,
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
    generatedAt: Date | null;
    id: string;
    invoiceDate: string | null;
    invoiceNumber: string;
    netPayable: string | null;
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
          generatedAt: invoices.generatedAt,
          id: invoices.id,
          invoiceDate: invoices.invoiceDate,
          invoiceNumber: invoices.invoiceNumber,
          netPayable: invoices.netPayable,
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
    rows,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
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
        status: invoices.status,
        total: invoices.total,
      })
      .from(invoices)
      .where(eq(invoices.verificationToken, token))
      .limit(1);
  } catch (error) {
    if (!isLocalRecoverableReadError(error)) throw error;
    return null;
  }

  return invoice ?? null;
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

  try {
    const customerId = Number.parseInt(text(formData.get("customerId")), 10);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error("Select a customer before finalizing the invoice.");
    }

    const [customer] = await db
      .select({
        address: customers.address,
        addressLine1: customers.addressLine1,
        addressLine2: customers.addressLine2,
        companyName: customers.companyName,
        fullName: customers.fullName,
        id: customers.id,
        npwp: customers.npwp,
        provincePostal: customers.provincePostal,
      })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);
    if (!customer) throw new Error("Selected customer is not available.");

    const awbInputs = parseJsonArray<SubmittedAwbLine>(formData.get("awbLines"), "AWB line");
    const serviceInputs = parseJsonArray<SubmittedServiceLine>(formData.get("serviceLines"), "Service line")
      .filter((line) => line.description.trim() || numberValue(line.amount) > 0);
    const deductionInputs = parseJsonArray<SubmittedDeduction>(formData.get("deductions"), "Deduction")
      .filter((line) => line.description.trim() || numberValue(line.amount) > 0);

    if (awbInputs.length === 0 && serviceInputs.length === 0) {
      throw new Error("Select at least one AWB or add one service line.");
    }

    const selectedSources = awbInputs.map((line) => parseSourceKey(line.awbId));
    if (selectedSources.some((source) => !source?.sourceId)) {
      throw new Error("One or more selected invoice lines are invalid.");
    }
    const selectedKeys = selectedSources.map((source) => sourceKey(source!.sourceType, source!.sourceId));
    if (new Set(selectedKeys).size !== selectedKeys.length) {
      throw new Error("Remove duplicate AWB or shipment selections before finalizing.");
    }

    const awbIds = selectedSources
      .filter((source) => source?.sourceType === "awb")
      .map((source) => source!.sourceId);
    const shipmentIds = selectedSources
      .filter((source) => source?.sourceType === "shipment")
      .map((source) => Number.parseInt(source!.sourceId, 10));
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
                sql`coalesce(${invoices.status}, 'finalized') <> 'voided'`,
              ),
            )
        : [],
    ]);
    if (persistedAwbs.length !== awbIds.length || persistedShipments.length !== shipmentIds.length) {
      throw new Error("One or more selected AWBs or shipments are no longer available.");
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

    const awbLines = awbInputs.map((line, index) => {
      const source = parseSourceKey(line.awbId);
      if (!source) throw new Error("Selected invoice line is not available.");
      const pricePerKg = numberValue(line.pricePerKg);
      if (source.sourceType === "shipment") {
        const shipmentId = Number.parseInt(source.sourceId, 10);
        const shipment = persistedShipmentsById.get(shipmentId);
        if (!shipment) throw new Error("Selected shipment is not available.");
        const chargeableWeight = numberValue(shipment.chargeableWeight);
        return {
          awbId: null,
          awbNumber: shipmentAwbNumber(shipment),
          chargeableWeight,
          destination: shipment.destination,
          flightNumber: null,
          lineTotal: chargeableWeight * pricePerKg,
          origin: shipment.origin,
          pieces: shipment.totalPcs,
          pricePerKg,
          shipmentDate: dateOnly(shipment.createdAt),
          shipmentId,
          sortOrder: index + 1,
          type: "awb" as const,
        };
      }

      const awb = persistedAwbsById.get(source.sourceId);
      if (!awb) throw new Error("Selected AWB is not available.");
      const chargeableWeight = numberValue(awb.chargeableWeight);
      return {
        awbId: awb.id,
        awbNumber: awb.awbNumber,
        chargeableWeight,
        destination: awb.destination,
        flightNumber: awb.flightNumber,
        lineTotal: chargeableWeight * pricePerKg,
        origin: awb.origin,
        pieces: awb.pieces,
        pricePerKg,
        shipmentDate: awb.shipmentDate,
        shipmentId: null,
        sortOrder: index + 1,
        type: "awb" as const,
      };
    });
    const serviceLines = serviceInputs.map((line, index) => ({
      amount: numberValue(line.amount),
      description: line.description.trim() || "Service",
      sortOrder: awbLines.length + index + 1,
      type: "service" as const,
    }));

    const vatEnabled = booleanField(formData.get("vatEnabled"));
    const pphEnabled = booleanField(formData.get("pphEnabled"));
    const totals = calculateInvoiceTotals({
      deductions: deductionInputs,
      depositAmount: text(formData.get("depositAmount")),
      lines: [
        ...awbLines.map((line) => ({
          chargeableWeight: line.chargeableWeight,
          pricePerKg: line.pricePerKg,
          type: "awb" as const,
        })),
        ...serviceLines.map((line) => ({
          flatAmount: line.amount,
          type: "service" as const,
        })),
      ],
      pphEnabled,
      vatEnabled,
    });

    const invoiceDate = dateText(formData.get("invoiceDate")) ?? new Date().toISOString().slice(0, 10);
    const invoiceYear = Number.parseInt(invoiceDate.slice(0, 4), 10);
    const customerCode = normalizeCustomerCode(text(formData.get("customerCode"))) || deriveCustomerCode(customerName(customer));
    if (!customerCode) throw new Error("Customer code must be 2 to 5 letters or numbers.");
    const sequence = await allocateInvoiceSequence(invoiceYear);
    const invoiceNumber = formatInvoiceNumber({ customerCode, sequence, year: invoiceYear });
    const verificationToken = createInvoiceVerificationToken();
    const verificationChecksum = createInvoiceVerificationChecksum({
      amount: totals.netPayable,
      invoiceNumber,
      token: verificationToken,
    });
    invoiceId = randomUUID();
    const now = new Date();
    const retainUntil = new Date(now);
    retainUntil.setFullYear(retainUntil.getFullYear() + 5);

    const queries: BatchItem<"pg">[] = [
      db.insert(invoices).values({
        id: invoiceId,
        amountDue: String(totals.amountDue),
        archived: false,
        bankAccount: text(formData.get("bankAccount")) || "OCBC",
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
        dueDate: dateText(formData.get("dueDate")),
        generatedAt: now,
        generatedBy: user.id,
        invoiceDate,
        invoiceNumber,
        netAmount: String(totals.netAmount),
        netPayable: String(totals.netPayable),
        paymentTerms: text(formData.get("paymentTerms")) || "CASH",
        period: text(formData.get("period")) || null,
        pphAmount: String(totals.pphAmount),
        pphBaseAmount: String(totals.pphBaseAmount),
        pphEnabled,
        pphRate: String(totals.pphRate),
        retainUntil: retainUntil.toISOString().slice(0, 10),
        showPaymentTerms: true,
        showPeriod: Boolean(text(formData.get("period"))),
        status: "finalized",
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
      ...awbLines.map((line) =>
        db.insert(invoiceLineItems).values({
          awbId: line.awbId,
          awbNumber: line.awbNumber,
          chargeableWeight: String(line.chargeableWeight),
          destination: line.destination,
          flightNumber: line.flightNumber,
          invoiceId,
          lineTotal: String(line.lineTotal),
          lineType: "awb",
          origin: line.origin,
          pieces: line.pieces,
          pricePerKg: String(line.pricePerKg),
          shipmentDate: line.shipmentDate,
          shipmentId: line.shipmentId,
          sortOrder: line.sortOrder,
        }),
      ),
      ...serviceLines.map((line) =>
        db.insert(invoiceLineItems).values({
          description: line.description,
          flatAmount: String(line.amount),
          invoiceId,
          lineTotal: String(line.amount),
          lineType: "service",
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
        action: "invoice.finalized",
        entityId: invoiceId,
        entityType: "invoice",
        metadata: {
          awbCount: awbIds.length,
          invoiceNumber,
          netPayable: totals.netPayable,
          pphEnabled,
          shipmentCount: shipmentIds.length,
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
    revalidatePath("/dashboard");
  } catch (error) {
    return {
      formError: error instanceof Error ? error.message : "Invoice could not be finalized.",
    };
  }

  redirect(`/invoices/${invoiceId}`);
}

export async function archiveInvoiceFromForm(id: string, formData: FormData) {
  const user = await requireInvoiceUser();
  const confirmed = text(formData.get("confirmed"));
  if (confirmed !== "archive") throw new Error("Archive confirmation is required.");

  await db.batch([
    db
      .update(invoices)
      .set({ archived: true, status: "archived" })
      .where(eq(invoices.id, id)),
    db.insert(invoiceAuditLog).values({
      action: "invoice.archived",
      entityId: id,
      entityType: "invoice",
      metadata: { reason: text(formData.get("reason")) || null },
      performedBy: user.id,
    }),
  ]);
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}
