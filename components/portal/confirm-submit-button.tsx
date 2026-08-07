"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/core";

type ConfirmSubmitButtonProps = {
  children: React.ReactNode;
  confirmLabel?: string;
  description: string;
  disabled?: boolean;
  title: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

function ConfirmationDialog({
  children,
  description,
  onClose,
  title,
}: {
  children: React.ReactNode;
  description: string;
  onClose: () => void;
  title: string;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("[data-dialog-initial]")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md rounded-lg border border-white/10 bg-[#12121a] p-6 shadow-2xl"
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-amber-500/10 p-3 text-amber-300"><AlertTriangle className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold" id={titleId}>{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400" id={descriptionId}>{description}</p>
          </div>
          <button aria-label="Close confirmation" className="rounded-lg p-1 text-slate-500 hover:text-white" onClick={onClose} title="Close confirmation" type="button"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmSubmitButton({
  children,
  confirmLabel = "Confirm",
  description,
  disabled,
  title,
  variant = "danger",
}: ConfirmSubmitButtonProps) {
  const [form, setForm] = useState<HTMLFormElement | null>(null);
  const confirmedRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input name="confirmed" ref={confirmedRef} type="hidden" />
      <Button disabled={disabled} onClick={(event) => setForm(event.currentTarget.form)} type="button" variant={variant}>{children}</Button>
      {form ? (
        <ConfirmationDialog description={description} onClose={() => setForm(null)} title={title}>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button data-dialog-initial onClick={() => setForm(null)} type="button" variant="ghost">Cancel</Button>
            <Button onClick={() => {
              const target = form;
              if (confirmedRef.current) confirmedRef.current.value = "yes";
              target.requestSubmit();
              setForm(null);
            }} type="button" variant={variant}>{confirmLabel}</Button>
          </div>
        </ConfirmationDialog>
      ) : null}
    </>
  );
}

export function TypedConfirmSubmitButton({
  children,
  confirmLabel = "Confirm",
  confirmText,
  description,
  disabled,
  title,
  variant = "danger",
}: ConfirmSubmitButtonProps & { confirmText: string }) {
  const [form, setForm] = useState<HTMLFormElement | null>(null);
  const [typed, setTyped] = useState("");
  const confirmedRef = useRef<HTMLInputElement>(null);
  const close = () => { setForm(null); setTyped(""); };

  return (
    <>
      <input name="confirmationCode" type="hidden" value={typed} />
      <input name="confirmed" ref={confirmedRef} type="hidden" />
      <Button disabled={disabled} onClick={(event) => setForm(event.currentTarget.form)} type="button" variant={variant}>{children}</Button>
      {form ? (
        <ConfirmationDialog description={description} onClose={close} title={title}>
          <label className="mt-5 block space-y-2">
            <span className="text-xs font-bold uppercase text-slate-500">Type {confirmText} to confirm</span>
            <input aria-label={`Type ${confirmText} to confirm`} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-sm outline-none focus:border-rose-400" data-dialog-initial onChange={(event) => setTyped(event.target.value)} value={typed} />
          </label>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={close} type="button" variant="ghost">Cancel</Button>
            <Button disabled={typed !== confirmText} onClick={() => {
              const target = form;
              if (confirmedRef.current) confirmedRef.current.value = "yes";
              target.requestSubmit();
              close();
            }} type="button" variant={variant}>{confirmLabel}</Button>
          </div>
        </ConfirmationDialog>
      ) : null}
    </>
  );
}

export function SelectionConfirmSubmitButton({
  children,
  description,
  disabled,
  title,
}: ConfirmSubmitButtonProps) {
  const [form, setForm] = useState<HTMLFormElement | null>(null);
  const confirmedRef = useRef<HTMLInputElement>(null);
  const selectedCount = form?.querySelectorAll('input[name="parcelIds"]:checked').length ?? 0;

  return (
    <>
      <input name="confirmed" ref={confirmedRef} type="hidden" />
      <Button disabled={disabled} onClick={(event) => setForm(event.currentTarget.form)} type="button">{children}</Button>
      {form ? (
        <ConfirmationDialog description={description} onClose={() => setForm(null)} title={title}>
          <p className="mt-4 rounded-lg bg-blue-500/10 p-3 text-sm font-semibold text-blue-200">Selected shipments: {selectedCount}</p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button data-dialog-initial onClick={() => setForm(null)} type="button" variant="ghost">Cancel</Button>
            <Button disabled={selectedCount === 0} onClick={() => {
              const target = form;
              if (confirmedRef.current) confirmedRef.current.value = "yes";
              target.requestSubmit();
              setForm(null);
            }} type="button">Update {selectedCount} shipments</Button>
          </div>
        </ConfirmationDialog>
      ) : null}
    </>
  );
}
