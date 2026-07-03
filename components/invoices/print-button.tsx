"use client";

export function PrintButton({ href }: { href: string }) {
  return (
    <a
      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      Print / Save PDF
    </a>
  );
}
