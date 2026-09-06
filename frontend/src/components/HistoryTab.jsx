import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Clock, User } from "lucide-react";

export default function HistoryTab() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { api.get("/change-logs").then((r) => setLogs(r.data)); }, []);
  return (
    <div className="space-y-4 fade-in">
      <div>
        <h3 className="font-display text-xl font-semibold">Riwayat Perubahan</h3>
        <p className="text-xs mono uppercase tracking-widest text-muted-foreground mt-1">{logs.length} entri terakhir</p>
      </div>
      <Card className="divide-y">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Belum ada riwayat</div>
        ) : logs.map((l) => (
          <div key={l.id} className="p-4 flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: "var(--accent-hex)" }}>
              <User size={14} />
            </div>
            <div className="flex-1">
              <div className="text-sm">{l.message}</div>
              <div className="text-[10px] mono uppercase tracking-widest text-muted-foreground mt-1 flex items-center gap-2">
                <Clock size={10} /> {new Date(l.timestamp).toLocaleString("id-ID")} · oleh {l.actor_name}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
