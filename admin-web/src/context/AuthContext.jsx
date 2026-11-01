import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data.success && res.data.user.role === "admin") {
          setUser(res.data.user);
          localStorage.setItem("admin_user", JSON.stringify(res.data.user));
        } else {
          setUser(null);
          localStorage.removeItem("admin_user");
          localStorage.removeItem("admin_token");
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem("admin_user");
        localStorage.removeItem("admin_token");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.success) {
      if (res.data.user.role !== "admin") {
        throw new Error("Access denied. Admin portal requires administrative privileges.");
      }
      setUser(res.data.user);
      if (res.data.token) {
        localStorage.setItem("admin_token", res.data.token);
      }
      localStorage.setItem("admin_user", JSON.stringify(res.data.user));
      return res.data;
    }
    throw new Error(res.data.message || "Login failed");
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
