import type { ReactNode } from 'react';
import StoreShell from '@/components/site/StoreShell';

export default function Layout({ children }: { children: ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
