'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Phone, Video, Info, Send, Image, Mic, Plus, Smile } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Message, Conversation } from '@/types';
import { timeAgo } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import ImageUploader from '@/components/ui/ImageUploader';

interface Props {
  conversationId: string;
  currentUserId: string;
}

export default function ChatWindow({ conversationId, currentUserId }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${conversationId}`);
      return res.json() as Promise<{ messages: Message[]; conversation: Conversation }>;
    },
  });

  const messages = data?.messages ?? [];
  const conversation = data?.conversation;
  const otherParticipant = conversation?.participants.find((p) => p.id !== currentUserId);

  // Real-time via Supabase (replaces Pusher)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (payload: {
      content?: string;
      media_url?: string;
      media_type?: 'image' | 'audio' | 'video';
    }) => {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMutation.mutate({ content: trimmed });
    setText('');
    textareaRef.current?.focus();
  }, [text, sendMutation]);

  const handleImageUpload = useCallback(
    (url: string) => {
      const supabase = createClient();
      // url comes from Supabase Storage via ImageUploader
      sendMutation.mutate({ media_url: url, media_type: 'image' });
      setShowAttach(false);
    },
    [sendMutation]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const grouped = messages.reduce<{ date: string; messages: Message[] }[]>((acc, msg) => {
    const d = new Date(msg.created_at).toLocaleDateString('es', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const last = acc[acc.length - 1];
    if (last?.date === d) {
      last.messages.push(msg);
    } else {
      acc.push({ date: d, messages: [msg] });
    }
    return acc;
  }, []);

  return (
    <div className="fixed inset-0 bg-white dark:bg-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-black/95 backdrop-blur-md pt-safe">
        <button
          onClick={() => router.back()}
          className="p-1.5 text-gray-700 dark:text-gray-300"
        >
          <ChevronLeft size={24} />
        </button>
        {otherParticipant && (
          <div className="flex items-center gap-2.5 flex-1">
            <Avatar
              src={otherParticipant.image}
              alt={otherParticipant.name ?? otherParticipant.username ?? ''}
              size="sm"
            />
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                {otherParticipant.name ?? otherParticipant.username}
              </p>
            </div>
          </div>
        )}
        {conversation?.is_group && (
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {conversation.group_name?.[0]}
              </span>
            </div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">
              {conversation.group_name}
            </p>
          </div>
        )}
        <div className="flex items-center gap-0.5">
          <button className="p-2 text-gray-700 dark:text-gray-300">
            <Phone size={20} />
          </button>
          <button className="p-2 text-gray-700 dark:text-gray-300">
            <Video size={20} />
          </button>
          <button className="p-2 text-gray-700 dark:text-gray-300">
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {isLoading && (
          <div className="space-y-3 pt-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} gap-2`}
              >
                {i % 2 !== 0 && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 skeleton" />
                )}
                <div
                  className={`h-10 rounded-2xl skeleton ${
                    i % 2 === 0
                      ? 'bg-blue-200 dark:bg-blue-900 w-48'
                      : 'bg-gray-200 dark:bg-gray-700 w-40'
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              <span className="text-[11px] text-gray-400 font-medium capitalize">
                {group.date}
              </span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            </div>

            {group.messages.map((msg, i) => {
              const isMine = msg.sender_id === currentUserId;
              const prevMsg = group.messages[i - 1];
              const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    isMine ? 'justify-end' : 'justify-start'
                  } mb-0.5`}
                >
                  {!isMine && (
                    <div className="w-7 flex-shrink-0 mb-1">
                      {showAvatar && (
                        <Avatar
                          src={msg.sender?.image}
                          alt={msg.sender?.name ?? msg.sender?.username ?? ''}
                          size="xs"
                        />
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] flex flex-col ${
                      isMine ? 'items-end' : 'items-start'
                    }`}
                  >
                    {msg.reply_to && (
                      <div
                        className={`px-3 py-1.5 rounded-xl mb-0.5 text-xs opacity-70 border ${
                          isMine
                            ? 'border-blue-400 text-blue-100 bg-blue-600'
                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        <p className="font-semibold mb-0.5">
                          {msg.reply_to.sender?.name ?? msg.reply_to.sender?.username}
                        </p>
                        <p className="truncate max-w-[200px]">{msg.reply_to.content}</p>
                      </div>
                    )}

                    {msg.media_url && msg.media_type === 'image' && (
                      <img
                        src={msg.media_url}
                        alt="imagen"
                        className="max-w-[240px] rounded-2xl overflow-hidden"
                        loading="lazy"
                      />
                    )}

                    {msg.media_url && msg.media_type === 'audio' && (
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-2xl ${
                          isMine ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <button
                          className={`p-1.5 rounded-full ${
                            isMine ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill={isMine ? 'white' : 'currentColor'}
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </button>
                        <audio src={msg.media_url} className="hidden" />
                        <div
                          className={`flex-1 h-1 rounded-full ${
                            isMine ? 'bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className="h-full w-0 bg-white rounded-full" />
                        </div>
                        <span
                          className={`text-[11px] ${
                            isMine ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          0:00
                        </span>
                      </div>
                    )}

                    {msg.content && (
                      <div
                        className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                          isMine
                            ? 'bubble-sent bg-blue-500 text-white'
                            : 'bubble-received bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}

                    <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                      {timeAgo(msg.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black pb-safe">
        {showAttach && (
          <div className="flex gap-3 mb-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-2xl">
            <ImageUploader
              onUpload={handleImageUpload}
              folder="messages"
              accept="image/*"
              className="flex-1"
            >
              <div className="flex flex-col items-center gap-1 py-3 text-blue-500">
                <Image size={24} />
                <span className="text-xs">Foto</span>
              </div>
            </ImageUploader>
            <button className="flex-1 flex flex-col items-center gap-1 py-3 text-green-500">
              <Mic size={24} />
              <span className="text-xs">Audio</span>
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowAttach((a) => !a)}
            className={`p-2 transition-colors flex-shrink-0 ${
              showAttach ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Plus size={24} />
          </button>

          <div className="flex-1 min-h-[40px] max-h-[120px] flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3.5 py-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mensaje..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none max-h-[80px] leading-5"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 80) + 'px';
              }}
            />
            <button className="ml-1 text-gray-400 flex-shrink-0">
              <Smile size={18} />
            </button>
          </div>

          {text.trim() ? (
            <button
              onClick={handleSend}
              disabled={sendMutation.isPending}
              className="p-2 bg-blue-500 rounded-full text-white flex-shrink-0 disabled:opacity-60"
            >
              <Send size={18} />
            </button>
          ) : (
            <button className="text-blue-500 font-bold text-lg flex-shrink-0 px-1">
              ♥
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
