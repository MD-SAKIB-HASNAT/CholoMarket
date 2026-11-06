'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { api, TOKEN_KEY } from '@/utils/api/api';
import type { Me } from '@/utils/types';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

interface AuthState {
  token: string | null;
  user: Me | null;
  /** True until we know whether a stored session is valid. */
  loading: boolean;
  login: (token: string, user: Me) => void;
  logout: () => void;
  refresh: () => Promise<unknown>;
}

const AuthContext = createContext<AuthState | null>(null);
const TOKEN_EVENT = 'cm:token';

// The token lives in localStorage; expose it as an external store so every tab stays in sync.
function subscribeToken(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(TOKEN_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(TOKEN_EVENT, onChange);
  };
}

function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage blocked: session lasts for this page only
  }
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

const noopSubscribe = () => () => {};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const token = useSyncExternalStore(subscribeToken, readToken, () => null);
  // false during SSR and hydration, true afterwards.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  const me = useQuery({
    queryKey: ['me', token],
    queryFn: () => api<Me>(STORE_ENDPOINTS.auth.me, { token }),
    enabled: !!token,
    staleTime: 60_000,
    retry: false,
  });

  const logout = useCallback(() => {
    writeToken(null);
    queryClient.clear();
  }, [queryClient]);

  // Any 401 from the API (expired or revoked token) ends the session.
  useEffect(() => {
    window.addEventListener('cm:unauthorized', logout);
    return () => window.removeEventListener('cm:unauthorized', logout);
  }, [logout]);

  const login = useCallback(
    (newToken: string, user: Me) => {
      queryClient.setQueryData(['me', newToken], user);
      writeToken(newToken);
    },
    [queryClient]
  );

  const value = useMemo<AuthState>(
    () => ({
      token,
      user: (token && me.data) || null,
      loading: !hydrated || (!!token && me.isPending),
      login,
      logout,
      refresh: () => me.refetch(),
    }),
    [token, me, hydrated, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Redirects to /login (and back afterwards) when there is no session. */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!auth.loading && !auth.user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [auth.loading, auth.user, pathname, router]);
  return auth;
}
