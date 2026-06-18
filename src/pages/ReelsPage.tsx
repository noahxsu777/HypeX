import { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Music, Volume2, VolumeX, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { formatCount } from '../utils/helpers';
import Avatar from '../components/common/Avatar';
import CommentsSheet from '../components/home/CommentsSheet';
import type { Post } from '../types';

export default function ReelsPage() {
  const { reels, toggleLikeReel, toggleSaveReel } = useStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const newIndex = Math.round(scrollTop / clientHeight);
    setActiveIndex(newIndex);
  };

  const handleDoubleTap = (id: string) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      toggleLikeReel(id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTap.current = now;
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-container hide-scrollbar"
        onScroll={handleScroll}
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            className="relative snap-item"
            style={{ height: '100dvh' }}
            onClick={() => handleDoubleTap(reel.id)}
          >
            {/* Video/Thumbnail */}
            {Math.abs(index - activeIndex) <= 1 ? (
              <video
                src={reel.videoUrl}
                poster={reel.thumbnailUrl}
                autoPlay={index === activeIndex}
                loop
                muted={muted}
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <img
                src={reel.thumbnailUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

            {/* Double-tap heart */}
            <AnimatePresence>
              {showHeart && index === activeIndex && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 1.4, opacity: 1 }}
                  exit={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart size={100} className="text-white fill-white drop-shadow-2xl" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mute button */}
            <button
              onClick={e => { e.stopPropagation(); setMuted(m => !m); }}
              className="absolute top-14 right-4 p-2 bg-black/30 rounded-full text-white z-10"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Right actions */}
            <div
              className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10"
              onClick={e => e.stopPropagation()}
            >
              {/* Avatar */}
              <div className="relative mb-2">
                <Avatar src={reel.user.avatar} alt={reel.user.username} size="md" />
                <button className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  +
                </button>
              </div>

              {/* Like */}
              <button
                onClick={() => toggleLikeReel(reel.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className={`p-1.5 rounded-full ${reel.isLiked ? '' : ''}`}>
                  <Heart
                    size={28}
                    className={reel.isLiked ? 'text-red-500 fill-red-500' : 'text-white fill-white/20'}
                    strokeWidth={reel.isLiked ? 0 : 1.5}
                  />
                </div>
                <span className="text-white text-xs font-semibold drop-shadow">
                  {formatCount(reel.likes)}
                </span>
              </button>

              {/* Comment */}
              <button
                onClick={() => setShowComments(true)}
                className="flex flex-col items-center gap-1"
              >
                <MessageCircle size={28} className="text-white fill-white/20" strokeWidth={1.5} />
                <span className="text-white text-xs font-semibold drop-shadow">
                  {formatCount(reel.comments.length)}
                </span>
              </button>

              {/* Share */}
              <button className="flex flex-col items-center gap-1">
                <Share2 size={26} className="text-white" strokeWidth={1.5} />
                <span className="text-white text-xs font-semibold drop-shadow">
                  {formatCount(reel.shares)}
                </span>
              </button>

              {/* Save */}
              <button onClick={() => toggleSaveReel(reel.id)}>
                <Bookmark
                  size={26}
                  className={reel.isSaved ? 'text-white fill-white' : 'text-white'}
                  strokeWidth={1.5}
                />
              </button>

              {/* More */}
              <button>
                <MoreHorizontal size={26} className="text-white" />
              </button>

              {/* Spinning music disc */}
              <div className="w-10 h-10 rounded-full border-2 border-white/40 overflow-hidden animate-spin" style={{ animationDuration: '3s' }}>
                <img src={reel.user.avatar} alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Bottom info */}
            <div
              className="absolute bottom-20 left-3 right-20 z-10"
              onClick={e => e.stopPropagation()}
            >
              <Link to={`/profile/${reel.user.username}`} className="flex items-center gap-2 mb-2">
                <span className="text-white font-bold text-base drop-shadow">
                  @{reel.user.username}
                </span>
                {reel.user.isVerified && (
                  <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </Link>
              <p className="text-white text-sm line-clamp-2 drop-shadow">
                {reel.caption}
              </p>

              {/* Audio bar */}
              <div className="flex items-center gap-2 mt-3">
                <Music size={14} className="text-white animate-pulse" />
                <div className="overflow-hidden flex-1">
                  <p className="text-white text-xs font-medium whitespace-nowrap" style={{
                    animation: 'marquee 8s linear infinite',
                  }}>
                    {reel.audio.title} · {reel.audio.artist}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comments sheet */}
      <AnimatePresence>
        {showComments && (
          <CommentsSheet
            post={{ ...reels[activeIndex], type: 'photo', media: [], createdAt: reels[activeIndex].createdAt } as unknown as Post}
            onClose={() => setShowComments(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
