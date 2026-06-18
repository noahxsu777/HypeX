'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import type { Session } from 'next-auth';

interface Props {
  children: React.ReactNode;
  user: Session['user'];
}

export default function MainLayout({ children, user }: Props) {
  const pathname = usePathname();
  const isFullscreen = pathname === '/reels';
  const hideNav = pathname === '/create' || pathname.startsWith('/messages/');

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <main className={isFullscreen ? '' : 'pb-16'}>
        {children}
      </main>
      {!hideNav && <BottomNav user={user} />}
    </div>
  );
}
