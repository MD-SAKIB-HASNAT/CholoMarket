'use client';

import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { useAuth } from '@/utils/context/AuthContext';
import { panelHomeFor } from '@/utils/helpers/panel';

const HINT_KEY = 'cm-panel-home';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

function readHint(): string | null {
  try {
    return window.localStorage.getItem(HINT_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Wraps the customer site. Admin, shop and mall accounts never see it: they are sent straight to their panel.
 * The last known panel is remembered in this browser so a returning staff member is redirected on the first
 * render instead of after the session check (customers never see a flash).
 */
export function PanelGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const hint = useSyncExternalStore(subscribe, readHint, () => null);
  const home = user ? panelHomeFor(user) : token && loading ? hint : null;

  useEffect(() => {
    if (loading) return;
    try {
      if (user && panelHomeFor(user)) window.localStorage.setItem(HINT_KEY, panelHomeFor(user)!);
      else window.localStorage.removeItem(HINT_KEY);
    } catch {
      // storage blocked: the redirect still happens once the session is known
    }
  }, [user, loading]);

  useEffect(() => {
    if (home) router.replace(home);
  }, [home, router]);

  if (home) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 text-muted-foreground">
        <LoaderCircle className="size-6 animate-spin" />
        <p className="text-sm">Taking you to your panel…</p>
      </div>
    );
  }
  return children;
}
