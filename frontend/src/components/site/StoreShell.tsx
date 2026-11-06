import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site/Footer';
import { SiteHeader } from '@/components/site/Header';
import { PanelGate } from '@/components/site/PanelGate';

/** The shopper-facing page frame: header, content, footer. Panel accounts are sent to their panel. */
export default function StoreShell({ children }: { children: ReactNode }) {
  return (
    <PanelGate>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </PanelGate>
  );
}
