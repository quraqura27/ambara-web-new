"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/core";

export function CopyTrackingButton({ trackingNumber }: { trackingNumber: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      className="gap-2"
      onClick={async () => {
        await navigator.clipboard.writeText(trackingNumber);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }}
      type="button"
      variant="secondary"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy tracking number"}
    </Button>
  );
}
