import { useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import Avatar from '../components/common/Avatar';
import { useStore } from '../store/useStore';
import { timeAgo } from '../utils/helpers';
import type { Notification } from '../types';

const typeIcons: Record<Notification['type'], string> = {
  like: '❤️',
  comment: '💬',
  follow: '👤',
  mention: '@',
  tag: '🏷️',
  story_view: '👁️',
  live: '🔴',
};

export default function NotificationsPage() {
  const { notifications, markAllNotificationsRead, toggleFollow, users } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => markAllNotificationsRead(), 2000);
    return () => clearTimeout(timer);
  }, []);

  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  const NotifItem = ({ notif }: { notif: Notification }) => {
    const isFollowNotif = notif.type === 'follow';
    const user = users.find(u => u.id === notif.fromUser.id);
    const isFollowing = user?.isFollowing ?? false;

    return (
      <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
        <div className="relative flex-shrink-0">
          <Avatar src={notif.fromUser.avatar} alt={notif.fromUser.username} size="md" />
          <span className="absolute -bottom-0.5 -right-0.5 text-xs w-5 h-5 bg-white dark:bg-black rounded-full flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700">
            {typeIcons[notif.type]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 dark:text-white">
            <span className="font-semibold">{notif.fromUser.username}</span>{' '}
            <span className="text-gray-600 dark:text-gray-400">{notif.text}</span>{' '}
            <span className="text-gray-400 text-xs">{timeAgo(notif.createdAt)}</span>
          </p>
        </div>
        {isFollowNotif ? (
          <button
            onClick={() => toggleFollow(notif.fromUser.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex-shrink-0 transition-colors ${
              isFollowing
                ? 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {isFollowing ? 'Siguiendo' : 'Seguir'}
          </button>
        ) : notif.post ? (
          <img
            src={notif.post.media[0]?.url}
            alt=""
            className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
          />
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar title="Notificaciones" showActions={false} />
      <div className="pt-14">
        {unread.length > 0 && (
          <div>
            <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Nuevas
            </h3>
            {unread.map(n => <NotifItem key={n.id} notif={n} />)}
          </div>
        )}
        {read.length > 0 && (
          <div>
            <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-2">
              Anteriores
            </h3>
            {read.map(n => <NotifItem key={n.id} notif={n} />)}
          </div>
        )}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-3xl">
              🔔
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-white">Actividad en tus publicaciones</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Cuando alguien interactúe con tu contenido, lo verás aquí.
              </p>
            </div>
          </div>
        )}
        <div className="h-20" />
      </div>
    </div>
  );
}
