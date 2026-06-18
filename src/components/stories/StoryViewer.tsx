import { useState, useEffect, useCallback } from 'react';
import { X, Heart, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Story, User } from '../../types';
import Avatar from '../common/Avatar';
import { timeAgo } from '../../utils/helpers';

interface StoryGroup {
  userId: string;
  user: User;
  stories: Story[];
}

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onStoryView: (storyId: string) => void;
}

export default function StoryViewer({ groups, initialGroupIndex, onClose, onStoryView }: StoryViewerProps) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');

  const currentGroup = groups[groupIdx];
  const currentStory = currentGroup?.stories[storyIdx];

  const STORY_DURATION = 5000;

  const goNext = useCallback(() => {
    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx(idx => idx + 1);
      setProgress(0);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(idx => idx + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIdx, groupIdx, currentGroup, groups, onClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(idx => idx - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      setGroupIdx(idx => idx - 1);
      setStoryIdx(0);
      setProgress(0);
    }
  }, [storyIdx, groupIdx]);

  useEffect(() => {
    if (currentStory) {
      onStoryView(currentStory.id);
    }
  }, [currentStory?.id]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + (100 / (STORY_DURATION / 50));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [paused, goNext, storyIdx, groupIdx]);

  if (!currentStory) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
    >
      <div
        className="relative w-full h-full max-w-sm mx-auto"
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) goPrev();
          else goNext();
        }}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Story image */}
        <img
          src={currentStory.media.url}
          alt=""
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1">
          {currentGroup.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-0.5 bg-white/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar src={currentGroup.user.avatar} alt={currentGroup.user.username} size="sm" />
            <div>
              <p className="text-white font-semibold text-sm">{currentGroup.user.username}</p>
              <p className="text-white/70 text-xs">{timeAgo(currentStory.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white p-1">
            <X size={22} />
          </button>
        </div>

        {/* Reply bar */}
        <div
          className="absolute bottom-8 left-4 right-4 flex items-center gap-3"
          onPointerDown={e => e.stopPropagation()}
        >
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Responder..."
            className="flex-1 bg-white/20 text-white placeholder-white/60 rounded-full px-4 py-2.5 text-sm backdrop-blur-sm border border-white/30 focus:outline-none focus:border-white/60"
          />
          <button className="text-white">
            <Heart size={24} />
          </button>
          <button className="text-white">
            <Send size={22} />
          </button>
        </div>

        {/* Navigation areas (invisible) */}
        <div className="absolute inset-y-1/4 left-0 w-1/3" />
        <div className="absolute inset-y-1/4 right-0 w-1/3" />
      </div>
    </motion.div>
  );
}
