import { useState } from 'react';
import { Plus } from 'lucide-react';
import Avatar from '../common/Avatar';
import StoryViewer from '../stories/StoryViewer';
import { useStore } from '../../store/useStore';

export default function StoriesBar() {
  const { stories, currentUser, markStoryViewed } = useStore();
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);

  const userStories = stories.reduce((acc, story) => {
    const existing = acc.find(g => g.userId === story.userId);
    if (existing) {
      existing.stories.push(story);
    } else {
      acc.push({ userId: story.userId, user: story.user, stories: [story] });
    }
    return acc;
  }, [] as { userId: string; user: typeof stories[0]['user']; stories: typeof stories }[]);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 py-3">
        {/* My story */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="relative">
            <Avatar src={currentUser.avatar} alt="Tu historia" size="lg" />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-black">
              <Plus size={10} className="text-white" strokeWidth={3} />
            </div>
          </div>
          <span className="text-[11px] text-gray-600 dark:text-gray-400 w-14 text-center truncate">
            Tu historia
          </span>
        </div>

        {/* Other stories */}
        {userStories.map((group, idx) => (
          <div
            key={group.userId}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
            onClick={() => setActiveStoryIdx(idx)}
          >
            <Avatar
              src={group.user.avatar}
              alt={group.user.username}
              size="lg"
              hasStory
              isViewed={group.stories.every(s => s.isViewed)}
            />
            <span className="text-[11px] text-gray-600 dark:text-gray-400 w-14 text-center truncate">
              {group.user.username}
            </span>
          </div>
        ))}
      </div>

      {activeStoryIdx !== null && (
        <StoryViewer
          groups={userStories}
          initialGroupIndex={activeStoryIdx}
          onClose={() => setActiveStoryIdx(null)}
          onStoryView={markStoryViewed}
        />
      )}
    </>
  );
}
