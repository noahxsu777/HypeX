'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, Film, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';

interface BottomNavProps {
  unreadNotifications?: number;
  unreadMessages?: number;
  /** Optional pre-fetched user (from MainLayout server component) */
  user?: { id?: string; name?: string | null; image?: string | null; email?: string | null } | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  isCreate?: boolean;
}

export default function BottomNav({ unreadNotifications: _unreadNotifications, unreadMessages: _unreadMessages }: BottomNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isReels = pathname === '/reels';

  const items: NavItem[] = [
    {
      href: '/',
      label: 'Inicio',
      icon: <Home size={26} />,
    },
    {
      href: '/explore',
      label: 'Explorar',
      icon: <Search size={26} />,
    },
    {
      href: '/create',
      label: 'Crear',
      icon: <PlusSquare size={28} />,
      isCreate: true,
    },
    {
      href: '/reels',
      label: 'Reels',
      icon: <Film size={26} />,
    },
    {
      href: '/profile',
      label: 'Perfil',
      icon:
        session?.user?.image ? (
          <Avatar
            src={session.user.image}
            alt={session.user.name ?? 'Perfil'}
            size="xs"
            className={cn(
              'ring-2 ring-offset-1',
              pathname === '/profile'
                ? 'ring-purple-500'
                : 'ring-transparent'
            )}
          />
        ) : (
          <User size={26} />
        ),
    },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 pb-safe',
        isReels
          ? 'bg-transparent'
          : 'nav-blur border-t border-gray-200 dark:border-gray-800'
      )}
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around px-2 h-14">
        {items.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          if (item.isCreate) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="flex items-center justify-center"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-md text-white">
                  <PlusSquare size={24} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                'flex flex-col items-center justify-center w-12 h-full transition-opacity',
                isReels
                  ? isActive
                    ? 'text-white opacity-100'
                    : 'text-white opacity-60'
                  : isActive
                  ? 'text-gray-900 dark:text-white opacity-100'
                  : 'text-gray-400 dark:text-gray-500 opacity-100'
              )}
            >
              {item.icon}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
