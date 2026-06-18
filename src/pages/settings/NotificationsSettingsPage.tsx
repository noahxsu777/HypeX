import { Heart, MessageCircle, UserPlus, AtSign, BookOpen, Mail, Bell } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import { useStore } from '../../store/useStore';

export default function NotificationsSettingsPage() {
  const { settings, updateSettings } = useStore();
  const { notifications } = settings;

  type NotifKey = keyof typeof notifications;

  const toggle = (key: NotifKey) => {
    updateSettings({
      notifications: { ...notifications, [key]: !notifications[key] },
    });
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <div
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${value ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </div>
  );

  const pushItems = [
    { icon: Heart, key: 'likes' as NotifKey, title: 'Me gusta', desc: 'Cuando alguien da like a tu contenido' },
    { icon: MessageCircle, key: 'comments' as NotifKey, title: 'Comentarios', desc: 'Nuevos comentarios en tus publicaciones' },
    { icon: UserPlus, key: 'follows' as NotifKey, title: 'Nuevos seguidores', desc: 'Cuando alguien te sigue' },
    { icon: MessageCircle, key: 'messages' as NotifKey, title: 'Mensajes', desc: 'Mensajes directos nuevos' },
    { icon: AtSign, key: 'mentions' as NotifKey, title: 'Menciones', desc: 'Cuando te mencionan en comentarios' },
    { icon: BookOpen, key: 'stories' as NotifKey, title: 'Historias', desc: 'Actividad en tus historias' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar title="Notificaciones" showBack showActions={false} />
      <div className="pt-14 space-y-4 py-4">

        <div className="bg-white dark:bg-gray-900 rounded-2xl mx-3 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notificaciones push</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-50 dark:border-gray-800">
            <Bell size={20} className="text-gray-600 dark:text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Activar notificaciones</p>
              <p className="text-xs text-gray-400">Recibe alertas en tu dispositivo</p>
            </div>
            <Toggle value={notifications.pushNotifications} onChange={() => toggle('pushNotifications')} />
          </div>

          {pushItems.map(({ icon: Icon, key, title, desc }, i) => (
            <div
              key={key}
              className={`flex items-center gap-3 px-4 py-4 ${i < pushItems.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''} ${!notifications.pushNotifications ? 'opacity-50' : ''}`}
            >
              <Icon size={18} className="text-gray-500 dark:text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <Toggle
                value={notifications[key] as boolean}
                onChange={() => notifications.pushNotifications && toggle(key)}
              />
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl mx-3 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Correo electrónico</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <Mail size={20} className="text-gray-600 dark:text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones por email</p>
              <p className="text-xs text-gray-400">Resúmenes y alertas importantes</p>
            </div>
            <Toggle value={notifications.emailNotifications} onChange={() => toggle('emailNotifications')} />
          </div>
        </div>

        <div className="mx-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            🔔 Las notificaciones push requieren que las hayas permitido en la configuración de tu dispositivo.
          </p>
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
}
