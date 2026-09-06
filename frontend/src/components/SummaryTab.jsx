import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

export default function SummaryTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/summary", { params: { year, month } }).then((r) => setData(r.data.summary));
  }, [year, month]);

  const totals = data.reduce((acc, r) => {
    acc.pagi += r.counts.pagi; acc.siang += r.counts.siang; acc.malam += r.counts.malam;
    acc.cuti += r.counts.cuti + r.counts.sakit; acc.hours += r.total_hours;
    return acc;
  }, { pagi: 0, siang: 0, malam: 0, cuti: 0, hours: 0 });

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center gap-3">
        <h3 className="font-display text-xl font-semibold flex-1">Ringkasan Bulanan</h3>
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>{[now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { k: "pagi", label: "Total Pagi", v: totals.pagi },
          { k: "siang", label: "Total Siang", v: totals.siang },
          { k: "malam", label: "Total Malam", v: totals.malam },
          { k: "cuti", label: "Cuti/Sakit", v: totals.cuti },
          { k: "hours", label: "Total Jam", v: totals.hours },
        ].map((s) => (
          <Card key={s.k} className="p-4 border-l-4" style={{ borderLeftColor: "var(--accent-hex)" }}>
            <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground">{s.label}</div>
            <div className="font-display text-3xl font-bold mt-1">{s.v}</div>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-semibold">NIK</th>
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 text-center">Pagi</th>
              <th className="px-4 py-3 text-center">Siang</th>
              <th className="px-4 py-3 text-center">Malam</th>
              <th className="px-4 py-3 text-center">Libur</th>
              <th className="px-4 py-3 text-center">Cuti</th>
              <th className="px-4 py-3 text-center">Sakit</th>
              <th className="px-4 py-3 text-center">DL/DK/PN</th>
              <th className="px-4 py-3 text-center font-bold">Total Jam</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.user_id} className="border-b hover:bg-accent/30">
                <td className="px-4 py-2 mono">{r.nik}</td>
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-center">{r.counts.pagi}</td>
                <td className="px-4 py-2 text-center">{r.counts.siang}</td>
                <td className="px-4 py-2 text-center">{r.counts.malam}</td>
                <td className="px-4 py-2 text-center">{r.counts.off}</td>
                <td className="px-4 py-2 text-center">{r.counts.cuti}</td>
                <td className="px-4 py-2 text-center">{r.counts.sakit}</td>
                <td className="px-4 py-2 text-center">{r.counts.dinas_luar + r.counts.diklat + r.counts.penugasan}</td>
                <td className="px-4 py-2 text-center font-bold" style={{ color: "var(--accent-hex)" }}>{r.total_hours}h</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan="10" className="text-center p-8 text-muted-foreground">Belum ada data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
