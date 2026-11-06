'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/utils/context/AuthContext';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 20_000, refetchOnWindowFocus: false, retry: 1 },
        },
        // Any failed mutation shows the API's message unless the caller handles it.
        mutationCache: new MutationCache({
          onError: (error, _vars, _ctx, mutation) => {
            if (!mutation.options.onError) toast.error(error.message);
          },
        }),
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        <AuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthProvider>
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
