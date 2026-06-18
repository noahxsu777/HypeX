'use client';
import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo, formatCount } from '@/lib/utils';
import type { Post } from '@/types';
import Avatar from '@/components/ui/Avatar';
import VideoPlayer from '@/components/ui/VideoPlayer';
import CommentsSheet from './CommentsSheet';

interface PostCardProps {
  post: Post;
  /** Optional current user id – unused but accepted for compat with HomeFeed */
  currentUserId?: string;
}

function Caption({ username, text }: { username: string; text: string }) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = text.length > 120 && !expanded;
  const display = shouldTruncate ? text.slice(0, 120) + '…' : text;

  const parts = display.split(/(#\w+)/g);

  return (
    <p className="text-sm text-gray-900 dark:text-white leading-snug">
      <Link
        href={`/profile/${username}`}
        className="font-semibold mr-1.5 hover:underline"
      >
        {username}
      </Link>
      {parts.map((part, i) =>
        part.startsWith('#') ? (
          <Link
            key={i}
            href={`/explore/tags/${part.slice(1)}`}
            className="text-blue-500 hover:underline"
          >
            {part}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
        >
          más
        </button>
      )}
    </p>
  );
}

export default function PostCard({ post }: PostCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [saved, setSaved] = useState(post.isSaved ?? false);
  const [showHeart, setShowHeart] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const heartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef(0);
  const mutingRef = useRef(false);

  const mediaUrls = post.mediaUrls ?? [];
  const isCarousel = mediaUrls.length > 1;

  const doLike = useCallback(async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    try {
      await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
    } catch {
      // revert on error
      setLiked(!next);
      setLikeCount((c) => (next ? Math.max(0, c - 1) : c + 1));
    }
  }, [liked, post.id]);

  const handleDoubleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const now = Date.now();
      if (now - lastTapRef.current < 350) {
        e.preventDefault();
        if (!liked) {
          doLike();
        }
        setShowHeart(true);
        if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
        heartTimerRef.current = setTimeout(() => setShowHeart(false), 700);
      }
      lastTapRef.current = now;
    },
    [liked, doLike]
  );

  const handleSave = useCallback(async () => {
    const next = !saved;
    setSaved(next);
    try {
      await fetch(`/api/posts/${post.id}/save`, { method: 'POST' });
    } catch {
      setSaved(!next);
    }
  }, [saved, post.id]);

  const prev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const next = () => setCurrentIndex((i) => Math.min(mediaUrls.length - 1, i + 1));

  return (
    <article className="bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Link href={`/profile/${post.user.username}`}>
          <Avatar
            src={post.user.image}
            alt={post.user.name}
            size="md"
            hasStory
            storyViewed={false}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Link
              href={`/profile/${post.user.username}`}
              className="font-semibold text-sm text-gray-900 dark:text-white hover:underline truncate"
            >
              {post.user.username}
            </Link>
            {post.user.isVerified && (
              <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" />
            )}
          </div>
          {post.location && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {post.location}
            </p>
          )}
        </div>
        <button
          type="button"
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          aria-label="Más opciones"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Media */}
      <div
        className="relative aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden select-none"
        onClick={handleDoubleTap}
        onTouchEnd={handleDoubleTap}
      >
        {mediaUrls.length > 0 ? (
          post.type === 'video' ? (
            <VideoPlayer
              src={mediaUrls[0]}
              poster={undefined}
              autoPlay
              muted
              loop
              className="w-full h-full"
            />
          ) : (
            <Image
              src={mediaUrls[currentIndex]}
              alt={`Post de ${post.user.username}`}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              priority={false}
            />
          )
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-800" />
        )}

        {/* Carousel navigation */}
        {isCarousel && (
          <>
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
                aria-label="Anterior"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {currentIndex < mediaUrls.length - 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
                aria-label="Siguiente"
              >
                <ChevronRight size={20} />
              </button>
            )}
            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {mediaUrls.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-full transition-all',
                    i === currentIndex
                      ? 'w-2 h-2 bg-blue-500'
                      : 'w-1.5 h-1.5 bg-white/60'
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Heart burst animation on double-tap */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              size={90}
              className="heart-burst text-white fill-white drop-shadow-lg"
            />
          </div>
        )}
      </div>

      {/* Actions row */}
      <div className="px-3 pt-2 pb-1 flex items-center gap-3">
        <button
          type="button"
          onClick={doLike}
          className={cn(
            'transition-transform active:scale-90',
            liked ? 'text-red-500' : 'text-gray-900 dark:text-white'
          )}
          aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
        >
          <Heart
            size={26}
            className={cn(liked && 'fill-red-500')}
          />
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen(true)}
          className="text-gray-900 dark:text-white transition-transform active:scale-90"
          aria-label="Comentarios"
        >
          <MessageCircle size={26} />
        </button>
        <button
          type="button"
          className="text-gray-900 dark:text-white transition-transform active:scale-90"
          aria-label="Compartir"
        >
          <Send size={24} />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            'transition-transform active:scale-90',
            saved ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'
          )}
          aria-label={saved ? 'Quitar guardado' : 'Guardar'}
        >
          <Bookmark
            size={26}
            className={cn(saved && 'fill-current')}
          />
        </button>
      </div>

      {/* Like count */}
      {likeCount > 0 && (
        <div className="px-3 pb-0.5">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCount(likeCount)} Me gusta
          </span>
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-3 pb-1">
          <Caption username={post.user.username} text={post.caption} />
        </div>
      )}

      {/* View comments */}
      {(post._count?.comments ?? 0) > 0 && (
        <div className="px-3 pb-1">
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Ver {post._count!.comments} comentarios
          </button>
        </div>
      )}

      {/* Timestamp */}
      <div className="px-3 pb-3">
        <span className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          {timeAgo(post.createdAt)}
        </span>
      </div>

      {/* Comments sheet */}
      <CommentsSheet
        postId={post.id}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </article>
  );
}
