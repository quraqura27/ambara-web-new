"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-white">
        <main aria-live="assertive" className="flex min-h-screen items-center justify-center p-6" role="alert">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold">Ambara Portal is temporarily unavailable</h1>
            <p className="mt-3 text-sm text-slate-400">No operation was confirmed. Retry when the service is available.</p>
            <button className="mt-5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm" onClick={reset} type="button">Retry</button>
          </div>
        </main>
      </body>
    </html>
  );
}
