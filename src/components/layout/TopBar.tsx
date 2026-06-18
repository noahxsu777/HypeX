import { Link, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, ChevronLeft, Sun, Moon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/helpers';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  showActions?: boolean;
  transparent?: boolean;
  rightElement?: React.ReactNode;
}

export default function TopBar({
  title,
  showBack = false,
  showActions = true,
  transparent = false,
  rightElement,
}: TopBarProps) {
  const navigate = useNavigate();
  const { getUnreadNotificationsCount, getUnreadMessagesCount, darkMode, toggleDarkMode } = useStore();
  const unreadNotifs = getUnreadNotificationsCount();
  const unreadMsgs = getUnreadMessagesCount();

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4',
      transparent
        ? 'bg-transparent'
        : 'bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800'
    )}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className={cn(
              'p-1 rounded-full transition-colors',
              transparent ? 'text-white' : 'text-gray-900 dark:text-white'
            )}
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {title ? (
          <h1 className={cn(
            'text-lg font-semibold',
            transparent ? 'text-white' : 'text-gray-900 dark:text-white'
          )}>
            {title}
          </h1>
        ) : (
          <Link to="/" className="flex items-center gap-1">
            <span className="text-2xl font-black gradient-text tracking-tight">HypeX</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        {rightElement}
        {showActions && (
          <>
            <button
              onClick={toggleDarkMode}
              className={cn(
                'p-2 rounded-full transition-colors',
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {darkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <Link
              to="/notifications"
              className={cn(
                'relative p-2 rounded-full transition-colors',
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Bell size={22} />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </Link>
            <Link
              to="/messages"
              className={cn(
                'relative p-2 rounded-full transition-colors',
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <MessageCircle size={22} />
              {unreadMsgs > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unreadMsgs > 9 ? '9+' : unreadMsgs}
                </span>
              )}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
