import type { InvoiceCustomerOption, InvoiceableAwb } from "@/actions/invoices";

export const mockInvoiceCustomers: InvoiceCustomerOption[] = [
  {
    code: "MEX",
    companyName: "PT Mock Express Nusantara",
    fullName: null,
    id: 900001,
    npwp: "00.000.000.0-000.000",
  },
  {
    code: "SNB",
    companyName: "CV Sample Niaga Bersama",
    fullName: null,
    id: 900002,
    npwp: "11.111.111.1-111.111",
  },
];

export const mockInvoiceAwbsByCustomerId: Record<number, InvoiceableAwb[]> = {
  900001: [
    {
      awbNumber: "126-45678901",
      carrier: "GA",
      chargeableWeight: "75",
      destination: "CGK",
      flightNumber: "GA-873",
      id: "mock-awb-mex-1",
      origin: "HKG",
      pieces: 5,
      shipmentDate: "2026-05-26",
    },
    {
      awbNumber: "126-45678902",
      carrier: "GA",
      chargeableWeight: "52",
      destination: "CGK",
      flightNumber: "GA-875",
      id: "mock-awb-mex-2",
      origin: "HKG",
      pieces: 3,
      shipmentDate: "2026-05-27",
    },
  ],
  900002: [
    {
      awbNumber: "618-12345670",
      carrier: "SQ",
      chargeableWeight: "110",
      destination: "CGK",
      flightNumber: "SQ-956",
      id: "mock-awb-snb-1",
      origin: "SIN",
      pieces: 8,
      shipmentDate: "2026-01-08",
    },
    {
      awbNumber: "618-12345671",
      carrier: "SQ",
      chargeableWeight: "34",
      destination: "CGK",
      flightNumber: "SQ-958",
      id: "mock-awb-snb-2",
      origin: "SIN",
      pieces: 2,
      shipmentDate: "2026-01-09",
    },
  ],
};
