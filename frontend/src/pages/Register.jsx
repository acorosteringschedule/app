import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

export default function Register() {
  const { settings } = useSettings();
  const nav = useNavigate();
  const [form, setForm] = useState({ nik: "", name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/register", form);
      toast.success("Pendaftaran berhasil! Menunggu persetujuan admin.");
      nav("/login");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center p-6">
      <div className="absolute inset-0 grid-overlay opacity-70" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full blur-3xl opacity-25" style={{ background: "var(--accent-hex)" }} />
      <Card className="relative z-10 w-full max-w-md p-8 border-2 shadow-2xl glass bg-card/95 fade-in">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={22} style={{ color: "var(--accent-hex)" }} />
          <div className="text-xs mono uppercase tracking-[0.25em] text-muted-foreground">// Daftar akun</div>
        </div>
        <h1 className="font-display text-2xl font-semibold">Buat Akun Personil</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Akun baru harus disetujui admin sebelum bisa login.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-xs mono uppercase tracking-wider">NIK</Label>
            <Input data-testid="register-nik-input" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} className="mt-1 mono h-11" required />
          </div>
          <div>
            <Label className="text-xs mono uppercase tracking-wider">Nama Lengkap</Label>
            <Input data-testid="register-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-11" required />
          </div>
          <div>
            <Label className="text-xs mono uppercase tracking-wider">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-11" required />
          </div>
          <div>
            <Label className="text-xs mono uppercase tracking-wider">Password</Label>
            <Input data-testid="register-password-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 h-11" required />
          </div>
          <Button data-testid="register-submit-button" type="submit" disabled={busy} className="w-full h-11 glow-btn font-semibold" style={{ background: "var(--accent-hex)" }}>
            {busy ? <Loader2 className="animate-spin" size={18} /> : "Daftar"}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: "var(--accent-hex)" }}>Masuk</Link>
        </div>
      </Card>
    </div>
  );
}
