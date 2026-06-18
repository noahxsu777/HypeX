import { useState, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Post } from '../../types';
import Avatar from '../common/Avatar';
import { formatCount, timeAgo } from '../../utils/helpers';
import { useStore } from '../../store/useStore';
import CommentsSheet from './CommentsSheet';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { toggleLikePost, toggleSavePost } = useStore();
  const [currentMedia, setCurrentMedia] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const lastTap = useRef(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!post.isLiked) toggleLikePost(post.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTap.current = now;
  };

  return (
    <article className="bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <Link to={`/profile/${post.user.username}`} className="flex items-center gap-2.5">
          <Avatar
            src={post.user.avatar}
            alt={post.user.username}
            size="sm"
            hasStory
            isViewed={false}
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {post.user.username}
              </span>
              {post.user.isVerified && (
                <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            {post.location && (
              <div className="flex items-center gap-0.5">
                <MapPin size={10} className="text-gray-400" />
                <span className="text-[11px] text-gray-500 dark:text-gray-400">{post.location}</span>
              </div>
            )}
          </div>
        </Link>
        <button className="p-1.5 text-gray-600 dark:text-gray-300">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Media */}
      <div className="relative bg-gray-100 dark:bg-gray-900 aspect-square" onClick={handleDoubleTap}>
        <img
          src={post.media[currentMedia]?.url}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Carousel controls */}
        {post.type === 'carousel' && post.media.length > 1 && (
          <>
            {currentMedia > 0 && (
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white"
                onClick={e => { e.stopPropagation(); setCurrentMedia(i => i - 1); }}
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {currentMedia < post.media.length - 1 && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white"
                onClick={e => { e.stopPropagation(); setCurrentMedia(i => i + 1); }}
              >
                <ChevronRight size={18} />
              </button>
            )}
            {/* Dots */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {post.media.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentMedia ? 'bg-blue-500' : 'bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Double tap heart */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.3, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart size={80} className="text-white fill-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="px-3 pt-2.5 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleLikePost(post.id)}
              className="transition-transform active:scale-90"
            >
              <Heart
                size={26}
                className={post.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-800 dark:text-white'}
                strokeWidth={post.isLiked ? 0 : 2}
              />
            </button>
            <button onClick={() => setShowComments(true)}>
              <MessageCircle size={26} className="text-gray-800 dark:text-white" strokeWidth={1.5} />
            </button>
            <button>
              <Send size={24} className="text-gray-800 dark:text-white" strokeWidth={1.5} />
            </button>
          </div>
          <button onClick={() => toggleSavePost(post.id)}>
            <Bookmark
              size={24}
              className={post.isSaved ? 'text-gray-900 dark:text-white fill-current' : 'text-gray-800 dark:text-white'}
              strokeWidth={1.5}
            />
          </button>
        </div>

        {/* Likes count */}
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {formatCount(post.likes)} Me gusta
        </p>

        {/* Caption */}
        <p className="text-sm text-gray-900 dark:text-white">
          <Link to={`/profile/${post.user.username}`} className="font-semibold hover:opacity-80">
            {post.user.username}
          </Link>{' '}
          <span className="font-normal">{post.caption.replace(/#\w+/g, '')}</span>
          {post.hashtags.map(tag => (
            <Link key={tag} to={`/hashtag/${tag}`} className="text-blue-500 hover:text-blue-600"> #{tag}</Link>
          ))}
        </p>

        {/* Comments preview */}
        {post.comments.length > 0 && (
          <button
            className="text-sm text-gray-400 dark:text-gray-500 mt-1"
            onClick={() => setShowComments(true)}
          >
            Ver los {post.comments.length} comentarios
          </button>
        )}

        {/* Timestamp */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wide">
          {timeAgo(post.createdAt)}
        </p>
      </div>

      {/* Comments sheet */}
      <AnimatePresence>
        {showComments && (
          <CommentsSheet post={post} onClose={() => setShowComments(false)} />
        )}
      </AnimatePresence>
    </article>
  );
}
