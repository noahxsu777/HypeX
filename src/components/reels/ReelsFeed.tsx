'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, Bookmark, Music2, Volume2, VolumeX } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { Reel } from '@/types';
import { formatCount } from '@/lib/utils';

async function fetchReels(cursor?: string) {
  const url = cursor ? `/api/reels?cursor=${cursor}` : '/api/reels';
  const res = await fetch(url);
  return res.json() as Promise<{ reels: Reel[]; nextCursor: string | null }>;
}

export default function ReelsFeed() {
  const qc = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['reels'],
    queryFn: ({ pageParam }) => fetchReels(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const reels = data?.pages.flatMap(p => p.reels) ?? [];

  // Load more when near end
  useEffect(() => {
    if (currentIndex >= reels.length - 2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [currentIndex, reels.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const index = Math.round(scrollTop / clientHeight);
    setCurrentIndex(index);
  }, []);

  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎬</div>
          <h3 className="text-white font-bold text-lg">Sin reels</h3>
          <p className="text-gray-400 text-sm mt-1">Crea el primer reel</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory bg-black"
      style={{ scrollbarWidth: 'none' }}
    >
      {reels.map((reel, i) => (
        <ReelItem
          key={reel.id}
          reel={reel}
          isActive={i === currentIndex}
          muted={muted}
          onToggleMute={() => setMuted(m => !m)}
          onLike={() => {
            qc.setQueryData(['reels'], (old: any) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page: any) => ({
                  ...page,
                  reels: page.reels.map((r: Reel) =>
                    r.id === reel.id
                      ? {
                          ...r,
                          isLiked: !r.isLiked,
                          _count: {
                            ...r._count,
                            likes: (r._count?.likes ?? 0) + (r.isLiked ? -1 : 1),
                          },
                        }
                      : r
                  ),
                })),
              };
            });
          }}
        />
      ))}
    </div>
  );
}

function ReelItem({
  reel,
  isActive,
  muted,
  onToggleMute,
  onLike,
}: {
  reel: Reel;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onLike: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLiked, setIsLiked] = useState(reel.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(reel._count?.likes ?? 0);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const handleLike = async () => {
    setIsLiked(l => !l);
    setLikeCount(c => c + (isLiked ? -1 : 1));
    onLike();
    await fetch(`/api/reels/${reel.id}/like`, { method: 'POST' });
  };

  return (
    <div className="relative w-full h-screen snap-start snap-always overflow-hidden bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        playsInline
        muted={muted}
        preload={isActive ? 'auto' : 'none'}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Mute button */}
      <button
        onClick={onToggleMute}
        className="absolute top-14 right-4 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Right actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
        <ActionBtn icon={<Heart size={28} fill={isLiked ? 'currentColor' : 'none'} />} label={formatCount(likeCount)} onClick={handleLike} active={isLiked} color={isLiked ? 'text-red-500' : 'text-white'} />
        <ActionBtn icon={<MessageCircle size={28} />} label={formatCount(reel._count?.comments ?? 0)} color="text-white" />
        <ActionBtn icon={<Share2 size={26} />} label="Compartir" color="text-white" />
        <ActionBtn icon={<Bookmark size={26} />} label="Guardar" color="text-white" />

        {/* Spinning album art */}
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/60 mt-1">
          {reel.user?.image ? (
            <img src={reel.user.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Music2 size={16} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-6 left-3 right-16">
        <Link href={`/profile/${reel.user?.username}`} className="flex items-center gap-2 mb-2">
          <Avatar src={reel.user?.image} alt={reel.user?.name || ''} size="sm" />
          <span className="text-white font-semibold text-sm">{reel.user?.username}</span>
        </Link>
        {reel.caption && (
          <p className="text-white text-sm leading-relaxed line-clamp-2">{reel.caption}</p>
        )}
        {(reel.audioTitle || reel.audioArtist) && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Music2 size={12} className="text-white/80" />
            <p className="text-white/80 text-xs truncate">
              {reel.audioTitle ?? reel.audioArtist ?? 'Sonido original'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  active,
  color = 'text-white',
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  color?: string;
}) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${color}`}>
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
