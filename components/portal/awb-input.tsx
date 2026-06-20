"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/core";
import { findAirlinesByPrefix, resolveAirWaybill } from "@/lib/airlines/core";

type AwbInputProps = {
  airlineName?: string;
  defaultAirlineName?: string | null;
  defaultValue?: string | null;
  error?: string;
  onAirlineNameChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  required?: boolean;
  value?: string;
};

export function AwbInput({
  airlineName,
  defaultAirlineName,
  defaultValue,
  error,
  onAirlineNameChange,
  onValueChange,
  required = true,
  value,
}: AwbInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [internalAirlineName, setInternalAirlineName] = useState(defaultAirlineName ?? "");
  const currentValue = value ?? internalValue;
  const manualAirlineName = airlineName ?? internalAirlineName;
  const prefix = currentValue.replace(/\D/g, "").slice(0, 3);
  const matches = useMemo(() => findAirlinesByPrefix(prefix), [prefix]);
  const uniqueAirline = matches.length === 1 ? matches[0] : null;
  const submittedAirlineName = uniqueAirline?.name ?? manualAirlineName;

  let canonicalPreview = "";
  if (currentValue.trim()) {
    try {
      canonicalPreview = resolveAirWaybill(currentValue, submittedAirlineName).canonicalNumber;
    } catch {
      canonicalPreview = "";
    }
  }

  function updateValue(nextValue: string) {
    if (onValueChange) onValueChange(nextValue);
    else setInternalValue(nextValue);

    const nextPrefix = nextValue.replace(/\D/g, "").slice(0, 3);
    const nextMatches = findAirlinesByPrefix(nextPrefix);
    if (nextMatches.length === 1) {
      const nextName = nextMatches[0]!.name;
      if (onAirlineNameChange) onAirlineNameChange(nextName);
      else setInternalAirlineName(nextName);
    } else if (nextPrefix !== prefix) {
      if (onAirlineNameChange) onAirlineNameChange("");
      else setInternalAirlineName("");
    }
  }

  function updateAirlineName(nextValue: string) {
    if (onAirlineNameChange) onAirlineNameChange(nextValue);
    else setInternalAirlineName(nextValue);
  }

  return (
    <div className="space-y-3">
      <Input
        aria-describedby="awb-format-help"
        aria-invalid={Boolean(error)}
        autoComplete="off"
        inputMode="numeric"
        name="mawb"
        onChange={(event) => updateValue(event.target.value)}
        placeholder="126-12345675"
        required={required}
        value={currentValue}
      />
      <p className="text-xs text-slate-500" id="awb-format-help">
        Enter a 3-digit airline prefix plus 7 or 8 digits. The final Modulus-7 check digit is
        calculated when omitted.
      </p>
      {uniqueAirline ? (
        <>
          <input name="awbAirlineName" type="hidden" value={uniqueAirline.name} />
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            Airline: {uniqueAirline.name}
            {canonicalPreview ? ` · ${canonicalPreview}` : ""}
          </div>
        </>
      ) : matches.length > 1 ? (
        <label className="block space-y-2">
          <span className="text-xs font-semibold text-slate-400">Airline for prefix {prefix}</span>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            name="awbAirlineName"
            onChange={(event) => updateAirlineName(event.target.value)}
            required
            value={manualAirlineName}
          >
            <option value="">Select airline</option>
            {matches.map((airline) => (
              <option key={`${airline.name}-${airline.iataDesignator}`} value={airline.name}>
                {airline.name}
              </option>
            ))}
          </select>
        </label>
      ) : prefix.length === 3 ? (
        <label className="block space-y-2">
          <span className="text-xs font-semibold text-amber-200">
            Airline name for unlisted prefix {prefix}
          </span>
          <Input
            name="awbAirlineName"
            onChange={(event) => updateAirlineName(event.target.value)}
            placeholder="Enter airline name"
            required
            value={manualAirlineName}
          />
          <span className="block text-xs text-slate-500">
            The public IATA-member snapshot does not resolve this prefix. Verify the airline before
            saving.
          </span>
        </label>
      ) : (
        <input name="awbAirlineName" type="hidden" value={submittedAirlineName} />
      )}
      {error ? (
        <span className="block text-xs font-medium text-rose-300" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
