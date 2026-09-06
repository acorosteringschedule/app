import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";
import DashboardHome from "@/components/DashboardHome";
import ShiftScheduleTab from "@/components/ShiftScheduleTab";
import PersonnelTab from "@/components/PersonnelTab";
import RequestsTab from "@/components/RequestsTab";
import SummaryTab from "@/components/SummaryTab";
import HistoryTab from "@/components/HistoryTab";
import SettingsTab from "@/components/SettingsTab";
import MyCalendar from "@/components/MyCalendar";

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState(user.role === "admin" ? "dashboard" : "kalender-saya");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activeTab={tab} onTab={setTab} />
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {tab === "dashboard" && <DashboardHome />}
        {tab === "jadwal" && <ShiftScheduleTab />}
        {tab === "personil" && user.role === "admin" && <PersonnelTab />}
        {tab === "pengajuan" && user.role === "admin" && <RequestsTab mine={false} />}
        {tab === "pengajuan-saya" && <RequestsTab mine={true} />}
        {tab === "kalender-saya" && <MyCalendar />}
        {tab === "ringkasan" && user.role === "admin" && <SummaryTab />}
        {tab === "riwayat" && user.role === "admin" && <HistoryTab />}
        {tab === "pengaturan" && user.role === "admin" && <SettingsTab />}
      </main>
    </div>
  );
}
