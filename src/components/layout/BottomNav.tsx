import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, Film, User } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/helpers';

export default function BottomNav() {
  const location = useLocation();
  const { getUnreadMessagesCount } = useStore();
  const unreadMsgs = getUnreadMessagesCount();

  const isReels = location.pathname === '/reels';

  const links = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/explore', icon: Search, label: 'Explorar' },
    { to: '/create', icon: PlusSquare, label: 'Crear' },
    { to: '/reels', icon: Film, label: 'Reels' },
    { to: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 bottom-nav',
      isReels
        ? 'bg-transparent'
        : 'bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800'
    )}>
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200',
              isActive
                ? isReels
                  ? 'text-white'
                  : 'text-black dark:text-white'
                : isReels
                  ? 'text-white/60'
                  : 'text-gray-400 dark:text-gray-500',
            )}
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className={isActive ? 'scale-110 transition-transform' : ''}
                  />
                  {to === '/profile' && unreadMsgs > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-medium',
                  isActive ? 'opacity-100' : 'opacity-0'
                )}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
