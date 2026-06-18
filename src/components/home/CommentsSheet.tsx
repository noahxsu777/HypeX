'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';
import type { Comment } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';

interface CommentsSheetProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 skeleton flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded skeleton" />
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded skeleton" />
        <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded skeleton" />
      </div>
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const [liked, setLiked] = useState(comment.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(comment._count?.likes ?? 0);

  const toggleLike = useCallback(async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    try {
      await fetch(`/api/comments/${comment.id}/like`, { method: 'POST' });
    } catch {
      setLiked(!next);
      setLikeCount((c) => (next ? Math.max(0, c - 1) : c + 1));
    }
  }, [liked, comment.id]);

  return (
    <div className="flex gap-3 px-4 py-2.5">
      <Avatar
        src={comment.user.image}
        alt={comment.user.name}
        size="sm"
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white leading-snug">
          <span className="font-semibold mr-1.5">{comment.user.username}</span>
          {comment.content}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {timeAgo(comment.createdAt)}
          </span>
          {likeCount > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {likeCount} {likeCount === 1 ? 'me gusta' : 'me gusta'}
            </span>
          )}
          <button
            type="button"
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Responder
          </button>
        </div>
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-100 dark:border-gray-800">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <Avatar src={reply.user.image} alt={reply.user.name} size="xs" className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-900 dark:text-white leading-snug">
                    <span className="font-semibold mr-1">{reply.user.username}</span>
                    {reply.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={toggleLike}
        className={cn(
          'flex-shrink-0 self-start mt-0.5 p-1',
          liked ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
        )}
        aria-label="Me gusta comentario"
      >
        <Heart size={14} className={cn(liked && 'fill-red-500')} />
      </button>
    </div>
  );
}

export default function CommentsSheet({ postId, isOpen, onClose }: CommentsSheetProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((json) => setComments(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, postId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim() || submitting) return;
      setSubmitting(true);
      const optimistic: Comment = {
        id: `opt-${Date.now()}`,
        userId: session?.user?.id ?? '',
        user: {
          id: session?.user?.id ?? '',
          name: session?.user?.name ?? '',
          username:
            ((session?.user as unknown) as Record<string, unknown>)?.username as string ?? 'yo',
          email: session?.user?.email ?? '',
          image: session?.user?.image ?? null,
          bio: null,
          website: null,
          isVerified: false,
          isPrivate: false,
          createdAt: new Date(),
        },
        postId,
        reelId: null,
        parentId: null,
        content: text.trim(),
        createdAt: new Date(),
        _count: { likes: 0, replies: 0 },
        isLiked: false,
      };
      setComments((prev) => [optimistic, ...prev]);
      setText('');
      try {
        const res = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: optimistic.content }),
        });
        const json = await res.json();
        if (res.ok && json.data) {
          setComments((prev) =>
            prev.map((c) => (c.id === optimistic.id ? json.data : c))
          );
        }
      } catch {
        // leave optimistic in place
      } finally {
        setSubmitting(false);
      }
    },
    [text, submitting, postId, session]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comentarios">
      {/* Comments list */}
      <div className="min-h-[200px]">
        {loading ? (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
            <p className="text-sm">Sin comentarios aún.</p>
            <p className="text-xs mt-1">Sé el primero en comentar.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Avatar
            src={session?.user?.image}
            alt={session?.user?.name ?? 'Yo'}
            size="sm"
            className="flex-shrink-0"
          />
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Añade un comentario…"
            className={cn(
              'flex-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full',
              'px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 transition'
            )}
            disabled={submitting}
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className={cn(
              'text-sm font-semibold transition-opacity',
              text.trim() && !submitting
                ? 'text-blue-500 hover:text-blue-600'
                : 'text-gray-300 dark:text-gray-600 pointer-events-none'
            )}
          >
            Publicar
          </button>
        </form>
      </div>
    </Modal>
  );
}
