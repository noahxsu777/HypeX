'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Story, Profile } from '@/types';
import Avatar from '@/components/ui/Avatar';
import StoryViewer from '@/components/stories/StoryViewer';

interface StoriesBarProps {
  className?: string;
}

function StorySkeletonItem() {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 skeleton" />
      <div className="h-2.5 w-12 bg-gray-200 dark:bg-gray-700 rounded skeleton" />
    </div>
  );
}

export default function StoriesBar({ className }: StoriesBarProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setProfile(data));
      }
    });
  }, []);

  useEffect(() => {
    fetch('/api/stories')
      .then((r) => r.json())
      .then((json) => setStories(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openStory = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          'flex gap-4 px-4 py-3 overflow-x-auto no-scrollbar',
          'bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900',
          className
        )}
      >
        {/* My story */}
        {profile && (
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <Link href="/stories/create" className="relative">
              <Avatar
                src={profile.image}
                alt={profile.name ?? profile.username ?? 'Tu historia'}
                size="lg"
                className="ring-2 ring-gray-200 dark:ring-gray-700"
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white dark:ring-black">
                <Plus size={12} className="text-white" strokeWidth={3} />
              </span>
            </Link>
            <span className="text-[11px] text-gray-600 dark:text-gray-400 truncate w-16 text-center">
              Tu historia
            </span>
          </div>
        )}

        {/* Other stories */}
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <StorySkeletonItem key={i} />)
          : stories.length === 0 && !profile
          ? null
          : stories.map((story, i) => (
              <button
                key={story.id}
                type="button"
                onClick={() => openStory(i)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 focus:outline-none"
              >
                <Avatar
                  src={story.user.image}
                  alt={story.user.name ?? story.user.username ?? ''}
                  size="lg"
                  hasStory
                  storyViewed={story.is_viewed}
                />
                <span className="text-[11px] text-gray-600 dark:text-gray-400 truncate w-16 text-center">
                  {story.user.username}
                </span>
              </button>
            ))}
      </div>

      {viewerOpen && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
