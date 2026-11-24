import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, type User } from '../lib/api';

interface AuthContextValue { user: User | null; loading: boolean; login(email: string, password: string): Promise<User>; register(email: string, password: string, displayName: string): Promise<User>; logout(): Promise<void> }
const fallback: AuthContextValue = { user: null, loading: false, login: async () => { throw new Error('Authentication is not available.'); }, register: async () => { throw new Error('Authentication is not available.'); }, logout: async () => {} };
const AuthContext = createContext<AuthContextValue>(fallback);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; void auth.me().then((r) => { if (active) setUser(r.data); }).catch(() => { if (active) setUser(null); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const value = useMemo<AuthContextValue>(() => ({ user, loading,
    login: async (email, password) => { const result = await auth.login({ email, password }); setUser(result.data); return result.data; },
    register: async (email, password, displayName) => { const result = await auth.register({ email, password, displayName }); setUser(result.data); return result.data; },
    logout: async () => { await auth.logout(); setUser(null); },
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
