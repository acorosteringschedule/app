import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const LABEL = { pagi: "Pagi", siang: "Siang", malam: "Malam", off: "Libur", cuti: "Cuti", sakit: "Sakit", dinas_luar: "Dinas Luar", diklat: "Diklat", penugasan: "Penugasan" };

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
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const cells = useMemo(() => {
    const out = [];
    for (let i = 0; i < firstDow; i++) out.push(null);
    for (let d = 1; d <= nDays; d++) out.push(d);
    return out;
  }, [firstDow, nDays]);

  const nav = (dir) => {
    let m = month + dir, y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y);
  };

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h3 className="font-display text-xl font-semibold">Kalender Saya</h3>
          <p className="text-xs mono uppercase tracking-widest text-muted-foreground mt-1">{user.name}</p>
        </div>
        <Button size="icon" variant="outline" onClick={() => nav(-1)}><ChevronLeft size={16} /></Button>
        <div className="font-display font-semibold text-lg w-40 text-center">{MONTHS[month-1]} {year}</div>
        <Button size="icon" variant="outline" onClick={() => nav(1)}><ChevronRight size={16} /></Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] mono uppercase tracking-widest text-muted-foreground mb-2">
          {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const date = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const s = shifts[date];
            const isToday = date === now.toISOString().slice(0,10);
            return (
              <div key={i} className={`aspect-square rounded-lg border p-1.5 flex flex-col ${isToday ? "ring-2" : ""}`} style={isToday ? { borderColor: "var(--accent-hex)" } : {}}>
                <div className="text-xs mono font-bold">{d}</div>
                {s && <div className={`shift-${s} mt-auto rounded px-1 py-0.5 text-[10px] font-semibold text-center`}>{LABEL[s]}</div>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
