"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface AuthUser {
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
}

const STORAGE_KEY = "nexora_user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount, not a synchronization loop
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore malformed/unavailable storage
    } finally {
      setLoading(false);
    }
  }, []);

  function signIn(newUser: AuthUser) {
    setUser(newUser);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch {
      // ignore storage failures (e.g. private browsing)
    }
  }

  function signOut() {
    setUser(null);

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
