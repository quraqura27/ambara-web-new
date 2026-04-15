"use client";

import { GlobalWorkerOptions } from "pdfjs-dist";

/**
 * PDF WORKER CONFIG (Spec v3)
 * Ensures pdf.js logic runs in a background thread for maximum frontend performance.
 */
if (typeof window !== "undefined") {
  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;
}

export * from "pdfjs-dist";
