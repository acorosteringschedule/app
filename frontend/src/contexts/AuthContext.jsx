import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, formatApiError } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = anon
  const [token, setToken] = useState(() => localStorage.getItem("aco_token"));

  const fetchMe = useCallback(async () => {
    if (!localStorage.getItem("aco_token")) {
      setUser(null);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("aco_token");
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (nik, password) => {
    try {
      const { data } = await api.post("/auth/login", { nik, password });
      localStorage.setItem("aco_token", data.token);
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e) };
    }
  };

  const logout = () => {
    localStorage.removeItem("aco_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, token, login, logout, refreshMe: fetchMe }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
