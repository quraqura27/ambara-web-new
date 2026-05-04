import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Ambara Globaltrans Portal | Command Center",
  description: "Deterministic Operations & Administration Utility",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/favicon.png?v=2", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/favicon.png?v=2",
  },
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
