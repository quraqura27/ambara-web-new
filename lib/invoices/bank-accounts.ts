export type InvoiceBankAccount = {
  accountNo: string;
  branch: string;
  name: string;
  swift: string;
  title: string;
};

export const invoiceBankAccounts: Record<string, InvoiceBankAccount> = {
  MANDIRI: {
    accountNo: "124-00-1124-1735",
    branch: "KCP Tebet - Jakarta Selatan",
    name: "Quraisy Abdurrahman",
    swift: "BMRIIDJAXXX",
    title: "BANK MANDIRI",
  },
  OCBC: {
    accountNo: "5458-0012-2586",
    branch: "OCBC Tower",
    name: "PT AMBARA ARTHA GLOBALTRANS",
    swift: "NISPIDJAXXX",
    title: "Bank OCBC",
  },
};

export function getInvoiceBankAccount(code: string | null | undefined) {
  return invoiceBankAccounts[code || "OCBC"] ?? invoiceBankAccounts.OCBC;
}
