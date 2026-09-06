import React, { useEffect, useState, useMemo, useCallback } from "react";
import { api, formatApiError, API_BASE } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Sparkles, Upload, AlertTriangle, GripVertical } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SHIFT_OPTIONS = [
  { value: "", label: "-" },
  { value: "pagi", label: "Pagi" },
  { value: "siang", label: "Siang" },
  { value: "malam", label: "Malam" },
  { value: "off", label: "Libur" },
  { value: "cuti", label: "Cuti" },
  { value: "sakit", label: "Sakit" },
  { value: "dinas_luar", label: "Dinas Luar" },
  { value: "diklat", label: "Diklat" },
  { value: "penugasan", label: "Penugasan" },
];
const LABEL = { pagi: "P", siang: "S", malam: "M", off: "L", cuti: "C", sakit: "SK", dinas_luar: "DL", diklat: "DK", penugasan: "PN" };
const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

function ShiftCell({ value, onChange, editable }) {
  const cls = value ? `shift-${value}` : "";
  if (!editable) {
    return <div className={`shift-cell w-10 h-9 flex items-center justify-center text-xs font-bold rounded ${cls}`}>{LABEL[value] || ""}</div>;
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`shift-cell w-10 h-9 flex items-center justify-center text-xs font-bold rounded ${cls}`}>{LABEL[value] || "·"}</button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start">
        <div className="grid grid-cols-2 gap-1">
          {SHIFT_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => onChange(o.value)} className={`text-xs px-2 py-1.5 rounded hover:bg-accent text-left ${o.value === value ? "font-bold ring-1 ring-primary" : ""}`}>
              {o.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <tr ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} className="border-b hover:bg-accent/30">
      {typeof children === "function" ? children({ attributes, listeners }) : children}
    </tr>
  );
}

