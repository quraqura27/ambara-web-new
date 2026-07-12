"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button, Input } from "@/components/ui/core";
import { calculateVolumetricWeightKg, type ShipmentPackageInput } from "@/lib/shipments/readiness";

type EditablePackage = Omit<ShipmentPackageInput, "packageNumber"> & { id: string };

function emptyPackage(): EditablePackage {
  return { grossWeightKg: null, heightCm: 0, id: crypto.randomUUID(), lengthCm: 0, pieces: 1, widthCm: 0 };
}

export function ShipmentPackageEditor({ initialRows }: { initialRows: ShipmentPackageInput[] }) {
  const [rows, setRows] = useState<EditablePackage[]>(() =>
    initialRows.map((row, index) => ({ ...row, id: `initial-${index}` })),
  );
  const serialized = JSON.stringify(rows.map(({ id: _id, ...row }) => row));
  const total = useMemo(() => rows.reduce((sum, row) => {
    if ([row.lengthCm, row.widthCm, row.heightCm, row.pieces].some((value) => value <= 0)) return sum;
    return sum + calculateVolumetricWeightKg(row);
  }, 0), [rows]);
  const setValue = (id: string, key: keyof EditablePackage, value: number | null) => setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));

  return (
    <div className="space-y-3">
      <input name="packagesJson" type="hidden" value={serialized} />
      {rows.map((row, index) => (
        <div className="grid gap-2 rounded-lg border border-white/5 bg-black/10 p-3 sm:grid-cols-[56px_repeat(5,minmax(90px,1fr))_40px] sm:items-end" key={row.id}>
          <p className="pb-2 font-mono text-xs text-slate-600">#{index + 1}</p>
          {(["pieces", "lengthCm", "widthCm", "heightCm", "grossWeightKg"] as const).map((key) => (
            <label className="space-y-1" key={key}>
              <span className="text-[10px] font-semibold uppercase text-slate-600">{{ pieces: "Pcs", lengthCm: "L cm", widthCm: "W cm", heightCm: "H cm", grossWeightKg: "Gross kg" }[key]}</span>
              <Input aria-label={`${{ pieces: "Pieces", lengthCm: "Length in centimeters", widthCm: "Width in centimeters", heightCm: "Height in centimeters", grossWeightKg: "Gross weight in kilograms" }[key]} for package ${index + 1}`} min={key === "grossWeightKg" ? 0.01 : 1} onChange={(event) => setValue(row.id, key, event.target.value ? Number(event.target.value) : null)} step={key === "pieces" ? 1 : 0.01} type="number" value={row[key] ?? ""} />
            </label>
          ))}
          <Button aria-label={`Remove package row ${index + 1}`} className="h-10 p-0" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} title={`Remove package row ${index + 1}`} type="button" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button className="gap-2" onClick={() => setRows((current) => [...current, emptyPackage()])} type="button" variant="ghost"><Plus className="h-4 w-4" /> Add dimensions</Button>
        <p className="font-mono text-xs text-slate-500">Volumetric total: {total.toFixed(2)} kg</p>
      </div>
    </div>
  );
}
