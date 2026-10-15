'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

/** Prefiks rute yang butuh login (harus sama dengan middleware.js). */
export const PROTECTED_PREFIXES = ['/dashboard', '/latihan', '/tryout', '/ujian', '/hasil', '/riwayat', '/profil', '/testimoni', '/admin'];
export const isProtectedPath = (p = '') => PROTECTED_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));

/** Tujuan default setelah login sesuai role. */
export const homeFor = (user) => (user && user.role === 'admin' ? '/admin' : '/dashboard');

/**
 * Menyimpan user yang sedang login (dari GET /api/auth/me).
 * useAuth() → { user, loading, setUser, refresh, logout, isAdmin }
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const me = await api.get('/auth/me');
      setUser(me || null);
      return me || null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Sesi habis (refresh token gagal) → kembali ke /login bila di halaman terproteksi.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      const path = window.location.pathname;
      if (isProtectedPath(path)) {
        router.replace(`/login?next=${encodeURIComponent(path + window.location.search)}`);
      }
    };
    window.addEventListener('bisapns:unauthorized', onUnauthorized);
    return () => window.removeEventListener('bisapns:unauthorized', onUnauthorized);
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // abaikan — tetap bersihkan state klien
    }
    setUser(null);
    router.replace('/login');
    router.refresh();
  }, [router]);

  const value = useMemo(() => ({ user, loading, setUser, refresh, logout, isAdmin: user?.role === 'admin' }), [user, loading, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}

export default AuthProvider;
