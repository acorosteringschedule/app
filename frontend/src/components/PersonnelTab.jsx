import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, UserCog, FileSpreadsheet } from "lucide-react";

const empty = { nik: "", name: "", email: "", role: "personil", active: true };

export default function PersonnelTab() {
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [importing, setImporting] = useState(false);

  const load = async () => {
    const [u, p] = await Promise.all([
      api.get("/users"),
      api.get("/users/pending"),
    ]);
    setUsers(u.data);
    setPending(p.data);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditingId(null); setOpen(true); };
  const openEdit = (u) => { setForm({ nik: u.nik, name: u.name, email: u.email, role: u.role, active: u.active }); setEditingId(u.id); setOpen(true); };

  const importExcel = async (file) => {
    setImporting(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const seen = new Set();
      const records = rows.map((row) => {
        const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [
          key.toString().toLowerCase().replace(/[^a-z0-9]/g, ""), value,
        ]));
        const nik = String(normalized.nik || "").trim();
        const name = String(normalized.nama || normalized.namalengkap || normalized.name || "").trim();
        const email = String(normalized.email || "").trim();
        return { nik, name, email };
      }).filter((row) => row.nik || row.name);

      const valid = records.filter((row) => {
        if (!row.nik || !row.name || seen.has(row.nik)) return false;
        seen.add(row.nik);
        return true;
      });
      const skipped = records.length - valid.length;
      let success = 0;
      let failed = 0;
      for (const row of valid) {
        try {
          await api.post("/users", { ...row, role: "personil", active: true });
          success += 1;
        } catch {
          failed += 1;
        }
      }
      await load();
      toast.success(`Import selesai: ${success} berhasil, ${failed + skipped} dilewati/gagal`);
    } catch (e) {
      toast.error(`File Excel tidak dapat dibaca: ${formatApiError(e)}`);
    } finally {
      setImporting(false);
    }
  };

  const submit = async () => {
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, form);
        toast.success("Personil diperbarui");
      } else {
        await api.post("/users", form);
        toast.success(`Personil ditambahkan (password default: ${form.nik})`);
      }
      setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const del = async (u) => {
    if (!confirm(`Hapus ${u.name}?`)) return;
    try { await api.delete(`/users/${u.id}`); toast.success("Terhapus"); load(); }
    catch (e) { toast.error(formatApiError(e)); }
  };

  const decide = async (uid, action) => {
    try { await api.post(`/users/${uid}/approve`, { action }); toast.success(action === "approve" ? "Disetujui" : "Ditolak"); load(); }
    catch (e) { toast.error(formatApiError(e)); }
  };

  return (
    <div className="space-y-6 fade-in">
      {pending.length > 0 && (
        <Card className="p-5 border-2" style={{ borderColor: "var(--accent-hex)" }}>
          <div className="flex items-center gap-2 mb-3">
            <UserCog size={16} style={{ color: "var(--accent-hex)" }} />
            <h3 className="font-display font-semibold">Menunggu Persetujuan ({pending.length})</h3>
          </div>
          <div className="space-y-2">
            {pending.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/40">
                <div className="flex-1">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs mono text-muted-foreground">{u.nik} · {u.email}</div>
                </div>
                <Button size="sm" onClick={() => decide(u.id, "approve")} className="gap-1 text-white" style={{ background: "var(--accent-hex)" }} data-testid={`approve-user-${u.id}`}>
                  <CheckCircle2 size={14} /> Setujui
                </Button>
                <Button size="sm" variant="outline" onClick={() => decide(u.id, "reject")} data-testid={`reject-user-${u.id}`}>
                  <XCircle size={14} /> Tolak
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold">Daftar Personil</h3>
          <p className="text-xs mono uppercase tracking-widest text-muted-foreground mt-1">{users.length} orang · seret di tab jadwal untuk mengubah urutan</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 h-10 rounded-md border cursor-pointer text-sm hover:bg-accent">
            <FileSpreadsheet size={16} /> {importing ? "Mengimpor..." : "Import Excel"}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={importing}
              onChange={(e) => { if (e.target.files[0]) importExcel(e.target.files[0]); e.target.value = ""; }}
            />
          </label>
          <Button onClick={openNew} className="gap-2 glow-btn text-white" style={{ background: "var(--accent-hex)" }} data-testid="add-personnel-button">
            <Plus size={16} /> Tambah Personil
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Format Excel: kolom <span className="mono">NIK</span> dan <span className="mono">Nama</span> wajib; <span className="mono">Email</span> opsional. Password awal personil sama dengan NIK.</p>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">NIK</th>
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className="border-b hover:bg-accent/30">
                <td className="px-4 py-3 mono">{i + 1}</td>
                <td className="px-4 py-3 mono">{u.nik}</td>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.active ? "default" : "secondary"} style={u.active ? { background: "var(--accent-hex)" } : {}}>
                    {u.active ? "Aktif" : "Non-aktif"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(u)}><Pencil size={14} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del(u)}><Trash2 size={14} className="text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="6" className="text-center p-8 text-muted-foreground">Belum ada personil. Klik "Tambah Personil".</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Personil" : "Tambah Personil"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs mono uppercase tracking-wider">NIK</label>
              <Input value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} className="mono" />
            </div>
            <div>
              <label className="text-xs mono uppercase tracking-wider">Nama</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs mono uppercase tracking-wider">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            {!editingId && <p className="text-xs text-muted-foreground">Password default akan sama dengan NIK. Personil bisa mengubahnya nanti.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={submit} className="glow-btn text-white" style={{ background: "var(--accent-hex)" }}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
