import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-jakarta'
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
});

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
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: '#1122ee' },
      }}
    >
      <html lang="en" className="dark">
        <body
          className={`${jakarta.variable} ${inter.variable} font-sans antialiased bg-[#0a0a0f] text-slate-100 min-h-screen`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
