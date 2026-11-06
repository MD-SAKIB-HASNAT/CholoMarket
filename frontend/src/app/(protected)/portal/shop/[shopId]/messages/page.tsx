'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Handshake, MessageCircle, Send } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingBlock, PageHeader } from '@/components/dashboard/DashboardShell';
import { EmptyState } from '@/components/shared/Bits';
import { LoadMore } from '@/components/shared/LoadMore';
import { Initials } from '@/components/shared/Media';
import { api } from '@/utils/api/api';
import { formatTaka, timeAgo } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { Conversation, Thread } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { useShopId } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

function MessagesInner() {
  const shopId = useShopId();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = params.get('c') ? Number(params.get('c')) : null;

  const list = useCursorList<Conversation>(
    ['shop', shopId, 'conversations'],
    PORTAL_ENDPOINTS.shop.conversations(shopId),
    { limit: 20 },
    { refetchInterval: 15_000 }
  );

  const open = (id: number | null) => router.replace(id ? `${pathname}?c=${id}` : pathname);

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Answer questions quickly — it’s the closest thing to a customer walking in."
      />
      <div className="grid h-[calc(100svh-13rem)] min-h-[28rem] overflow-hidden rounded-xl border bg-card md:grid-cols-[18rem_1fr]">
        <aside className={cn('min-h-0 overflow-y-auto border-r', selected && 'hidden md:block')}>
          {list.isPending ? (
            <div className="p-3">
              <LoadingBlock rows={4} />
            </div>
          ) : !list.items.length ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            <ul className="divide-y">
              {list.items.map(c => {
                const name = c.customer?.fullName || 'Customer';
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => open(c.id)}
                      className={cn(
                        'flex w-full gap-3 px-3 py-3 text-left hover:bg-muted',
                        selected === c.id && 'bg-secondary'
                      )}
                    >
                      <Initials name={name} className="size-9 shrink-0 rounded-full text-xs" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              'truncate text-sm',
                              c.shopUnread ? 'font-semibold' : 'font-medium'
                            )}
                          >
                            {name}
                          </p>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {timeAgo(c.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="flex-1 truncate text-xs text-muted-foreground">
                            {c.lastMessagePreview}
                          </p>
                          {c.shopUnread ? (
                            <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 font-semibold text-primary-foreground">
                              {c.shopUnread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <LoadMore
            hasMore={!!list.hasMore}
            loading={list.isLoadingMore}
            onLoad={list.loadMore}
            auto
            label="Older conversations"
            className="flex justify-center p-3"
          />
        </aside>
        <section className={cn('flex min-h-0 flex-col', !selected && 'hidden md:flex')}>
          {selected ? (
            <ThreadView
              key={selected}
              shopId={shopId}
              conversationId={selected}
              onBack={() => open(null)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState icon={MessageCircle} title="Select a conversation" className="border-0" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ThreadView({
  shopId,
  conversationId,
  onBack,
}: {
  shopId: number;
  conversationId: number;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['shop', shopId, 'thread', conversationId],
    queryFn: () => api<Thread>(PORTAL_ENDPOINTS.shared.conversation(conversationId)),
    refetchInterval: 5_000,
  });

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [data?.messages.length]);

  useEffect(() => {
    // Opening the thread clears the unread counter server-side.
    if (data) qc.invalidateQueries({ queryKey: ['shop', shopId, 'conversations'] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!data]);

  const send = useMutation({
    mutationFn: (text: string) =>
      api(PORTAL_ENDPOINTS.shop.conversationMessages(shopId, conversationId), {
        method: 'POST',
        body: { body: text },
      }),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['shop', shopId, 'thread', conversationId] });
      qc.invalidateQueries({ queryKey: ['shop', shopId, 'conversations'] });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (body.trim()) send.mutate(body.trim());
  }

  if (isLoading)
    return (
      <div className="p-4">
        <LoadingBlock rows={4} />
      </div>
    );
  if (isError || !data)
    return (
      <p className="p-6 text-sm text-muted-foreground">
        {error?.message ?? 'Conversation not found'}
      </p>
    );

  const offers = new Map(data.offers.map(o => [o.id, o]));

  return (
    <>
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Back to conversations"
          onClick={onBack}
        >
          <ArrowLeft />
        </Button>
        <p className="font-medium">{data.conversation.customer.fullName ?? 'Customer'}</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted/30 p-3">
        {data.messages.map(m => {
          const mine = m.senderSide === 'shop';
          const offer = m.offerId ? offers.get(m.offerId) : undefined;
          if (m.senderSide === 'system') {
            return (
              <p key={m.id} className="mx-auto max-w-sm text-center text-xs text-muted-foreground">
                {m.body}
              </p>
            );
          }
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                  mine ? 'bg-primary text-primary-foreground' : 'border bg-card'
                )}
              >
                {m.product ? (
                  <p className={cn('mb-1 text-xs', mine ? 'opacity-80' : 'text-muted-foreground')}>
                    About: {m.product.nameEn}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap">{m.body}</p>
                {offer ? (
                  <span
                    className={cn(
                      'mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]',
                      mine ? 'bg-white/20' : 'bg-amber-50 text-amber-800'
                    )}
                  >
                    <Handshake className="size-3" /> Offer {formatTaka(offer.offeredPrice)} ·{' '}
                    {offer.status}
                  </span>
                ) : null}
                <p
                  className={cn('mt-1 text-[10px]', mine ? 'opacity-70' : 'text-muted-foreground')}
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
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Type a reply…"
          aria-label="Message"
          maxLength={2000}
        />
        <Button type="submit" disabled={!body.trim() || send.isPending} aria-label="Send">
          <Send />
        </Button>
      </form>
    </>
  );
}

export default function ShopMessagesPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <MessagesInner />
    </Suspense>
  );
}
