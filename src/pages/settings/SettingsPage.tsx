import { Link } from 'react-router-dom';
import {
  User, Lock, Bell, Eye, Shield, HelpCircle, LogOut, Moon, Sun,
  ChevronRight, Heart, Bookmark, Archive, Activity, QrCode, Link2,
  Trash2, CreditCard, Star
} from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Avatar from '../../components/common/Avatar';
import { useStore } from '../../store/useStore';

interface SettingItem {
  icon: React.ElementType;
  label: string;
  to?: string;
  badge?: string;
  danger?: boolean;
  action?: () => void;
  description?: string;
  toggle?: boolean;
  value?: boolean;
}

interface SettingSection {
  title?: string;
  items: SettingItem[];
}

export default function SettingsPage() {
  const { currentUser, darkMode, toggleDarkMode } = useStore();

  const sections: SettingSection[] = [
    {
      title: 'Cuenta',
      items: [
        { icon: User, label: 'Editar perfil', to: '/settings/edit-profile', description: 'Nombre, bio, foto' },
        { icon: Lock, label: 'Privacidad', to: '/settings/privacy', description: 'Cuenta privada, actividad' },
        { icon: Shield, label: 'Seguridad', to: '/settings/security', description: '2FA, contraseña, sesiones' },
        { icon: Bell, label: 'Notificaciones', to: '/settings/notifications', description: 'Likes, comentarios, mensajes' },
        { icon: QrCode, label: 'Código QR', to: '/settings/qr' },
        { icon: Link2, label: 'Cuentas vinculadas', to: '/settings/linked-accounts' },
      ],
    },
    {
      title: 'Contenido e interacciones',
      items: [
        { icon: Bookmark, label: 'Publicaciones guardadas', to: '/settings/saved' },
        { icon: Archive, label: 'Archivo', to: '/settings/archive' },
        { icon: Activity, label: 'Tu actividad', to: '/settings/activity' },
        { icon: Eye, label: 'Contenido visto', to: '/settings/viewed' },
        { icon: Heart, label: 'Me gusta dados', to: '/settings/liked' },
      ],
    },
    {
      title: 'Apariencia',
      items: [
        {
          icon: darkMode ? Sun : Moon,
          label: darkMode ? 'Modo claro' : 'Modo oscuro',
          action: toggleDarkMode,
          toggle: true,
          value: darkMode,
        },
      ],
    },
    {
      title: 'Más información',
      items: [
        { icon: CreditCard, label: 'Suscripciones', to: '/settings/subscriptions' },
        { icon: Star, label: 'Acerca de', to: '/settings/about' },
        { icon: HelpCircle, label: 'Ayuda y soporte', to: '/settings/help' },
        { icon: Trash2, label: 'Eliminar cuenta', to: '/settings/delete-account', danger: true },
        { icon: LogOut, label: 'Cerrar sesión', action: () => {}, danger: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar title="Configuración" showBack showActions={false} />

      <div className="pt-14">
        {/* Profile card */}
        <Link
          to="/settings/edit-profile"
          className="flex items-center gap-4 px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
        >
          <Avatar src={currentUser.avatar} alt={currentUser.username} size="lg" />
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-white">{currentUser.displayName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{currentUser.username}</p>
            <p className="text-sm text-blue-500 mt-0.5 font-medium">Editar perfil</p>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </Link>

        {/* Settings sections */}
        <div className="space-y-6 py-4">
          {sections.map((section, si) => (
            <div key={si} className="bg-white dark:bg-gray-900 rounded-2xl mx-3 overflow-hidden shadow-sm">
              {section.title && (
                <div className="px-4 py-2.5 border-b border-gray-50 dark:border-gray-800">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              )}
              {section.items.map(({ icon: Icon, label, to, badge, danger, action, description, toggle, value }, i) => {
                const content = (
                  <div className={`flex items-center gap-3.5 px-4 py-3.5 ${i < section.items.length - 1 ? 'border-b border-gray-50 dark:border-gray-800/50' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${danger ? 'bg-red-50 dark:bg-red-950' : 'bg-gray-50 dark:bg-gray-800'}`}>
                      <Icon size={18} className={danger ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${danger ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                        {label}
                      </p>
                      {description && (
                        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                      )}
                    </div>
                    {badge && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {badge}
                      </span>
                    )}
                    {toggle !== undefined ? (
                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        onClick={action}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                      </div>
                    ) : (
                      !danger && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                );

                if (to) {
                  return <Link key={label} to={to}>{content}</Link>;
                }
                return (
                  <button key={label} className="w-full text-left" onClick={action}>
                    {content}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-24">
          HypeX · Versión 1.0.0
        </p>
      </div>
    </div>
  );
}
