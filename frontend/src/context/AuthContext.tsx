import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

import type { User, AuthResponse, AuthContextValue } from "../types/auth";

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
const TOKEN_KEY = "medbook_token";
const USER_KEY  = "medbook_user";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialise from localStorage so a page refresh doesn't log the user out
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  // Keep localStorage in sync whenever token or user changes
  useEffect(() => {
    if (token && user) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, [token, user]);

  // Called by LoginPage after a successful API response
  const login = ({ token, user }: AuthResponse) => {
    setToken(token);
    setUser(user);
  };

  // Clears everything — ProtectedRoute will redirect to /login
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook — the only way components should read auth state
// ---------------------------------------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}