import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Ambara Globaltrans Portal | Command Center",
  description: "Deterministic Operations & Administration Utility",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en">
      <body className="min-h-screen bg-[#0a0a0f] font-sans text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
