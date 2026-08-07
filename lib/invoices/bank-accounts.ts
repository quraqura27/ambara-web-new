export type InvoiceBankAccount = {
  accountNo: string;
  branch: string;
  name: string;
  swift: string;
  title: string;
};

export const invoiceBankAccounts: Record<string, InvoiceBankAccount> = {
  BCA: {
    accountNo: "7642412356",
    branch: "KCP Citra Raya",
    name: "QURAISY ADBURRAHMAN",
    swift: "CENAIDJAXXX",
    title: "Bank BCA",
  },
  MANDIRI: {
    accountNo: "127-00-99797779",
    branch: "KCP PHE Tower",
    name: "PT AMBARA ARTHA GLOBALTRANS",
    swift: "BMRIIDJA",
    title: "Bank Mandiri",
  },
  OCBC: {
    accountNo: "5458-0012-2586",
    branch: "OCBC Tower",
    name: "PT AMBARA ARTHA GLOBALTRANS",
    swift: "NISPIDJAXXX",
    title: "Bank OCBC",
  },
};

export function normalizeInvoiceBankAccountCode(code: string | null | undefined) {
  const normalized = (code || "MANDIRI").trim().toUpperCase();
  return invoiceBankAccounts[normalized] ? normalized : "MANDIRI";
}

export function getInvoiceBankAccount(code: string | null | undefined) {
  return invoiceBankAccounts[normalizeInvoiceBankAccountCode(code)];
}
