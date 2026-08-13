import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, loadToken, saveToken, clearToken, type Account } from "../api/client";

interface AuthValue {
  account: Account | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = loadToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const { status, body } = await api.me();
      if (status === 200 && body.user) {
        setAccount(body.user);
      } else {
        clearToken();
      }
      setLoading(false);
    })();
  }, []);

  async function login(username: string, password: string): Promise<string | null> {
    const { status, body } = await api.login(username, password);
    if (status !== 200 || !body.token || !body.user) {
      return body.error || "LOGIN_FAILED";
    }
    if (body.user.role !== "admin" && body.user.role !== "moderator") {
      return "NOT_ALLOWED";
    }
    saveToken(body.token);
    setAccount(body.user);
    return null;
  }

  function logout() {
    clearToken();
    setAccount(null);
  }

  return <AuthContext.Provider value={{ account, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
