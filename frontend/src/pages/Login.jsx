import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";

export default function Login() {
  const { user, login } = useAuth();
  const { settings } = useSettings();
  const nav = useNavigate();
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav("/dashboard", { replace: true });
  }, [user, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await login(nik.trim(), password);
    setBusy(false);
    if (r.ok) {
      toast.success("Login berhasil");
      nav("/dashboard");
    } else {
      toast.error(r.error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 grid-overlay opacity-70" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30" style={{ background: "var(--accent-hex)" }} />
      <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-20" style={{ background: "var(--accent-hex)" }} />

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        <div className="flex-1 flex items-center justify-start px-6 lg:px-24 py-16">
          <div className="max-w-lg fade-in">
            <div className="flex items-center gap-3 mb-8">
              {settings.logo_base64 ? (
                <img src={settings.logo_base64} alt="Logo" className="w-14 h-14 object-contain rounded-xl bg-black p-1 shadow" />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ background: "var(--accent-hex)" }}>A</div>
              )}
              <div>
                <div className="text-xs mono uppercase tracking-[0.25em] text-muted-foreground">aco-shiftscheduler.com</div>
                <div className="font-display font-bold text-lg">{settings.title || "ACO Shift Scheduler"}</div>
              </div>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              {settings.login_hero_title || "Aeronautical Communication Shift Rostering"}
            </h1>
            <p className="mt-6 text-muted-foreground text-base max-w-md leading-relaxed">
              {settings.login_hero_subtitle || settings.subtitle || "Sistem Penjadwalan Shift Terpadu"}
            </p>
            <p className="mt-4 text-sm text-muted-foreground max-w-md">
              {settings.main_text}
            </p>
            <div className="mt-10 flex items-center gap-2 text-xs mono uppercase tracking-widest text-muted-foreground">
              <ShieldCheck size={16} style={{ color: "var(--accent-hex)" }} />
              <span>Autentikasi NIK · Enkripsi bcrypt · JWT</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-16 lg:pb-0">
          <Card className="w-full max-w-md p-8 border-2 shadow-2xl glass bg-card/95">
            <div className="mb-6">
              <div className="text-xs mono uppercase tracking-[0.25em] text-muted-foreground mb-2">// Masuk sistem</div>
              <h2 className="font-display text-2xl font-semibold">Selamat datang kembali</h2>
              <p className="text-sm text-muted-foreground mt-1">Gunakan NIK dan password Anda</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label className="text-xs mono uppercase tracking-wider">NIK</Label>
                <Input data-testid="login-nik-input" value={nik} onChange={(e) => setNik(e.target.value)} placeholder="ADMIN001" className="mt-1 mono h-11" autoFocus required />
              </div>
              <div>
                <Label className="text-xs mono uppercase tracking-wider">Password</Label>
                <div className="relative mt-1">
                  <Input data-testid="login-password-input" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 pr-10" required />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button data-testid="login-submit-button" type="submit" disabled={busy} className="w-full h-11 glow-btn font-semibold" style={{ background: "var(--accent-hex)" }}>
                {busy ? <Loader2 className="animate-spin" size={18} /> : "Masuk"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link data-testid="login-register-link" to="/register" className="font-semibold hover:underline" style={{ color: "var(--accent-hex)" }}>
                Daftar di sini
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
