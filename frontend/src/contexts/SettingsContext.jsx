import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { setCustomHolidays } from "@/lib/holidays";

const SettingsCtx = createContext(null);

function hexToHslTriplet(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  let hh = 0;
  const l = (mx + mn) / 2;
  const s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
  if (mx !== mn) {
    const d = mx - mn;
    switch (mx) {
      case r: hh = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hh = (b - r) / d + 2; break;
      default: hh = (r - g) / d + 4;
    }
    hh /= 6;
  }
  return `${Math.round(hh * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [holidays, setHolidaysState] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get("/settings");
      setSettings(data || {});
      applyPrimary(data?.primary_color || "#008BFF");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const { data } = await api.get("/holidays");
      setHolidaysState(data || []);
      setCustomHolidays(data || []);
    } catch { /* not authenticated yet */ }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchHolidays();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = localStorage.getItem("aco_theme") === "dark" ||
      (!localStorage.getItem("aco_theme") && mq.matches);
    document.documentElement.classList.toggle("dark", isDark);
  }, [fetchSettings]);

  function applyPrimary(hex) {
    document.documentElement.style.setProperty("--accent-hex", hex);
    document.documentElement.style.setProperty("--primary", hexToHslTriplet(hex));
    document.documentElement.style.setProperty("--ring", hexToHslTriplet(hex));
  }

  const update = async (patch) => {
    const { data } = await api.put("/settings", patch);
    setSettings(data);
    if (patch.primary_color) applyPrimary(patch.primary_color);
    return data;
  };

  return (
    <SettingsCtx.Provider value={{ settings, loading, refresh: fetchSettings, update, applyPrimary, holidays, refreshHolidays: fetchHolidays }}>
      {children}
    </SettingsCtx.Provider>
  );
}

export const useSettings = () => useContext(SettingsCtx);
