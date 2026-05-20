import { createContext, useContext, useState, useCallback } from 'react';

const AUTH_KEY = 'sso_auth_token';

interface AuthContextType {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  login: async () => {},
  logout: () => {},
  isLoggedIn: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem(AUTH_KEY); } catch { return null; }
  });

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem(AUTH_KEY, data.token);
    setToken(data.token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
