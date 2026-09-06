import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, LogOut, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

export default function AppHeader({ activeTab, onTab }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [notes, setNotes] = useState([]);
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));
  const [permission, setPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "denied");
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
    : ["jadwal", "kalender-saya", "pengajuan-saya"];

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
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center gap-4">
        <div className="flex items-center gap-3">
          {settings.logo_base64 ? (
            <img src={settings.logo_base64} alt="" className="w-9 h-9 rounded-lg object-contain bg-white p-0.5" />
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

        <div className="ml-auto flex items-center gap-2">
          {permission !== "granted" && (
            <Button variant="outline" size="sm" onClick={requestPushPermission} className="gap-1.5" data-testid="enable-push-button">
              <BellRing size={14} /> <span className="hidden sm:inline text-xs">Aktifkan Push</span>
            </Button>
          )}

          <Popover onOpenChange={(o) => o && unread && markRead()}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="notification-bell-button" className="relative">
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

          <Button variant="ghost" size="icon" data-testid="theme-toggle-button" onClick={toggleTheme}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          <div className="hidden sm:flex items-center gap-3 pl-3 border-l">
            <div className="text-right leading-tight">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">{user.nik} · {user.role}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { logout(); toast.info("Anda telah keluar"); }} data-testid="logout-button">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="md:hidden overflow-x-auto border-t px-4 py-2 flex gap-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => onTab(t)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium ${activeTab === t ? "text-white" : "bg-muted text-muted-foreground"}`} style={activeTab === t ? { background: "var(--accent-hex)" } : {}}>
            {tabLabels[t]}
          </button>
        ))}
      </div>
    </header>
  );
}
