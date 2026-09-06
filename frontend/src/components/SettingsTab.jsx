import React, { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Upload as UploadIcon, Palette, CalendarPlus, Trash2, CalendarDays } from "lucide-react";
import { ID_HOLIDAYS } from "@/lib/holidays";
import { removeWhiteBackground } from "@/lib/image";

async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function SettingsTab() {
  const { settings, update, applyPrimary, holidays, refreshHolidays } = useSettings();
  const [form, setForm] = useState(settings);
  const [newHol, setNewHol] = useState({ date: "", name: "" });

  useEffect(() => { setForm(settings); }, [settings]);

  const save = async () => {
    try { await update(form); toast.success("Pengaturan disimpan"); }
    catch (e) { toast.error(e.message); }
  };

  const uploadImg = async (key, file) => {
    const raw = await fileToBase64(file);
    const b64 = key === "logo_base64" ? await removeWhiteBackground(raw) : raw;
    setForm((p) => ({ ...p, [key]: b64 }));
  };

  const addHoliday = async () => {
    if (!newHol.date || !newHol.name.trim()) { toast.error("Isi tanggal dan nama libur"); return; }
    try {
      await api.post("/holidays", newHol);
      toast.success(`Hari libur "${newHol.name}" ditambahkan`);
      setNewHol({ date: "", name: "" });
      refreshHolidays();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const removeHoliday = async (id, name) => {
    if (!confirm(`Hapus hari libur "${name}"?`)) return;
    try {
      await api.delete(`/holidays/${id}`);
      toast.success("Hari libur dihapus");
      refreshHolidays();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  // Preview built-in national holidays (grouped by year, filter to selected year)
  const currentYear = new Date().getFullYear();
  const [previewYear, setPreviewYear] = useState(currentYear);
  const nationalList = Object.entries(ID_HOLIDAYS)
    .filter(([d]) => d.startsWith(String(previewYear)))
    .sort();

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h3 className="font-display text-xl font-semibold">Pengaturan Situs</h3>
        <p className="text-xs mono uppercase tracking-widest text-muted-foreground mt-1">Judul, subjudul, logo, tanda tangan, warna aksen</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-4">
          <h4 className="font-display font-semibold">Konten</h4>
          <div>
            <label className="text-xs mono uppercase tracking-wider">Judul Halaman Login</label>
            <Input value={form.login_hero_title || ""} onChange={(e) => setForm({ ...form, login_hero_title: e.target.value })} placeholder="Aeronautical Communication Shift Rostering" />
          </div>
          <div>
            <label className="text-xs mono uppercase tracking-wider">Sub-judul Halaman Login</label>
            <Input value={form.login_hero_subtitle || ""} onChange={(e) => setForm({ ...form, login_hero_subtitle: e.target.value })} placeholder="Sistem Penjadwalan Shift Terpadu" />
          </div>
          <div>
            <label className="text-xs mono uppercase tracking-wider">Judul Header (Dashboard)</label>
            <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs mono uppercase tracking-wider">Sub-judul Header</label>
            <Input value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>
          <div>
            <label className="text-xs mono uppercase tracking-wider">Tulisan Utama</label>
            <Textarea rows={3} value={form.main_text || ""} onChange={(e) => setForm({ ...form, main_text: e.target.value })} />
          </div>
          <div>
            <label className="text-xs mono uppercase tracking-wider">Nama Penandatangan</label>
            <Input value={form.signature_name || ""} onChange={(e) => setForm({ ...form, signature_name: e.target.value })} />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h4 className="font-display font-semibold">Tampilan & Media</h4>
          <div>
            <label className="text-xs mono uppercase tracking-wider flex items-center gap-2"><Palette size={12} /> Warna Aksen Utama</label>
            <div className="flex gap-2 mt-2 items-center">
              <input
                type="color"
                data-testid="admin-color-picker-input"
                value={form.primary_color || "#008BFF"}
                onChange={(e) => { setForm({ ...form, primary_color: e.target.value }); applyPrimary(e.target.value); }}
                className="w-14 h-11 rounded border cursor-pointer"
              />
              <Input value={form.primary_color || ""} onChange={(e) => { setForm({ ...form, primary_color: e.target.value }); if (/^#[0-9A-F]{6}$/i.test(e.target.value)) applyPrimary(e.target.value); }} className="mono" />
            </div>
          </div>
          <div>
            <label className="text-xs mono uppercase tracking-wider">Logo</label>
            <div className="flex items-center gap-3 mt-2">
              {form.logo_base64 && <img src={form.logo_base64} alt="" className="w-16 h-16 rounded-lg object-contain bg-black p-1 border" />}
              <label className="inline-flex items-center gap-2 px-3 h-10 rounded-md border cursor-pointer text-sm hover:bg-accent">
                <UploadIcon size={14} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadImg("logo_base64", e.target.files[0])} />
              </label>
              {form.logo_base64 && <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, logo_base64: null })}>Hapus</Button>}
            </div>
          </div>
          <div>
            <label className="text-xs mono uppercase tracking-wider">Gambar Dashboard</label>
            <p className="text-[11px] text-muted-foreground mt-1">Gambar ini tampil di banner dashboard utama.</p>
            <div className="mt-2 space-y-2">
              {form.hero_image_base64 && (
                <img src={form.hero_image_base64} alt="Preview gambar dashboard" className="w-full h-28 rounded-lg object-contain bg-black border" />
              )}
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 h-10 rounded-md border cursor-pointer text-sm hover:bg-accent">
                  <UploadIcon size={14} /> Upload gambar
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadImg("hero_image_base64", e.target.files[0])} />
                </label>
                {form.hero_image_base64 && <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, hero_image_base64: null })}>Hapus</Button>}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs mono uppercase tracking-wider">Tanda Tangan</label>
            <div className="flex items-center gap-3 mt-2">
              {form.signature_base64 && <img src={form.signature_base64} alt="" className="h-16 rounded-lg object-contain bg-white p-1 border" />}
              <label className="inline-flex items-center gap-2 px-3 h-10 rounded-md border cursor-pointer text-sm hover:bg-accent">
                <UploadIcon size={14} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadImg("signature_base64", e.target.files[0])} />
              </label>
            </div>
          </div>
        </Card>
      </div>

      <Button onClick={save} className="gap-2 glow-btn text-white" style={{ background: "var(--accent-hex)" }} data-testid="save-settings-button">
        <Save size={16} /> Simpan Perubahan
      </Button>

      {/* Custom Holiday Editor */}
      <Card className="p-5 space-y-4" data-testid="holiday-editor-card">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} style={{ color: "var(--accent-hex)" }} />
          <div>
            <h4 className="font-display font-semibold">Editor Hari Libur Khusus</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tambahkan cuti bersama, ulang tahun perusahaan, atau libur lain — akan otomatis muncul sebagai penanda merah di tabel jadwal.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-[180px_1fr_auto] gap-3 items-end">
          <div>
            <label className="text-xs mono uppercase tracking-wider">Tanggal</label>
            <Input type="date" value={newHol.date} onChange={(e) => setNewHol({ ...newHol, date: e.target.value })} data-testid="holiday-date-input" />
          </div>
          <div>
            <label className="text-xs mono uppercase tracking-wider">Nama Libur</label>
            <Input placeholder="Cuti Bersama Idul Fitri" value={newHol.name} onChange={(e) => setNewHol({ ...newHol, name: e.target.value })} data-testid="holiday-name-input" />
          </div>
          <Button onClick={addHoliday} className="gap-2 glow-btn text-white h-10" style={{ background: "var(--accent-hex)" }} data-testid="add-holiday-button">
            <CalendarPlus size={16} /> Tambah
          </Button>
        </div>

        {holidays.length > 0 && (
          <div>
            <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground mb-2">Libur Kustom ({holidays.length})</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {holidays.map((h) => (
                <div key={h.id} className="flex items-center gap-2 p-3 rounded-lg border-2 bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900" data-testid={`holiday-item-${h.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] mono uppercase tracking-widest text-red-600 dark:text-red-400">
                      {new Date(h.date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div className="font-semibold text-sm truncate">{h.name}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeHoliday(h.id, h.name)} className="flex-shrink-0" data-testid={`delete-holiday-${h.id}`}>
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">Libur Nasional Bawaan ({nationalList.length})</div>
            <select
              className="text-xs mono px-2 py-1 rounded border bg-background"
              value={previewYear}
              onChange={(e) => setPreviewYear(Number(e.target.value))}
              data-testid="holiday-year-select"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-xs">
            {nationalList.map(([date, name]) => (
              <div key={date} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <span className="mono text-[10px] text-muted-foreground min-w-[68px]">{new Date(date + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span>
                <span className="truncate">{name}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            Libur nasional bawaan berdasarkan kalender Indonesia. Untuk override tanggal tertentu, tambahkan di daftar libur kustom di atas.
          </p>
        </div>
      </Card>
    </div>
  );
}
