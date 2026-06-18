'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/ui/Avatar';
import type { Conversation } from '@/types';
import { timeAgo } from '@/lib/utils';

export default function ConversationsList({ currentUserId }: { currentUserId: string }) {
  const qc = useQueryClient();
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch('/api/messages');
      return res.json() as Promise<{ conversations: Conversation[] }>;
    },
  });

  // Real-time via Supabase (replaces Pusher)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`user-convs-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          qc.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, qc]);

  const conversations = (data?.conversations ?? []).filter((c) => {
    if (!query) return true;
    const other = c.participants.find((p) => p.id !== currentUserId);
    if (c.is_group)
      return c.group_name?.toLowerCase().includes(query.toLowerCase());
    return (
      other?.name?.toLowerCase().includes(query.toLowerCase()) ||
      other?.username?.toLowerCase().includes(query.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-1 pt-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-800 skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-800 rounded skeleton" />
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-800 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar mensajes..."
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {conversations.length === 0 && !query ? (
        <div className="flex flex-col items-center py-20 gap-4 text-center px-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tus mensajes</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Envía un mensaje privado a tus amigos.
          </p>
          <Link
            href="/messages/new"
            className="px-6 py-2.5 bg-blue-500 text-white rounded-full text-sm font-semibold"
          >
            Nuevo mensaje
          </Link>
        </div>
      ) : (
        conversations.map((conv) => {
          const other = conv.participants.find((p) => p.id !== currentUserId);
          const name = conv.is_group ? conv.group_name : (other?.name ?? other?.username);
          const avatar = conv.is_group ? conv.group_avatar_url : other?.image;
          const hasUnread = conv.unread_count > 0;

          return (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors active:bg-gray-100 dark:active:bg-gray-800"
            >
              <div className="relative flex-shrink-0">
                <Avatar src={avatar} alt={name ?? ''} size="md" />
                {hasUnread && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-black" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm ${
                      hasUnread
                        ? 'font-bold text-gray-900 dark:text-white'
                        : 'font-medium text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {name}
                  </p>
                  <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">
                    {conv.last_message ? timeAgo(conv.last_message.created_at) : ''}
                  </span>
                </div>
                <p
                  className={`text-sm truncate mt-0.5 ${
                    hasUnread
                      ? 'font-medium text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {conv.last_message?.content ||
                    (conv.last_message?.media_url
                      ? 'Archivo adjunto'
                      : 'Toca para escribir...')}
                </p>
              </div>
              {hasUnread && (
                <span className="min-w-[20px] h-5 bg-blue-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5 flex-shrink-0">
                  {conv.unread_count}
                </span>
              )}
            </Link>
          );
        })
      )}
    </div>
  );
}
