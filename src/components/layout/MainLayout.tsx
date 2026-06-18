'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

interface Props {
  children: React.ReactNode;
  currentUserId: string;
  currentUserImage: string | null;
}

export default function MainLayout({ children, currentUserId, currentUserImage }: Props) {
  const pathname = usePathname();
  const isFullscreen = pathname === '/reels';
  const hideNav = pathname === '/create' || pathname.startsWith('/messages/');

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <main className={isFullscreen ? '' : 'pb-16'}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
