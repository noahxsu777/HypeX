import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NotificationsFeed from '@/components/notifications/NotificationsFeed';
import TopBar from '@/components/layout/TopBar';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar title="Notificaciones" />
      <div className="pt-14">
        <NotificationsFeed currentUserId={user.id} />
      </div>
    </div>
  );
}
