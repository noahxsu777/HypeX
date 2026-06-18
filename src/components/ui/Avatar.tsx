'use client';
import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hasStory?: boolean;
  storyViewed?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizes = { xs: 28, sm: 36, md: 44, lg: 56, xl: 80, '2xl': 112 };
const sizeClass = {
  xs: 'w-7 h-7',
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
  '2xl': 'w-28 h-28',
};

export default function Avatar({
  src,
  alt,
  size = 'md',
  hasStory = false,
  storyViewed = false,
  className,
  onClick,
}: AvatarProps) {
  const px = sizes[size];

  const imageEl = src ? (
    <div className={cn('relative rounded-full overflow-hidden', sizeClass[size])}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${px}px`}
        className="object-cover"
      />
    </div>
  ) : (
    <div
      className={cn(
        'rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center',
        sizeClass[size]
      )}
    >
      <User
        className="text-gray-400 dark:text-gray-500"
        size={Math.round(px * 0.5)}
      />
    </div>
  );

  if (hasStory) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn('flex-shrink-0 focus:outline-none', className)}
      >
        <div className={storyViewed ? 'story-ring-viewed' : 'story-ring'}>
          <div className="story-ring-inner">{imageEl}</div>
        </div>
      </button>
    );
  }

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'rounded-full overflow-hidden flex-shrink-0',
        onClick && 'cursor-pointer focus:outline-none',
        className
      )}
    >
      {imageEl}
    </div>
  );
}
