import TopBar from '@/components/layout/TopBar';
import NotificationsFeed from '@/components/notifications/NotificationsFeed';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar title="Notificaciones" />
      <div className="pt-14">
        <NotificationsFeed />
      </div>
    </div>
  );
}
