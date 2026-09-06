import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Card } from "@/components/ui/card";
import { Users, ClipboardList, CheckCircle2, ShieldCheck, Sunrise, Sunset, Moon as MoonIcon, Coffee, Sparkles, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

const SHIFT_TIME = { pagi: "07:00 – 13:00", siang: "13:00 – 19:00", malam: "19:00 – 07:00" };

function StatCard({ label, value, icon: Icon, tone = "default", subtitle }) {
  const tones = {
    default: { border: "border-l-transparent", iconBg: "bg-muted", iconColor: "text-muted-foreground" },
    warn: { border: "", iconBg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400" },
    ok: { border: "", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    accent: { border: "", iconBg: "", iconColor: "text-white" },
  };
  const t = tones[tone] || tones.default;
  return (
    <Card className="p-5 flex items-start justify-between gap-3 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="font-display text-3xl sm:text-4xl font-bold mt-2 truncate">{value}</div>
        {subtitle && <div className="text-[11px] mono text-muted-foreground mt-1 truncate">{subtitle}</div>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.iconBg}`} style={tone === "accent" ? { background: "var(--accent-hex)" } : {}}>
        <Icon size={18} className={t.iconColor} />
      </div>
    </Card>
  );
}

function ShiftMiniCard({ label, count, icon: Icon, color, timeRange }) {
  return (
    <div className="rounded-lg border p-4 flex flex-col gap-2 relative overflow-hidden hover:shadow-md transition-shadow" style={{ background: `${color}10` }}>
      <div className="absolute top-3 right-3 opacity-25"><Icon size={28} style={{ color }} /></div>
      <div className="flex items-center gap-1.5 text-[10px] mono uppercase tracking-widest font-semibold" style={{ color }}>
        <Icon size={12} /> {label}
      </div>
      <div className="font-display text-4xl font-bold">{count}</div>
      {timeRange && <div className="text-[10px] mono text-muted-foreground">{timeRange}</div>}
    </div>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [stats, setStats] = useState(null);
  const [workload, setWorkload] = useState([]);

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    api.get("/dashboard/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/summary", { params: { year: y, month: m } }).then((r) => {
      const rows = (r.data.summary || []).map((s) => ({
        name: s.name.length > 14 ? s.name.slice(0, 12) + "…" : s.name,
        fullName: s.name,
        nik: s.nik,
        jam: s.total_hours,
        pagi: s.counts.pagi,
        siang: s.counts.siang,
        malam: s.counts.malam,
      })).sort((a, b) => b.jam - a.jam);
      setWorkload(rows);
    }).catch(() => {});
  }, []);

  const today = new Date();
  const todayLabel = today.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase();

  return (
    <div className="space-y-6 fade-in">
      {/* Hero banner */}
      <Card className="relative overflow-hidden border-2 p-0 min-h-[220px] sm:min-h-[280px] lg:min-h-[320px] bg-black" style={{ background: "#000000" }}>
        {settings.hero_image_base64 && (
          <img
            src={settings.hero_image_base64}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
        <div className="absolute inset-0 grid-overlay opacity-30" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-30" style={{ background: "var(--accent-hex)" }} />
        <div className="relative z-10 flex min-h-[220px] sm:min-h-[280px] lg:min-h-[320px] items-center p-6 sm:p-8 lg:p-10">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-[10px] mono uppercase tracking-[0.3em] text-white/70 mb-3">
              <Sparkles size={12} style={{ color: "var(--accent-hex)" }} /> {todayLabel}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
              {settings.title || "ACO Shift Scheduler"}
            </h1>
            {settings.subtitle && <p className="mt-3 text-white/70 text-sm sm:text-base max-w-2xl">{settings.subtitle}</p>}
          </div>
        </div>
      </Card>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Personil"
          value={stats?.total_personnel ?? "—"}
          icon={Users}
          tone="accent"
        />
        <StatCard
          label="Pengajuan Menunggu"
          value={stats?.pending_requests ?? "—"}
          icon={ClipboardList}
          tone="warn"
        />
        <StatCard
          label="Disetujui Bulan Ini"
          value={stats?.approved_this_month ?? "—"}
          icon={CheckCircle2}
          tone="ok"
        />
        <StatCard
          label="Role Anda"
          value={user.role.toUpperCase()}
          icon={ShieldCheck}
          subtitle={`NIK: ${user.nik}`}
        />
      </div>

      {/* Today's shift distribution */}
      <Card className="p-6">
        <div className="mb-5">
          <h3 className="font-display text-xl font-semibold">Distribusi Shift Hari Ini</h3>
          <p className="text-xs text-muted-foreground mt-1">Ringkasan jumlah personil per shift untuk tanggal hari ini.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="today-shift-distribution">
          <ShiftMiniCard
            label="Shift Pagi"
            count={stats?.today_distribution?.pagi ?? 0}
            icon={Sunrise}
            color="#0EA5E9"
            timeRange={SHIFT_TIME.pagi}
          />
          <ShiftMiniCard
            label="Shift Siang"
            count={stats?.today_distribution?.siang ?? 0}
            icon={Sunset}
            color="#F59E0B"
            timeRange={SHIFT_TIME.siang}
          />
          <ShiftMiniCard
            label="Shift Malam"
            count={stats?.today_distribution?.malam ?? 0}
            icon={MoonIcon}
            color="#8B5CF6"
            timeRange={SHIFT_TIME.malam}
          />
          <ShiftMiniCard
            label="Libur"
            count={stats?.today_distribution?.off ?? 0}
            icon={Coffee}
            color="#10B981"
          />
        </div>
        {stats && (stats.today_distribution.cuti + stats.today_distribution.sakit + stats.today_distribution.dinas_luar + stats.today_distribution.diklat + stats.today_distribution.penugasan) > 0 && (
          <div className="mt-5 pt-5 border-t flex flex-wrap gap-2 text-xs">
            {stats.today_distribution.cuti > 0 && <span className="px-2.5 py-1 rounded shift-cuti font-semibold">Cuti: {stats.today_distribution.cuti}</span>}
            {stats.today_distribution.sakit > 0 && <span className="px-2.5 py-1 rounded shift-sakit font-semibold">Sakit: {stats.today_distribution.sakit}</span>}
            {stats.today_distribution.dinas_luar > 0 && <span className="px-2.5 py-1 rounded shift-dinas_luar font-semibold">Dinas Luar: {stats.today_distribution.dinas_luar}</span>}
            {stats.today_distribution.diklat > 0 && <span className="px-2.5 py-1 rounded shift-diklat font-semibold">Diklat: {stats.today_distribution.diklat}</span>}
            {stats.today_distribution.penugasan > 0 && <span className="px-2.5 py-1 rounded shift-penugasan font-semibold">Penugasan: {stats.today_distribution.penugasan}</span>}
          </div>
        )}
      </Card>

      {/* Workload bar chart */}
      <Card className="p-6" data-testid="workload-chart-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-xl font-semibold flex items-center gap-2">
              <BarChart3 size={18} style={{ color: "var(--accent-hex)" }} />
              Grafik Beban Kerja Bulanan
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Total jam kerja tiap personil pada {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}. Diurutkan dari tertinggi.
            </p>
          </div>
          {workload.length > 0 && (
            <div className="text-right">
              <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">Rata-rata</div>
              <div className="font-display text-2xl font-bold" style={{ color: "var(--accent-hex)" }}>
                {Math.round(workload.reduce((a, b) => a + b.jam, 0) / workload.length)}j
              </div>
            </div>
          )}
        </div>
        {workload.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Belum ada data jam kerja untuk bulan ini
          </div>
        ) : (
          <div className="w-full" style={{ height: Math.max(280, workload.length * 34) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workload} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${v}j`} tick={{ fontSize: 11 }} stroke="rgba(148,163,184,0.6)" />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} stroke="rgba(148,163,184,0.6)" />
                <RTooltip
                  cursor={{ fill: "rgba(0,139,255,0.08)" }}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v, _n, p) => [`${v} jam`, "Total"]}
                  labelFormatter={(_l, p) => p?.[0]?.payload ? `${p[0].payload.fullName} (${p[0].payload.nik})` : ""}
                />
                <Bar dataKey="jam" radius={[0, 6, 6, 0]}>
                  {workload.map((entry, i) => {
                    const max = Math.max(...workload.map((w) => w.jam));
                    const ratio = max > 0 ? entry.jam / max : 0;
                    const color = ratio > 0.85 ? "#EF4444" : ratio > 0.6 ? "var(--accent-hex)" : "#38BDF8";
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {workload.length > 0 && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-[11px] mono uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-red-500" /> Beban Tertinggi (&gt;85%)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: "var(--accent-hex)" }} /> Standar (60-85%)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-sky-400" /> Ringan (&lt;60%)</span>
          </div>
        )}
      </Card>
    </div>
  );
}
