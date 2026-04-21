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
        <head>
          <style dangerouslySetInnerHTML={{ __html: `
            :root {
              --font-sans: var(--font-jakarta), ui-sans-serif, system-ui, -apple-system, sans-serif;
            }
            body { 
              margin: 0; 
              padding: 0; 
              background-color: #0a0a0f !important; 
              color: #f8fafc !important;
              font-family: var(--font-sans);
            }
            .ambara-portal-bg { display: flex !important; min-height: 100vh !important; }
            .ambara-sidebar-shell { width: 256px !important; flex-shrink: 0 !important; display: flex !important; flex-direction: column !important; }
            @media (max-width: 1023px) { .ambara-sidebar-shell { display: none !important; } }
            .ambara-main-shell { flex: 1 1 0% !important; display: flex !important; flex-direction: column !important; min-width: 0 !important; }
            .ambara-header-shell { height: 64px !important; display: flex !important; align-items: center !important; }
            input, select, textarea { 
              background-color: #0f172a !important; 
              color: #f1f5f9 !important; 
              border: 1px solid #1e293b !important; 
              border-radius: 6px !important;
              padding: 8px 12px !important;
            }
            button { cursor: pointer; }
          ` }} />
        </head>
        <body
          className={`${jakarta.variable} ${inter.variable} font-sans antialiased bg-[#0a0a0f] text-slate-100 min-h-screen`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
