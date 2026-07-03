"use client";

export function PrintButton() {
  return (
    <button
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
      onClick={() => window.print()}
      type="button"
    >
      Print / Save PDF
    </button>
  );
}
