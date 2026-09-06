import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Sunrise, Sunset, Moon as MoonIcon, Coffee } from "lucide-react";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DOW = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const LABEL = { pagi: "Pagi", siang: "Siang", malam: "Malam", off: "Libur", cuti: "Cuti", sakit: "Sakit", dinas_luar: "Dinas Luar", diklat: "Diklat", penugasan: "Penugasan" };
const HOURS = { pagi: 6, siang: 6, malam: 12 };
const SHIFT_TIME = { pagi: "07:00–13:00", siang: "13:00–19:00", malam: "19:00–07:00" };

export default function MyCalendar() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [shifts, setShifts] = useState({});

  useEffect(() => {
    api.get("/shifts", { params: { year, month } }).then((r) => {
      const map = {};
      for (const s of r.data.shifts) {
        if (s.user_id === user.id) map[s.date] = s.shift;
      }
      setShifts(map);
    });
  }, [year, month, user.id]);

  const nDays = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();
  const cells = useMemo(() => {
    const out = [];
    for (let i = 0; i < firstDow; i++) out.push(null);
    for (let d = 1; d <= nDays; d++) out.push(d);
    return out;
  }, [firstDow, nDays]);

  const stats = useMemo(() => {
    const c = { pagi: 0, siang: 0, malam: 0, off: 0, cuti: 0, sakit: 0, dinas_luar: 0, diklat: 0, penugasan: 0 };
    Object.values(shifts).forEach((s) => { if (c[s] !== undefined) c[s]++; });
    const hours = c.pagi * HOURS.pagi + c.siang * HOURS.siang + c.malam * HOURS.malam;
    return { ...c, hours };
  }, [shifts]);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const list = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const s = shifts[iso];
      if (s && s !== "off") list.push({ date: iso, shift: s, dateObj: d });
      if (list.length >= 5) break;
    }
    return list;
  }, [shifts]);

  const nav = (dir) => {
    let m = month + dir, y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y);
  };

  const today = now.toISOString().slice(0, 10);
  const todayShift = shifts[today];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <div className="text-xs mono uppercase tracking-[0.25em] text-muted-foreground">// Jadwal Pribadi</div>
          <h3 className="font-display text-2xl font-bold mt-1">Halo, {user.name}</h3>
          <p className="text-xs mono text-muted-foreground mt-0.5">{user.nik}</p>
        </div>
        <Button size="icon" variant="outline" onClick={() => nav(-1)}><ChevronLeft size={16} /></Button>
        <div className="font-display font-semibold text-lg w-40 text-center">{MONTHS[month-1]} {year}</div>
        <Button size="icon" variant="outline" onClick={() => nav(1)}><ChevronRight size={16} /></Button>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>{[now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Today card + Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 md:col-span-1 border-2" style={{ borderColor: "var(--accent-hex)", background: "linear-gradient(135deg, rgba(0,139,255,0.08), transparent)" }}>
          <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">Hari ini</div>
          <div className="font-display text-lg font-semibold mt-1">{now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</div>
          {todayShift ? (
            <div className="mt-4">
              <div className={`inline-block px-4 py-2 rounded-lg font-bold text-lg shift-${todayShift}`}>{LABEL[todayShift] || todayShift}</div>
              {SHIFT_TIME[todayShift] && <div className="mt-2 text-sm mono text-muted-foreground flex items-center gap-1.5"><Clock size={12} /> {SHIFT_TIME[todayShift]}</div>}
            </div>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground italic">Belum ada jadwal untuk hari ini</div>
          )}
        </Card>

        <Card className="p-5 md:col-span-2">
          <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground mb-3">Ringkasan {MONTHS[month-1]}</div>
          <div className="grid grid-cols-4 gap-3">
            <StatBadge icon={<Sunrise size={14} />} label="Pagi" value={stats.pagi} accent="#0369A1" />
            <StatBadge icon={<Sunset size={14} />} label="Siang" value={stats.siang} accent="#B45309" />
            <StatBadge icon={<MoonIcon size={14} />} label="Malam" value={stats.malam} accent="#6D28D9" />
            <StatBadge icon={<Coffee size={14} />} label="Libur" value={stats.off} accent="#64748B" />
          </div>
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div>
              <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">Total Jam Kerja</div>
              <div className="font-display text-3xl font-bold mt-0.5" style={{ color: "var(--accent-hex)" }}>{stats.hours} jam</div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {stats.cuti > 0 && <div>Cuti: <b>{stats.cuti}</b> hari</div>}
              {stats.sakit > 0 && <div>Sakit: <b>{stats.sakit}</b> hari</div>}
              {(stats.dinas_luar + stats.diklat + stats.penugasan) > 0 && <div>DL/DK/PN: <b>{stats.dinas_luar + stats.diklat + stats.penugasan}</b></div>}
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Card className="p-5">
          <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground mb-3">Shift Mendatang</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {upcoming.map((u) => {
              const isToday = u.date === today;
              return (
                <div key={u.date} className={`p-3 rounded-lg border ${isToday ? "ring-2" : ""}`} style={isToday ? { borderColor: "var(--accent-hex)" } : {}}>
                  <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">{u.dateObj.toLocaleDateString("id-ID", { weekday: "long" })}</div>
                  <div className="font-display font-semibold text-sm">{u.dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</div>
                  <div className={`mt-2 inline-block px-2 py-0.5 rounded text-xs font-bold shift-${u.shift}`}>{LABEL[u.shift]}</div>
                  {SHIFT_TIME[u.shift] && <div className="text-[10px] mono text-muted-foreground mt-1">{SHIFT_TIME[u.shift]}</div>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Calendar grid */}
      <Card className="p-5">
        <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground mb-3">Kalender Bulanan</div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] mono uppercase tracking-widest text-muted-foreground mb-2">
          {DOW.map((d, i) => <div key={d} className={i === 0 || i === 6 ? "text-red-500" : ""}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const date = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const s = shifts[date];
            const isToday = date === today;
            const dow = new Date(year, month - 1, d).getDay();
            const isWeekend = dow === 0 || dow === 6;
            return (
              <div key={i} className={`aspect-square rounded-lg border p-1.5 flex flex-col hover:shadow-md transition-shadow ${isToday ? "ring-2" : ""}`} style={isToday ? { borderColor: "var(--accent-hex)" } : {}}>
                <div className={`text-xs mono font-bold ${isWeekend ? "text-red-500" : ""}`}>{d}</div>
                {s && <div className={`shift-${s} mt-auto rounded px-1 py-0.5 text-[10px] font-semibold text-center`}>{LABEL[s]}</div>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function StatBadge({ icon, label, value, accent }) {
  return (
    <div className="rounded-lg border p-3 flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5 text-[10px] mono uppercase tracking-widest" style={{ color: accent }}>
        {icon} {label}
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
