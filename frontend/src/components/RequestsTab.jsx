import React, { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Check, X, FileText } from "lucide-react";

const TYPES = [
  { value: "cuti_tahunan", label: "Cuti Tahunan" },
  { value: "cuti_penting", label: "Cuti Penting" },
  { value: "cuti_besar", label: "Cuti Besar" },
  { value: "sakit", label: "Sakit" },
  { value: "dinas_luar", label: "Dinas Luar" },
  { value: "diklat", label: "Diklat" },
  { value: "penugasan", label: "Penugasan" },
];

const STATUS_COLOR = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function RequestsTab({ mine = false }) {
  const { user } = useAuth();
  const [reqs, setReqs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "cuti_tahunan", start_date: "", end_date: "", reason: "" });

  const isAdmin = user.role === "admin" && !mine;

  const load = async () => {
    const { data } = await api.get("/requests", { params: mine ? { mine: true } : {} });
    setReqs(data);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      await api.post("/requests", form);
      toast.success("Pengajuan terkirim");
      setOpen(false); setForm({ type: "cuti_tahunan", start_date: "", end_date: "", reason: "" });
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const decide = async (id, action) => {
    try {
      const { data } = await api.post(`/requests/${id}/action`, { action });
      if (data.status === "rejected" && data.reason === "conflict") {
        toast.error(`Konflik minimum personil pada tanggal: ${data.conflict_dates.join(", ")}`);
      } else {
        toast.success(action === "approve" ? "Pengajuan disetujui & jadwal diperbarui" : "Pengajuan ditolak");
      }
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold">{isAdmin ? "Pengajuan Personil" : "Pengajuan Saya"}</h3>
          <p className="text-xs mono uppercase tracking-widest text-muted-foreground mt-1">{reqs.length} total</p>
        </div>
        {!isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="submit-leave-request-button" className="gap-2 glow-btn text-white" style={{ background: "var(--accent-hex)" }}>
                <Plus size={16} /> Ajukan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Pengajuan Baru</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs mono uppercase tracking-wider">Jenis</label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mono uppercase tracking-wider">Dari</label>
                    <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs mono uppercase tracking-wider">Sampai</label>
                    <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs mono uppercase tracking-wider">Alasan</label>
                  <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button onClick={submit} className="glow-btn text-white" style={{ background: "var(--accent-hex)" }}>Kirim</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {reqs.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            <FileText className="mx-auto mb-2 opacity-40" size={32} />
            Belum ada pengajuan.
          </Card>
        ) : reqs.map((r) => (
          <Card key={r.id} className="p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{r.user_name}</span>
                <span className="text-xs mono text-muted-foreground">{r.user_nik}</span>
                <Badge className={STATUS_COLOR[r.status]}>{r.status.toUpperCase()}</Badge>
              </div>
              <div className="text-sm mt-1">
                <span className="font-medium capitalize">{r.type.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground"> · {r.start_date} → {r.end_date}</span>
              </div>
              {r.reason && <div className="text-xs text-muted-foreground mt-1">&ldquo;{r.reason}&rdquo;</div>}
              {r.note && <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">Catatan: {r.note}</div>}
            </div>
            {isAdmin && r.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide(r.id, "approve")} className="gap-1 text-white" style={{ background: "var(--accent-hex)" }} data-testid="approve-leave-request-button">
                  <Check size={14} /> Setujui
                </Button>
                <Button size="sm" variant="outline" onClick={() => decide(r.id, "reject")} data-testid="reject-leave-request-button">
                  <X size={14} /> Tolak
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
