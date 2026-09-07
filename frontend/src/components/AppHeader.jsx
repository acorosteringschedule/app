import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, KeyRound, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { toast } from "sonner";

export default function AppHeader({ activeTab, onTab }) {
  const { user, logout, refreshMe } = useAuth();
  const { settings } = useSettings();
  const [notes, setNotes] = useState([]);
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));
  const [permission, setPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "denied");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user.name || "", current_password: "", new_password: "", confirm_password: "" });
  const seenIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  const fetchNotes = async () => {
    try {
      const { data } = await api.get("/notifications");
      // On first load, mark all as "seen" to avoid spamming past notifications
      if (!initializedRef.current) {
        data.forEach((n) => seenIdsRef.current.add(n.id));
        initializedRef.current = true;
      } else {
        // Fire browser notifications for new unread items
        const fresh = data.filter((n) => !seenIdsRef.current.has(n.id) && !n.read);
        for (const n of fresh) {
          seenIdsRef.current.add(n.id);
          fireBrowserNotification(n);
        }
        data.forEach((n) => seenIdsRef.current.add(n.id));
      }
      setNotes(data);
    } catch { /* ignore */ }
  };

  const fireBrowserNotification = (n) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      const notif = new Notification(settings.title || "ACO Shift Scheduler", {
        body: n.message,
        icon: settings.logo_base64 || undefined,
        tag: n.id,
        badge: settings.logo_base64 || undefined,
      });
      notif.onclick = () => { window.focus(); notif.close(); };
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    fetchNotes();
    const iv = setInterval(fetchNotes, 15000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestPushPermission = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Browser Anda tidak mendukung notifikasi push");
      return;
    }
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
      if (p === "granted") {
        toast.success("Notifikasi browser diaktifkan");
        new Notification(settings.title || "ACO Shift Scheduler", {
          body: "Notifikasi push berhasil diaktifkan. Anda akan menerima pemberitahuan realtime.",
          icon: settings.logo_base64 || undefined,
        });
      } else {
        toast.info("Notifikasi tidak diaktifkan");
      }
    } catch (e) {
      toast.error("Gagal mengaktifkan notifikasi");
    }
  };

  const unread = notes.filter((n) => !n.read).length;

  const changePassword = async () => {
    setPasswordSaving(true);
    try {
      await api.post("/auth/change-password", passwordForm);
      toast.success("Password berhasil diubah");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordOpen(false);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setPasswordSaving(false);
    }
  };

  const updateProfile = async () => {
    setPasswordSaving(true);
    try {
      await api.put("/auth/profile", profileForm);
      await refreshMe();
      toast.success("Profil admin berhasil diperbarui");
      setProfileForm({ name: profileForm.name, current_password: "", new_password: "", confirm_password: "" });
      setProfileOpen(false);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setPasswordSaving(false);
    }
  };

  const markRead = async () => {
    await api.post("/notifications/read-all");
    fetchNotes();
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("aco_theme", next ? "dark" : "light");
  };

  const tabs = user.role === "admin"
    ? ["dashboard", "jadwal", "personil", "pengajuan", "ringkasan", "riwayat", "pengaturan"]
    : ["dashboard", "jadwal", "kalender-saya", "pengajuan-saya", "ringkasan"];

  const tabLabels = {
    dashboard: "Dashboard",
    jadwal: "Jadwal Shift",
    personil: "Personil",
    pengajuan: "Pengajuan",
    "pengajuan-saya": "Pengajuan Saya",
    "kalender-saya": "Kalender Saya",
    ringkasan: "Ringkasan Bulanan",
    riwayat: "Riwayat",
    pengaturan: "Pengaturan",
  };

  return (
    <header className="sticky top-0 z-30 border-b glass bg-background/80">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-6 min-h-[64px] flex items-center gap-2 sm:gap-4 py-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          {settings.logo_base64 ? (
            <img src={settings.logo_base64} alt="" className="w-9 h-9 rounded-lg object-contain bg-black p-0.5" />
          ) : (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--accent-hex)" }}>A</div>
          )}
          <div className="hidden sm:block">
            <div className="font-display font-semibold leading-tight">{settings.title || "ACO Shift Scheduler"}</div>
            <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">aco-shiftscheduler.com</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 ml-8 flex-1">
          {tabs.map((t) => (
            <button
              key={t}
              data-testid={`tab-${t}`}
              onClick={() => onTab(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === t ? "text-white" : "hover:bg-muted text-muted-foreground"}`}
              style={activeTab === t ? { background: "var(--accent-hex)" } : {}}
            >
              {tabLabels[t]}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
          {permission !== "granted" && (
            <Button variant="outline" size="sm" onClick={requestPushPermission} className="gap-1.5 hidden sm:flex" data-testid="enable-push-button">
              <BellRing size={14} /> <span className="text-xs">Aktifkan Push</span>
            </Button>
          )}

          <Popover onOpenChange={(o) => o && unread && markRead()}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="notification-bell-button" className="relative min-w-10 min-h-10">
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1" style={{ background: "var(--accent-hex)" }}>
                    {unread}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0" data-testid="notification-dropdown-menu">
              <div className="p-3 border-b font-semibold text-sm flex justify-between">
                <span>Notifikasi</span>
                <Badge variant="outline" className="mono text-[10px]">{notes.length}</Badge>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notes.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">Belum ada notifikasi</div>
                ) : notes.map((n) => (
                  <div key={n.id} className={`p-3 border-b text-sm ${!n.read ? "bg-accent/40" : ""}`}>
                    <div className="text-foreground">{n.message}</div>
                    <div className="text-[10px] mono text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("id-ID")}</div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" data-testid="theme-toggle-button" className="min-w-10 min-h-10" onClick={toggleTheme}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l min-w-0">
            <div className="hidden sm:block text-right leading-tight min-w-0">
              <div className="text-sm font-semibold truncate max-w-[110px]">{user.name}</div>
              <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground truncate">{user.nik} · {user.role}</div>
            </div>
            {user.role === "admin" && (
              <Button variant="ghost" size="icon" onClick={() => setProfileOpen(true)} title="Ubah profil admin" data-testid="admin-profile-button">
                <UserRound size={16} />
              </Button>
            )}
            {user.role === "personil" && (
              <Button variant="ghost" size="icon" className="min-w-10 min-h-10" onClick={() => setPasswordOpen(true)} title="Ubah password" data-testid="change-password-button">
                <KeyRound size={16} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="min-w-10 min-h-10" onClick={() => { logout(); toast.info("Anda telah keluar"); }} data-testid="logout-button">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="md:hidden border-t px-2 py-2 overflow-x-auto">
        <div className="flex min-w-max gap-1.5">
          {tabs.map((t) => (
            <button key={t} onClick={() => onTab(t)} className={`whitespace-nowrap px-2.5 py-1.5 rounded-full text-[11px] font-medium ${activeTab === t ? "text-white" : "bg-muted text-muted-foreground"}`} style={activeTab === t ? { background: "var(--accent-hex)" } : {}}>
              {tabLabels[t]}
            </button>
          ))}
        </div>
      </div>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ubah Password</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs mono uppercase tracking-wider">Password Lama</label>
              <Input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
            </div>
            <div>
              <label className="text-xs mono uppercase tracking-wider">Password Baru</label>
              <Input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
            </div>
            <div>
              <label className="text-xs mono uppercase tracking-wider">Konfirmasi Password Baru</label>
              <Input type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">Password baru minimal 6 karakter.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>Batal</Button>
            <Button onClick={changePassword} disabled={passwordSaving} className="text-white" style={{ background: "var(--accent-hex)" }}>{passwordSaving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Profil Admin</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs mono uppercase tracking-wider">Nama Akun</label>
              <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} data-testid="admin-name-input" />
            </div>
            <div className="pt-2 border-t">
              <label className="text-xs mono uppercase tracking-wider">Password Lama</label>
              <Input type="password" value={profileForm.current_password} onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })} data-testid="admin-current-password-input" />
            </div>
            <div>
              <label className="text-xs mono uppercase tracking-wider">Password Baru</label>
              <Input type="password" value={profileForm.new_password} onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })} data-testid="admin-new-password-input" />
            </div>
            <div>
              <label className="text-xs mono uppercase tracking-wider">Konfirmasi Password Baru</label>
              <Input type="password" value={profileForm.confirm_password} onChange={(e) => setProfileForm({ ...profileForm, confirm_password: e.target.value })} data-testid="admin-confirm-password-input" />
            </div>
            <p className="text-xs text-muted-foreground">Isi bagian password hanya jika ingin menggantinya. Password baru minimal 6 karakter.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>Batal</Button>
            <Button onClick={updateProfile} disabled={passwordSaving} className="text-white" style={{ background: "var(--accent-hex)" }}>{passwordSaving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
