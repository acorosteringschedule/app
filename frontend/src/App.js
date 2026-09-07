import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { useSettings } from "@/contexts/SettingsContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import "@/App.css";

function App() {
  const { loading, error } = useSettings();

  if (loading && !localStorage.getItem("aco_settings_cache")) {
    return <div className="min-h-screen bg-background" />;
  }

  if (error && !localStorage.getItem("aco_settings_cache")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="font-display text-2xl font-semibold">Server belum terhubung</h1>
          <p className="text-sm text-muted-foreground">Konfigurasi URL backend Vercel belum benar atau API Render sedang tidak tersedia. Periksa REACT_APP_BACKEND_URL lalu deploy ulang.</p>
          <button className="text-sm font-semibold underline" onClick={() => window.location.reload()}>Coba lagi</button>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
