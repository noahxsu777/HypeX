'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import Link from 'next/link';
import { pusherClient } from '@/lib/pusher-client';
import Avatar from '@/components/ui/Avatar';
import type { Notification } from '@/types';
import { timeAgo } from '@/lib/utils';

const TYPE_ICONS: Record<Notification['type'], string> = {
  like: '❤️', comment: '💬', follow: '👤', mention: '@', message: '✉️',
};

export default function NotificationsFeed() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      return res.json() as Promise<{ notifications: Notification[] }>;
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => fetch('/api/notifications', { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Real-time notifications
  useEffect(() => {
    const channel = pusherClient.subscribe('private-notifications');
    channel.bind('new-notification', () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    });
    return () => pusherClient.unsubscribe('private-notifications');
  }, [qc]);

  // Auto-mark as read after viewing
  useEffect(() => {
    const timer = setTimeout(() => markAllRead.mutate(), 3000);
    return () => clearTimeout(timer);
  }, []);

  const notifications = data?.notifications ?? [];
  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  if (isLoading) {
    return (
      <div className="space-y-0.5 pt-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-800 skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded skeleton" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded skeleton" />
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 skeleton" />
          </div>
        ))}
      </div>
    );
  }

  const NotifItem = ({ n }: { n: Notification }) => (
    <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${!n.isRead ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''}`}>
      <div className="relative flex-shrink-0">
        <Avatar src={n.actor.image} alt={n.actor.name} size="md" />
        <span className="absolute -bottom-0.5 -right-0.5 text-sm w-5 h-5 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow border border-gray-100 dark:border-gray-700">
          {TYPE_ICONS[n.type]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white">
          <Link href={`/profile/${n.actor.username}`} className="font-bold hover:underline">{n.actor.name}</Link>{' '}
          <span className="text-gray-600 dark:text-gray-400">
            {n.type === 'like' && 'dio me gusta a tu publicación.'}
            {n.type === 'comment' && 'comentó en tu publicación.'}
            {n.type === 'follow' && 'empezó a seguirte.'}
            {n.type === 'mention' && 'te mencionó en un comentario.'}
            {n.type === 'message' && 'te envió un mensaje.'}
          </span>{' '}
          <span className="text-gray-400 text-xs">{timeAgo(n.createdAt)}</span>
        </p>
      </div>
      {n.type === 'follow' && (
        <FollowButton userId={n.actor.id} />
      )}
      {n.post && (
        <Link href={`/post/${n.post.id}`} className="flex-shrink-0">
          <img src={n.post.mediaUrls?.[0]} alt="" className="w-11 h-11 object-cover rounded-lg" />
        </Link>
      )}
    </div>
  );

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 gap-4 text-center px-8">
        <div className="text-5xl">🔔</div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sin notificaciones</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Cuando alguien interactúe contigo, lo verás aquí.</p>
      </div>
    );
  }

  return (
    <div>
      {unread.length > 0 && (
        <>
          <div className="flex items-center justify-between px-4 py-2.5">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nuevas</h3>
          </div>
          {unread.map(n => <NotifItem key={n.id} n={n} />)}
        </>
      )}
      {read.length > 0 && (
        <>
          <div className="px-4 py-2.5">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Anteriores</h3>
          </div>
          {read.map(n => <NotifItem key={n.id} n={n} />)}
        </>
      )}
      <div className="h-6" />
    </div>
  );
}

function FollowButton({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-semibold flex-shrink-0 disabled:opacity-60"
      disabled={mutation.isPending}
    >
      Seguir
    </button>
  );
}
