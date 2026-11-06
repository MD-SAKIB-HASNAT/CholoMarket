'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Heart, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/utils/api/api';
import { useAuth } from '@/utils/context/AuthContext';
import type { ShopDetail } from '@/utils/types';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

/** Follow + chat buttons on the shop page (personalised, so client-side). */
export function ShopActions({
  shopId,
  shopSlug,
  initialFollowing,
}: {
  shopId: number;
  shopSlug: string;
  initialFollowing: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Re-read with the user's token so "following" is accurate.
  const me = useQuery({
    queryKey: ['shop', shopSlug, 'me'],
    queryFn: () => api<ShopDetail>(STORE_ENDPOINTS.shops.bySlug(shopSlug)),
    enabled: !!user,
  });
  const [following, setFollowing] = useState(initialFollowing);
  const isFollowing = me.data?.isFollowing ?? following;

  const follow = useMutation({
    mutationFn: (on: boolean) =>
      api<{ isFollowing: boolean }>(STORE_ENDPOINTS.shops.follow(shopId), {
        method: on ? 'POST' : 'DELETE',
      }),
    onSuccess: r => {
      setFollowing(r.isFollowing);
      void me.refetch();
      toast.success(r.isFollowing ? 'Following — you’ll hear about new stock' : 'Unfollowed');
    },
  });

  const start = useMutation({
    mutationFn: () =>
      api<{ id: number }>(STORE_ENDPOINTS.messages.conversations, {
        method: 'POST',
        body: { shopId, body: message },
      }),
    onSuccess: conv => {
      setChatOpen(false);
      router.push(`/messages?c=${conv.id}`);
    },
  });

  const requireLogin = (fn: () => void) => () =>
    user ? fn() : router.push(`/login?next=/shops/${shopSlug}`);

  return (
    <div className="flex gap-2 pb-1">
      <Button
        variant={isFollowing ? 'secondary' : 'outline'}
        onClick={requireLogin(() => follow.mutate(!isFollowing))}
        disabled={follow.isPending}
      >
        <Heart className={isFollowing ? 'fill-current text-deal' : ''} />{' '}
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
      <Button onClick={requireLogin(() => setChatOpen(true))}>
        <MessageCircle /> Chat with shop
      </Button>
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask the shop</DialogTitle>
            <DialogDescription>
              Ask about sizes, colours, stock or a better price. The shop usually replies within the
              hour.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="আসসালামু আলাইকুম, এটা কি স্টকে আছে?"
            rows={4}
          />
          <DialogFooter>
            <Button onClick={() => start.mutate()} disabled={!message.trim() || start.isPending}>
              Send message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
