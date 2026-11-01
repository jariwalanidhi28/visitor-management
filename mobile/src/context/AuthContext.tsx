import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { getApiBaseUrl } from "../api/config";

export interface User {
  _id: string;
  name: string;
  employeeId: string;
  email: string;
  mobile: string;
  department: string;
  designation: string;
  role: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  apiUrl: string;
  updateApiUrl: (newUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const TOKEN_KEY = "visitor_user_token";
const USER_KEY = "visitor_user_profile";
const API_URL_KEY = "visitor_custom_api_url";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [customApiUrl, setCustomApiUrl] = useState<string | null>(null);

  const apiUrl = customApiUrl || getApiBaseUrl();

  const updateApiUrl = async (newUrl: string) => {
    const formatted = newUrl.trim().replace(/\/+$/, "");
    setCustomApiUrl(formatted);
    await SecureStore.setItemAsync(API_URL_KEY, formatted);
  };

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUrl = await SecureStore.getItemAsync(API_URL_KEY);
        if (savedUrl) {
          setCustomApiUrl(savedUrl);
        }

        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          setToken(storedToken);

          const activeUrl = savedUrl || getApiBaseUrl();
          // Verify with backend
          const res = await fetch(`${activeUrl}/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user?.isActive) {
              setUser(data.user);
              await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
            } else {
              // Account deactivated or invalid
              await logout();
            }
          } else {
            // Token expired or invalid
            await logout();
          }
        }
      } catch (err) {
        console.log("Session restore error:", err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Invalid credentials");
    }

    if (!data.user.isActive) {
      throw new Error("Your account has been deactivated. Please contact administrator.");
    }

    setToken(data.token);
    setUser(data.user);

    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, apiUrl, updateApiUrl }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
