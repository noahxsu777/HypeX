'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Story } from '@/types';
import Avatar from '@/components/ui/Avatar';
import VideoPlayer from '@/components/ui/VideoPlayer';

const STORY_DURATION_MS = 5000;

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('image')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setUserImage(data?.image ?? null));
      }
    });
  }, []);

  const story = stories[currentIndex];
  const duration = (story?.duration ?? STORY_DURATION_MS / 1000) * 1000;

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      elapsedRef.current = 0;
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      elapsedRef.current = 0;
    }
  }, [currentIndex]);

  useEffect(() => {
    if (paused || showReply) return;
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      goNext();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      elapsedRef.current += Date.now() - startTimeRef.current;
    };
  }, [currentIndex, paused, showReply, duration, goNext]);

  useEffect(() => {
    if (!story) return;
    fetch(`/api/stories/${story.id}/view`, { method: 'POST' }).catch(() => {});
  }, [story]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goNext, goPrev]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showReply) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      goPrev();
    } else {
      goNext();
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`/api/stories/${story.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      setReplyText('');
      setShowReply(false);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  if (!story) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="story-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={`Historia de ${story.user.name}`}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 px-3 pt-safe pt-2">
          {stories.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              {i < currentIndex ? (
                <div className="h-full w-full bg-white" />
              ) : i === currentIndex ? (
                <div
                  key={`prog-${currentIndex}`}
                  className={cn(
                    'h-full bg-white story-progress-animate',
                    !paused && !showReply && 'story-progress-animate'
                  )}
                  style={{
                    animationDuration: `${duration}ms`,
                    animationPlayState: paused || showReply ? 'paused' : 'running',
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>

        {/* Header */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 pt-safe"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
        >
          <Avatar
            src={story.user.image}
            alt={story.user.name ?? story.user.username ?? ''}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-none truncate">
              {story.user.username}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Story media */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          onClick={handleTap}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
        >
          {story.media_type === 'video' ? (
            <VideoPlayer
              src={story.media_url}
              autoPlay
              muted={false}
              loop={false}
              className="w-full h-full"
            />
          ) : (
            <Image
              src={story.media_url}
              alt={`Historia de ${story.user.name}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          )}
        </div>

        {/* Reply area */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-safe">
          <AnimatePresence mode="wait">
            {showReply ? (
              <motion.form
                key="reply-input"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                onSubmit={handleReply}
                className="flex items-center gap-3 px-4 pb-6 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar
                  src={userImage}
                  alt="Yo"
                  size="sm"
                  className="flex-shrink-0"
                />
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Responder a ${story.user.username}…`}
                  autoFocus
                  className={cn(
                    'flex-1 glass rounded-full px-4 py-2.5 text-sm text-white',
                    'placeholder-white/60 border border-white/30',
                    'focus:outline-none focus:border-white/60'
                  )}
                  onKeyDown={(e) => e.key === 'Escape' && setShowReply(false)}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="text-white disabled:opacity-40 transition-opacity"
                  aria-label="Enviar respuesta"
                >
                  <Send size={22} />
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="reply-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center px-4 pb-8 pt-4"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReply(true);
                  }}
                  className={cn(
                    'flex items-center gap-2 glass rounded-full px-6 py-2.5',
                    'border border-white/20 text-white/80 text-sm'
                  )}
                  aria-label="Responder a la historia"
                >
                  <Send size={16} />
                  <span>Responder…</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
