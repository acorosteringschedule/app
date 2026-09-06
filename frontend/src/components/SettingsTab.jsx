import React, { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Upload as UploadIcon, Palette } from "lucide-react";

async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function SettingsTab() {
  const { settings, update, applyPrimary } = useSettings();
  const [form, setForm] = useState(settings);

  useEffect(() => { setForm(settings); }, [settings]);

  const save = async () => {
    try { await update(form); toast.success("Pengaturan disimpan"); }
    catch (e) { toast.error(e.message); }
  };

  const uploadImg = async (key, file) => {
    const b64 = await fileToBase64(file);
    setForm((p) => ({ ...p, [key]: b64 }));
  };

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
            <label className="text-xs mono uppercase tracking-wider">Judul</label>
            <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs mono uppercase tracking-wider">Sub-judul</label>
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
              {form.logo_base64 && <img src={form.logo_base64} alt="" className="w-16 h-16 rounded-lg object-contain bg-white p-1 border" />}
              <label className="inline-flex items-center gap-2 px-3 h-10 rounded-md border cursor-pointer text-sm hover:bg-accent">
                <UploadIcon size={14} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadImg("logo_base64", e.target.files[0])} />
              </label>
              {form.logo_base64 && <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, logo_base64: null })}>Hapus</Button>}
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
    </div>
  );
}
