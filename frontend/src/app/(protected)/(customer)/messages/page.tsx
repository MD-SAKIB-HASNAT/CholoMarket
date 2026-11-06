'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Handshake, MessageCircle, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { LoadMore } from '@/components/shared/LoadMore';
import { Initials } from '@/components/shared/Media';
import { LoadingBlock } from '@/components/dashboard/DashboardShell';
import { api } from '@/utils/api/api';
import { useAuth, useRequireAuth } from '@/utils/context/AuthContext';
import { formatTaka, timeAgo } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { Conversation, Thread } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

function ThreadView({ id, onBack }: { id: number; onBack: () => void }) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const thread = useQuery({
    queryKey: ['thread', id],
    queryFn: () => api<Thread>(STORE_ENDPOINTS.messages.conversationById(id)),
    refetchInterval: 5000,
  });
  const send = useMutation({
    mutationFn: (body: string) =>
      api(STORE_ENDPOINTS.messages.conversationMessages(id), { method: 'POST', body: { body } }),
    onSuccess: () => {
      setText('');
      void qc.invalidateQueries({ queryKey: ['thread', id] });
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
  const count = thread.data?.messages.length ?? 0;
  useEffect(() => bottom.current?.scrollIntoView({ block: 'end' }), [count]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (text.trim()) send.mutate(text.trim());
  }

  if (!thread.data) return <LoadingBlock rows={5} />;
  const { conversation, messages, offers } = thread.data;
  const openOffers = offers.filter(o => ['pending', 'countered', 'accepted'].includes(o.status));

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft />
        </Button>
        <Initials name={conversation.shop.nameEn} className="size-9 rounded-full text-xs" />
        <div className="min-w-0">
          <Link
            href={`/shops/${conversation.shop.slug}`}
            className="truncate font-medium hover:text-primary"
          >
            {conversation.shop.nameEn}
          </Link>
          <p className="text-xs text-muted-foreground">Usually replies within the hour</p>
        </div>
      </header>
      {openOffers.length ? (
        <div className="flex gap-2 overflow-x-auto border-b bg-muted/40 px-4 py-2">
          {openOffers.map(o => (
            <Link
              key={o.id}
              href="/offers"
              className="flex shrink-0 items-center gap-2 rounded-lg border bg-background px-2 py-1 text-xs"
            >
              <Handshake className="size-3.5 text-primary" /> {o.productName}:{' '}
              {formatTaka(o.finalPrice ?? o.counterPrice ?? o.offeredPrice)}{' '}
              <StatusBadge status={o.status} className="h-4 text-[10px]" />
            </Link>
          ))}
        </div>
      ) : null}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map(m => {
          const mine = m.senderSide === 'customer';
          if (m.senderSide === 'system') {
            return (
              <p
                key={m.id}
                className="mx-auto max-w-sm rounded-lg bg-amber-50 px-3 py-1.5 text-center text-xs text-amber-900"
              >
                {m.body}
              </p>
            );
          }
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                  mine
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm bg-muted'
                )}
              >
                {m.product ? (
                  <Link
                    href={`/products/${m.product.id}`}
                    className={cn(
                      'mb-1 block text-xs underline',
                      mine ? 'opacity-90' : 'text-primary'
                    )}
                  >
                    {m.product.nameEn}
                  </Link>
                ) : null}
                <p className="whitespace-pre-line">{m.body}</p>
                <p
                  className={cn('mt-1 text-[10px]', mine ? 'opacity-75' : 'text-muted-foreground')}
                >
                  {timeAgo(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t p-3">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          className="h-10"
          aria-label="Message"
        />
        <Button
          type="submit"
          size="icon-lg"
          disabled={!text.trim() || send.isPending}
          aria-label="Send"
        >
          <Send />
        </Button>
      </form>
    </div>
  );
}

function Messages() {
  const { user } = useRequireAuth();
  useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const active = params.get('c') ? Number(params.get('c')) : null;
  const list = useCursorList<Conversation>(
    ['conversations'],
    STORE_ENDPOINTS.messages.conversations,
    { limit: 20 },
    { enabled: !!user, refetchInterval: 15_000 }
  );

  return (
    <div className="container-page py-6">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Messages</h1>
      {list.isPending ? (
        <LoadingBlock />
      ) : !list.items.length ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Open any shop and tap “Chat with shop” to ask about stock, sizes or price."
        />
      ) : (
        <div className="grid h-[70vh] overflow-hidden rounded-xl border bg-card md:grid-cols-[300px_1fr]">
          <ul className={cn('divide-y overflow-y-auto border-r', active && 'hidden md:block')}>
            {list.items.map(c => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/messages?c=${c.id}`)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted',
                    active === c.id && 'bg-secondary'
                  )}
                >
                  <Initials
                    name={c.shop?.nameEn ?? 'Shop'}
                    className="size-10 shrink-0 rounded-full text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{c.shop?.nameEn}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.lastMessagePreview}</p>
                  </div>
                  {c.customerUnread ? (
                    <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                      {c.customerUnread}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
            {list.hasMore ? (
              <li className="p-3">
                <LoadMore
                  hasMore
                  loading={list.isLoadingMore}
                  onLoad={list.loadMore}
                  auto
                  label="Show older chats"
                  className="flex justify-center"
                />
              </li>
            ) : null}
          </ul>
          <div className={cn('min-h-0', !active && 'hidden md:block')}>
            {active ? (
              <ThreadView key={active} id={active} onBack={() => router.push('/messages')} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Choose a conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <Messages />
    </Suspense>
  );
}
