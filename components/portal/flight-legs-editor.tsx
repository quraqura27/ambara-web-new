"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button, Input } from "@/components/ui/core";
import { findAirlinesByDesignator } from "@/lib/airlines/core";

type EditableFlightLeg = {
  airlineName: string;
  flightNumber: string;
  id: string;
};

type FlightLegsEditorProps = {
  defaultValue?: string;
  error?: string;
  onValueChange?: (value: string) => void;
  value?: string;
};

function parseLegs(value: string): EditableFlightLeg[] {
  if (!value) return [];

  try {
    const rows = JSON.parse(value) as Array<Partial<EditableFlightLeg>>;
    if (!Array.isArray(rows)) return [];
    return rows.map((row, index) => ({
      airlineName: String(row.airlineName ?? ""),
      flightNumber: String(row.flightNumber ?? ""),
      id: String(row.id ?? `flight-${index + 1}`),
    }));
  } catch {
    return [];
  }
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `flight-${Date.now()}-${Math.random()}`;
}

export function FlightLegsEditor({
  defaultValue = "[]",
  error,
  onValueChange,
  value,
}: FlightLegsEditorProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const serialized = value ?? internalValue;
  const legs = parseLegs(serialized);

  function update(nextLegs: EditableFlightLeg[]) {
    const nextValue = JSON.stringify(nextLegs);
    if (onValueChange) onValueChange(nextValue);
    else setInternalValue(nextValue);
  }

  function updateFlight(index: number, flightNumber: string) {
    const nextLegs = [...legs];
    const designator = flightNumber.toUpperCase().replace(/[\s-]+/g, "").slice(0, 2);
    const matches = findAirlinesByDesignator(designator);
    nextLegs[index] = {
      ...nextLegs[index]!,
      airlineName: matches.length === 1 ? matches[0]!.name : "",
      flightNumber: flightNumber.toUpperCase(),
    };
    update(nextLegs);
  }

  function updateAirline(index: number, airlineName: string) {
    const nextLegs = [...legs];
    nextLegs[index] = { ...nextLegs[index]!, airlineName };
    update(nextLegs);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= legs.length) return;
    const nextLegs = [...legs];
    [nextLegs[index], nextLegs[target]] = [nextLegs[target]!, nextLegs[index]!];
    update(nextLegs);
  }

  return (
    <div className="space-y-4">
      <input name="flightLegsJson" type="hidden" value={serialized} />
      {legs.map((leg, index) => {
        const designator = leg.flightNumber.toUpperCase().replace(/[\s-]+/g, "").slice(0, 2);
        const matches = findAirlinesByDesignator(designator);
        const uniqueAirline = matches.length === 1 ? matches[0] : null;

        return (
          <div
            className="grid gap-3 rounded-xl border border-white/5 bg-slate-950/30 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]"
            key={leg.id}
          >
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Flight {index + 1}</span>
              <Input
                aria-label={`Flight ${index + 1} number`}
                onChange={(event) => updateFlight(index, event.target.value)}
                placeholder="GA820"
                value={leg.flightNumber}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Airline</span>
              {uniqueAirline ? (
                <Input readOnly value={uniqueAirline.name} />
              ) : matches.length > 1 ? (
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100"
                  onChange={(event) => updateAirline(index, event.target.value)}
                  value={leg.airlineName}
                >
                  <option value="">Select airline</option>
                  {matches.map((airline) => (
                    <option key={`${airline.name}-${airline.icaoCode}`} value={airline.name}>
                      {airline.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  aria-label={`Flight ${index + 1} airline name`}
                  onChange={(event) => updateAirline(index, event.target.value)}
                  placeholder={designator.length === 2 ? "Enter airline name" : "Auto-filled from code"}
                  value={leg.airlineName}
                />
              )}
            </label>
            <div className="flex items-end gap-1">
              <Button
                aria-label={`Move flight ${index + 1} up`}
                className="h-10 px-3"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                type="button"
                variant="ghost"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                aria-label={`Move flight ${index + 1} down`}
                className="h-10 px-3"
                disabled={index === legs.length - 1}
                onClick={() => move(index, 1)}
                type="button"
                variant="ghost"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                aria-label={`Remove flight ${index + 1}`}
                className="h-10 px-3"
                onClick={() => update(legs.filter((_, rowIndex) => rowIndex !== index))}
                type="button"
                variant="danger"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
      <Button
        className="gap-2"
        onClick={() =>
          update([...legs, { airlineName: "", flightNumber: "", id: newId() }])
        }
        type="button"
        variant="secondary"
      >
        <Plus className="h-4 w-4" /> Add Flight Leg
      </Button>
      <p className="text-xs text-slate-500">
        Optional. Use the 2-character IATA airline code plus 1–4 digits, for example GA820 or
        A3123.
      </p>
      {error ? (
        <span className="block text-xs font-medium text-rose-300" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