export default function ShiftScheduleTab() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState({});
  const [openAuto, setOpenAuto] = useState(false);
  const [pattern, setPattern] = useState("3-2");

  const isAdmin = user.role === "admin";
  const nDays = daysInMonth(year, month);

  const load = useCallback(async () => {
    const [uRes, sRes] = await Promise.all([
      api.get("/users"),
      api.get("/shifts", { params: { year, month } }),
    ]);
    setUsers(uRes.data);
    const map = {};
    for (const s of sRes.data.shifts) map[`${s.user_id}_${s.date}`] = s.shift;
    setShifts(map);
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  // Coverage checker
  const coverage = useMemo(() => {
    const cov = {};
    for (let d = 1; d <= nDays; d++) {
      const date = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      let p = 0, s = 0, m = 0;
      for (const u of users) {
        const v = shifts[`${u.id}_${date}`];
        if (v === "pagi") p++;
        else if (v === "siang") s++;
        else if (v === "malam") m++;
      }
      cov[d] = { p, s, m, deficient: p < 2 || s < 2 || m < 1 };
    }
    return cov;
  }, [users, shifts, year, month, nDays]);

  const setCell = async (uid, date, shift) => {
    if (!isAdmin) return;
    try {
      await api.post("/shifts/cell", { user_id: uid, date, shift });
      setShifts((prev) => ({ ...prev, [`${uid}_${date}`]: shift }));
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const onDragEnd = async (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !isAdmin) return;
    const oldIndex = users.findIndex((u) => u.id === active.id);
    const newIndex = users.findIndex((u) => u.id === over.id);
    const reordered = arrayMove(users, oldIndex, newIndex);
    setUsers(reordered);
    try {
      await api.post("/users/reorder", reordered.map((u) => u.id));
      toast.success("Urutan personil diperbarui");
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const autoGenerate = async () => {
    try {
      const { data } = await api.post("/shifts/auto-generate", { year, month, pattern });
      toast.success(`Berhasil generate ${data.cells} sel`);
      setOpenAuto(false);
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const onImport = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const token = localStorage.getItem("aco_token");
      const res = await fetch(`${API_BASE}/shifts/import-excel?year=${year}&month=${month}`, {
        method: "POST", body: fd, headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.detail || "Import gagal");
      toast.success(`Import berhasil: ${j.imported} sel`);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const downloadExport = async (kind) => {
    try {
      const token = localStorage.getItem("aco_token");
      const res = await fetch(`${API_BASE}/exports/${kind}?year=${year}&month=${month}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Export gagal");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `jadwal_${year}_${String(month).padStart(2,"0")}.${kind === "pdf" ? "pdf" : "xlsx"}`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4 fade-in" data-testid="shift-schedule-tab">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>{[now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>

        {isAdmin && (
          <>
            <Button onClick={() => setOpenAuto(true)} className="gap-2 glow-btn text-white" style={{ background: "var(--accent-hex)" }} data-testid="auto-generate-shift-button">
              <Sparkles size={16} /> Auto-Generate
            </Button>
            <label className="inline-flex items-center gap-2 px-3 h-9 rounded-md border cursor-pointer text-sm hover:bg-accent">
              <Upload size={14} /> Import Excel
              <input type="file" accept=".xlsx,.xls" className="hidden" data-testid="excel-import-file-input" onChange={(e) => e.target.files[0] && onImport(e.target.files[0])} />
            </label>
          </>
        )}
        <Button variant="outline" className="gap-2" onClick={() => downloadExport("xlsx")} data-testid="excel-export-button"><FileSpreadsheet size={14} /> XLSX</Button>
        <Button variant="outline" className="gap-2" onClick={() => downloadExport("pdf")} data-testid="pdf-export-button"><Download size={14} /> PDF</Button>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto max-w-full" data-testid="shift-schedule-grid-table">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <table className="text-xs w-max">
            <thead>
              <tr className="border-b bg-muted/40">
                {isAdmin && <th className="w-8 sticky-col" />}
                <th className="px-3 py-2 text-left sticky-col font-semibold" style={{ left: isAdmin ? 32 : 0 }}>Nama Personil</th>
                {Array.from({ length: nDays }, (_, i) => i + 1).map((d) => {
                  const dow = new Date(year, month - 1, d).getDay();
                  const isWeekend = dow === 0 || dow === 6;
                  return <th key={d} className={`w-10 px-1 py-2 text-center font-mono text-[10px] ${isWeekend ? "text-red-500" : ""}`}>{d}</th>;
                })}
              </tr>
            </thead>
            <SortableContext items={users.map((u) => u.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {users.map((u) => (
                  <SortableRow key={u.id} id={u.id}>
                    {({ attributes, listeners }) => (
                      <>
                        {isAdmin && (
                          <td className="w-8 sticky-col text-center align-middle">
                            <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground p-1"><GripVertical size={14} /></button>
                          </td>
                        )}
                        <td className="px-3 py-1.5 sticky-col whitespace-nowrap" style={{ left: isAdmin ? 32 : 0 }}>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-[10px] mono text-muted-foreground">{u.nik}</div>
                        </td>
                        {Array.from({ length: nDays }, (_, i) => i + 1).map((d) => {
                          const date = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                          return (
                            <td key={d} className="p-0.5 text-center">
                              <ShiftCell value={shifts[`${u.id}_${date}`]} onChange={(v) => setCell(u.id, date, v)} editable={isAdmin} />
                            </td>
                          );
                        })}
                      </>
                    )}
                  </SortableRow>
                ))}
                <tr className="border-t bg-muted/20">
                  {isAdmin && <td className="sticky-col" />}
                  <td className="px-3 py-2 sticky-col text-[10px] mono uppercase tracking-widest text-muted-foreground" style={{ left: isAdmin ? 32 : 0 }}>Cakupan</td>
                  {Array.from({ length: nDays }, (_, i) => i + 1).map((d) => {
                    const c = coverage[d];
                    return (
                      <td key={d} className="text-center">
                        {c.deficient ? (
                          <div title={`Pagi: ${c.p}, Siang: ${c.s}, Malam: ${c.m}`} className="inline-flex items-center justify-center w-8 h-6 rounded bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                            <AlertTriangle size={12} />
                          </div>
                        ) : (
                          <div className="text-[10px] mono text-emerald-600 dark:text-emerald-400">OK</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] mono uppercase tracking-wider">
        {[["pagi","P Pagi 07-13"],["siang","S Siang 13-19"],["malam","M Malam 19-07"],["off","L Libur"],["cuti","C Cuti"],["sakit","SK Sakit"],["dinas_luar","DL Dinas Luar"],["diklat","DK Diklat"],["penugasan","PN Penugasan"]].map(([k,l]) => (
          <span key={k} className={`px-2 py-1 rounded shift-${k}`}>{l}</span>
        ))}
      </div>

      <Dialog open={openAuto} onOpenChange={setOpenAuto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Auto-Generate Jadwal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Pilih pola shift untuk periode <b>{MONTHS[month-1]} {year}</b>. Setelah generate, Anda tetap bisa mengedit setiap sel secara manual.</p>
            <div>
              <label className="text-xs mono uppercase tracking-wider">Pola</label>
              <Select value={pattern} onValueChange={setPattern}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3-2">3 hari kerja → 2 libur (Pagi/Siang/Malam)</SelectItem>
                  <SelectItem value="3-3">3 hari kerja → 3 libur</SelectItem>
                  <SelectItem value="2-2">2 hari kerja → 2 libur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAuto(false)}>Batal</Button>
            <Button onClick={autoGenerate} className="glow-btn text-white" style={{ background: "var(--accent-hex)" }}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
