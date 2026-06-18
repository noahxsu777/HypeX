import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Heart } from 'lucide-react';
import type { Post } from '../../types';
import Avatar from '../common/Avatar';
import { useStore } from '../../store/useStore';
import { formatCount, timeAgo } from '../../utils/helpers';

interface CommentsSheetProps {
  post: Post;
  onClose: () => void;
}

export default function CommentsSheet({ post, onClose }: CommentsSheetProps) {
  const { currentUser } = useStore();
  const [text, setText] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative bg-white dark:bg-gray-900 rounded-t-3xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Comentarios</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {post.comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar src={comment.user.avatar} alt={comment.user.username} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-semibold">{comment.user.username}</span>{' '}
                  {comment.text}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-[11px] text-gray-400">{timeAgo(comment.createdAt)}</span>
                  <button className="text-[11px] text-gray-400 font-medium">Responder</button>
                  {comment.likes > 0 && (
                    <span className="text-[11px] text-gray-400">{formatCount(comment.likes)} me gusta</span>
                  )}
                </div>
              </div>
              <button className="flex flex-col items-center gap-0.5 self-center">
                <Heart size={14} className={comment.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
              </button>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700 pb-safe">
          <Avatar src={currentUser.avatar} alt={currentUser.username} size="sm" />
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center px-4 py-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Añade un comentario..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
          <button
            className={`text-blue-500 font-semibold text-sm ${!text ? 'opacity-40' : ''}`}
            disabled={!text}
          >
            Publicar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
