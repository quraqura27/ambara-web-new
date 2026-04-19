import React from "react";
import { UserButton } from "@clerk/nextjs";

export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-100">
      <header className="flex justify-between items-center p-6 bg-neutral-900 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Ambara Admin</h1>
          <p className="text-sm text-neutral-400">Master Administration Panel</p>
        </div>
        <div className="flex items-center space-x-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main className="flex-grow p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
