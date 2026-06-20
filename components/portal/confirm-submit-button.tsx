"use client";

import { useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/core";

type ConfirmSubmitButtonProps = {
  children: React.ReactNode;
  confirmLabel?: string;
  description: string;
  disabled?: boolean;
  title: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

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
      <Button
        disabled={disabled}
        onClick={(event) => setForm(event.currentTarget.form)}
        type="button"
        variant={variant}
      >
        {children}
      </Button>
      {form ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
          <div aria-labelledby="confirm-title" aria-modal="true" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl" role="dialog">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-500/10 p-3 text-amber-300"><AlertTriangle className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold" id="confirm-title">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
              </div>
              <button aria-label="Close confirmation" className="rounded-lg p-1 text-slate-500 hover:text-white" onClick={() => setForm(null)} type="button"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button onClick={() => setForm(null)} type="button" variant="ghost">Cancel</Button>
              <Button onClick={() => {
                const target = form;
                if (confirmedRef.current) confirmedRef.current.value = "yes";
                setForm(null);
                window.requestAnimationFrame(() => target.requestSubmit());
              }} type="button" variant={variant}>{confirmLabel}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function TypedConfirmSubmitButton({
  children,
  confirmText,
  description,
  title,
}: ConfirmSubmitButtonProps & { confirmText: string }) {
  const [form, setForm] = useState<HTMLFormElement | null>(null);
  const [typed, setTyped] = useState("");
  const confirmedRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input name="confirmationCode" type="hidden" value={typed} />
      <input name="confirmed" ref={confirmedRef} type="hidden" />
      <Button onClick={(event) => setForm(event.currentTarget.form)} type="button" variant="danger">{children}</Button>
      {form ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
          <div aria-labelledby="typed-confirm-title" aria-modal="true" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl" role="dialog">
            <h2 className="text-lg font-bold" id="typed-confirm-title">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
            <label className="mt-5 block space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Type {confirmText} to confirm</span>
              <input autoFocus className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-sm outline-none focus:border-rose-400" onChange={(event) => setTyped(event.target.value)} value={typed} />
            </label>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button onClick={() => { setForm(null); setTyped(""); }} type="button" variant="ghost">Cancel</Button>
              <Button disabled={typed !== confirmText} onClick={() => {
                const target = form;
                if (confirmedRef.current) confirmedRef.current.value = "yes";
                setForm(null);
                window.requestAnimationFrame(() => target.requestSubmit());
              }} type="button" variant="danger">Confirm Update</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SelectionConfirmSubmitButton({
  children,
  description,
  title,
}: ConfirmSubmitButtonProps) {
  const [form, setForm] = useState<HTMLFormElement | null>(null);
  const confirmedRef = useRef<HTMLInputElement>(null);
  const selectedCount = form?.querySelectorAll('input[name="parcelIds"]:checked').length ?? 0;

  return (
    <>
      <input name="confirmed" ref={confirmedRef} type="hidden" />
      <Button onClick={(event) => setForm(event.currentTarget.form)} type="button">{children}</Button>
      {form ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
          <div aria-modal="true" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6" role="dialog">
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
            <p className="mt-4 rounded-lg bg-blue-500/10 p-3 text-sm font-semibold text-blue-200">
              Selected shipments: {selectedCount}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button onClick={() => setForm(null)} type="button" variant="ghost">Cancel</Button>
              <Button disabled={selectedCount === 0} onClick={() => {
                const target = form;
                if (confirmedRef.current) confirmedRef.current.value = "yes";
                setForm(null);
                window.requestAnimationFrame(() => target.requestSubmit());
              }} type="button">Update {selectedCount} shipments</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
