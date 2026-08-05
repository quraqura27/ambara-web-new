"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/core";

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Portal route failed:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center">
      <div aria-live="assertive" className="w-full rounded-lg border border-rose-500/20 bg-rose-500/[0.05] p-6 text-center" role="alert">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-300" />
        <h1 className="mt-4 text-lg font-semibold text-white">This portal view could not load</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">An unexpected server error prevented this request from completing. Retry, and share the reference below if the problem continues.</p>
        <Button className="mt-5 gap-2" onClick={reset} type="button" variant="secondary"><RotateCcw className="h-4 w-4" /> Retry</Button>
        {error.digest ? <p className="mt-4 font-mono text-[10px] text-slate-600">Reference {error.digest}</p> : null}
      </div>
    </div>
  );
}
