import { CheckCircle2, ClipboardPlus, ShieldAlert } from "lucide-react";

import {
  completeShipmentTask,
  createShipmentTaskFromForm,
  updateShipmentReadinessFromForm,
} from "@/actions/shipment-readiness";
import { ConfirmSubmitButton } from "@/components/portal/confirm-submit-button";
import { ShipmentPackageEditor } from "@/components/portal/shipment-package-editor";
import { Button, Input } from "@/components/ui/core";
import {
  cargoRiskValues,
  clearanceModeValues,
  documentReadinessValues,
  incotermValues,
  shipmentOperationalStages,
} from "@/lib/shipments/readiness";
import { formatWibDateTime, toWibDateTimeLocalValue } from "@/lib/time/wib";

type ReadinessData = NonNullable<Awaited<ReturnType<typeof import("@/actions/shipment-readiness").getShipmentOperationalReadiness>>>;

const selectClass = "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500";

export function ShipmentReadinessPanel({ canManage, data }: { canManage: boolean; data: ReadinessData }) {
  const updateAction = updateShipmentReadinessFromForm.bind(null, data.shipment.trackingNumber);
  const createTaskAction = createShipmentTaskFromForm.bind(null, data.shipment.trackingNumber);
  const risks = Array.isArray(data.shipment.cargoRisks) ? data.shipment.cargoRisks : [];
  const packageRows = data.packages.map((row) => ({
    grossWeightKg: row.grossWeightKg == null ? null : Number(row.grossWeightKg),
    heightCm: Number(row.heightCm),
    lengthCm: Number(row.lengthCm),
    packageNumber: row.packageNumber,
    pieces: row.pieces,
    widthCm: Number(row.widthCm),
  }));

  return (
    <section className="space-y-5 border-t border-white/5 pt-6" id="operational-readiness">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-base font-semibold text-white">Operational readiness</h2><p className="mt-1 text-xs text-slate-500">Internal stage, ownership, cargo review, documents, dimensions, and tasks.</p></div>
        <span className="w-fit rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold uppercase text-blue-200">{data.shipment.operationalStage.replace(/_/g, " ")}</span>
      </div>

      <form action={updateAction} className="space-y-6">
        <fieldset className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" disabled={!canManage || Boolean(data.shipment.voidedAt)}>
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-400">Operational stage</span><select className={selectClass} defaultValue={data.shipment.operationalStage} name="operationalStage">{shipmentOperationalStages.map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}</select></label>
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-400">Owner</span><select className={selectClass} defaultValue={data.shipment.assignedTo ?? ""} name="assignedTo"><option value="">Unassigned</option>{data.staff.map((staff) => <option key={staff.id} value={staff.id}>{staff.fullName} / {staff.role}</option>)}</select></label>
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-400">Next action due (WIB)</span><Input defaultValue={toWibDateTimeLocalValue(data.shipment.actionDueAt)} name="actionDueAt" type="datetime-local" /></label>
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-400">Shipment SLA (WIB)</span><Input defaultValue={toWibDateTimeLocalValue(data.shipment.slaDueAt)} name="slaDueAt" type="datetime-local" /></label>
          <label className="space-y-2 md:col-span-2"><span className="text-xs font-semibold text-slate-400">Next action</span><Input defaultValue={data.shipment.nextAction ?? ""} maxLength={240} name="nextAction" placeholder="Specific next operational step" /></label>
          <label className="space-y-2 md:col-span-2"><span className="text-xs font-semibold text-slate-400">Blocker</span><Input defaultValue={data.shipment.blocker ?? ""} maxLength={500} name="blocker" placeholder="Leave blank when unblocked" /></label>
        </fieldset>

        <fieldset className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" disabled={!canManage || Boolean(data.shipment.voidedAt)}>
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-400">HS code</span><Input defaultValue={data.shipment.hsCode ?? ""} inputMode="numeric" maxLength={12} name="hsCode" /></label>
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-400">Incoterm</span><select className={selectClass} defaultValue={data.shipment.incoterm ?? ""} name="incoterm"><option value="">Not set</option>{incotermValues.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-400">Clearance coordination</span><select className={selectClass} defaultValue={data.shipment.clearanceMode ?? ""} name="clearanceMode"><option value="">Not set</option>{clearanceModeValues.map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}</select></label>
          <label className="space-y-2"><span className="text-xs font-semibold text-slate-400">Document readiness</span><select className={selectClass} defaultValue={data.shipment.documentReadiness} name="documentReadiness">{documentReadinessValues.map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}</select><span className="block text-[11px] text-slate-600">{data.currentDocumentCount} current document(s)</span></label>
          <div className="md:col-span-2 xl:col-span-4"><p className="mb-2 text-xs font-semibold text-slate-400">Cargo risk flags</p><div className="flex flex-wrap gap-2">{cargoRiskValues.map((value) => <label className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-slate-300" key={value}><input defaultChecked={risks.includes(value)} name="cargoRisks" type="checkbox" value={value} />{value.replace(/_/g, " ")}</label>)}</div></div>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input defaultChecked={data.shipment.regulatedCargo} name="regulatedCargo" type="checkbox" value="yes" />Regulated cargo</label>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input defaultChecked={data.shipment.customsReviewRequired} name="customsReviewRequired" type="checkbox" value="yes" />Customs review required</label>
        </fieldset>

        <fieldset disabled={!canManage || Boolean(data.shipment.voidedAt)}><div className="mb-3"><h3 className="text-sm font-semibold text-slate-200">Package dimensions</h3><p className="mt-1 text-xs text-slate-600">Centimeters; volumetric weight uses the 6000 divisor.</p></div><ShipmentPackageEditor initialRows={packageRows} /></fieldset>
        {canManage && !data.shipment.voidedAt ? <Button type="submit">Save readiness</Button> : null}
      </form>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-white/5">
          <div className="border-b border-white/5 px-4 py-3"><h3 className="text-sm font-semibold text-white">Internal tasks</h3></div>
          <div className="divide-y divide-white/5">
            {data.tasks.map((task) => {
              const completeAction = completeShipmentTask.bind(null, task.id, data.shipment.trackingNumber);
              return <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center" key={task.id}><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-200">{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.ownerName || "Unassigned"} / {task.dueAt ? formatWibDateTime(task.dueAt) : "No due time"}</p>{task.blocker ? <p className="mt-1 flex items-center gap-1 text-xs text-rose-300"><ShieldAlert className="h-3.5 w-3.5" />{task.blocker}</p> : null}</div><span className="w-fit rounded-md border border-white/10 px-2 py-1 text-[10px] uppercase text-slate-400">{task.status}</span>{canManage && task.status === "open" && !data.shipment.voidedAt ? <form action={completeAction}><ConfirmSubmitButton confirmLabel="Complete task" description={`Mark ${task.title} complete. The completion is recorded in the shipment audit trail.`} title="Complete this task?" variant="secondary"><CheckCircle2 className="mr-2 h-4 w-4" />Complete</ConfirmSubmitButton></form> : null}</div>;
            })}
            {data.tasks.length === 0 ? <p className="p-6 text-center text-sm text-slate-600">No internal tasks.</p> : null}
          </div>
        </div>

        {canManage && !data.shipment.voidedAt ? <form action={createTaskAction} className="space-y-3 rounded-lg border border-white/5 p-4"><div className="flex items-center gap-2"><ClipboardPlus className="h-4 w-4 text-blue-300" /><h3 className="text-sm font-semibold text-white">Add task</h3></div><Input maxLength={240} name="title" placeholder="Task title" required /><div className="grid gap-3 sm:grid-cols-2"><select className={selectClass} name="taskType"><option value="next_action">Next action</option><option value="document">Document</option><option value="customs">Customs</option><option value="movement">Movement</option><option value="last_mile">Last mile</option><option value="finance">Finance</option></select><select className={selectClass} name="ownerId"><option value="">Unassigned</option>{data.staff.map((staff) => <option key={staff.id} value={staff.id}>{staff.fullName}</option>)}</select></div><Input aria-label="Task due date and time in WIB" name="dueAt" required type="datetime-local" /><Input maxLength={500} name="taskBlocker" placeholder="Blocker, if any" /><Button type="submit" variant="secondary">Add task</Button></form> : null}
      </div>
    </section>
  );
}
