import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, loadToken, saveToken, clearToken, type Account } from "../api/client";

interface AuthValue {
  account: Account | null;
  loading: boolean;
  networkError: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  retry: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = loadToken();
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { status, body } = await api.me();
      if (cancelled) return;
      if (status === 200 && body.user) {
        setAccount(body.user);
        setNetworkError(false);
      } else if (status === 0) {
        // Servidor inalcanzable: no se puede confirmar si el token es
        // valido, asi que NO se borra (podria seguir siendolo cuando el
        // servidor vuelva). Se muestra un error en vez de quedarse
        // cargando para siempre.
        setNetworkError(true);
      } else {
        clearToken();
        setNetworkError(false);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    setAttempt((a) => a + 1);
  }

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

  return <AuthContext.Provider value={{ account, loading, networkError, login, logout, retry }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
