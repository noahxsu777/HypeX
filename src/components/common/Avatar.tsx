import { cn } from '../../utils/helpers';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hasStory?: boolean;
  isViewed?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizes = {
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
  isViewed = false,
  className,
  onClick,
}: AvatarProps) {
  const img = (
    <img
      src={src}
      alt={alt}
      className={cn('rounded-full object-cover w-full h-full', sizes[size])}
      loading="lazy"
    />
  );

  if (hasStory) {
    return (
      <div
        className={cn('cursor-pointer flex-shrink-0', className)}
        onClick={onClick}
      >
        <div className={cn(
          'rounded-full',
          isViewed
            ? 'bg-gray-300 dark:bg-gray-600 p-[2px]'
            : 'bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 p-[2px]',
        )}>
          <div className="bg-white dark:bg-black rounded-full p-[2px]">
            <img
              src={src}
              alt={alt}
              className={cn('rounded-full object-cover', sizes[size])}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-full overflow-hidden flex-shrink-0', sizes[size], className, onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      {img}
    </div>
  );
}
