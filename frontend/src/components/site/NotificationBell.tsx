'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadMore } from '@/components/shared/LoadMore';
import { api } from '@/utils/api/api';
import { useAuth } from '@/utils/context/AuthContext';
import { timeAgo } from '@/utils/helpers/format';
import type { Notification } from '@/utils/types';
import { useCursorList } from '@/utils/hooks/useCursorList';
import { cn } from '@/utils/helpers/cn';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const list = useCursorList<Notification>(
    ['notifications'],
    STORE_ENDPOINTS.notifications.list,
    { limit: 15 },
    { enabled: !!user, refetchInterval: 30_000 }
  );
  const readAll = useMutation({
    mutationFn: () => api(STORE_ENDPOINTS.notifications.readAll, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readOne = useMutation({
    mutationFn: (id: string) => api(STORE_ENDPOINTS.notifications.read(id), { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (!user) return null;
  // `unread` counts every notification, not just the pages loaded.
  const unread = Number(list.meta?.unread ?? 0);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Notifications (${unread} unread)`}
          />
        }
      >
        <Bell />
        {unread ? (
          <span className="absolute top-0.5 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-deal px-1 text-[10px] leading-4 font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          {unread ? (
            <Button variant="link" size="xs" onClick={() => readAll.mutate()}>
              Mark all read
            </Button>
          ) : null}
        </div>
        <ScrollArea className="max-h-96">
          {list.items.length ? (
            <>
              <ul className="divide-y">
                {list.items.map(n => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full px-3 py-2.5 text-left hover:bg-muted',
                        !n.readAt && 'bg-secondary/60'
                      )}
                      onClick={() => {
                        if (!n.readAt) readOne.mutate(n.id);
                        if (n.data?.href) router.push(n.data.href);
                      }}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
              <LoadMore
                hasMore={!!list.hasMore}
                loading={list.isLoadingMore}
                onLoad={list.loadMore}
                auto
                label="Show older"
                className="flex justify-center p-2"
              />
            </>
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              You’re all caught up.
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
