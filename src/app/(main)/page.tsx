import { auth } from '@/lib/auth';
import HomeFeed from '@/components/home/HomeFeed';
import TopBar from '@/components/layout/TopBar';

export default async function HomePage() {
  const session = await auth();
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar
        right={
          <div className="flex items-center gap-1">
            <NotificationsLink />
            <MessagesLink />
          </div>
        }
      />
      <div className="pt-14">
        <HomeFeed userId={session!.user!.id as string} />
      </div>
    </div>
  );
}

function NotificationsLink() {
  return (
    <a href="/notifications" className="relative p-2 text-gray-700 dark:text-gray-300">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    </a>
  );
}

function MessagesLink() {
  return (
    <a href="/messages" className="p-2 text-gray-700 dark:text-gray-300">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </a>
  );
}
