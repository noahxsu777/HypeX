import { ChevronRight, Lock, Eye, Users, MessageSquare, Tag, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import { useStore } from '../../store/useStore';

export default function PrivacyPage() {
  const { settings, updateSettings } = useStore();
  const { privacy } = settings;

  const toggle = (key: keyof typeof privacy) => {
    updateSettings({
      privacy: { ...privacy, [key]: !privacy[key] },
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

  const Row = ({ icon: Icon, title, subtitle, toggle: toggleEl, to }: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
    toggle?: React.ReactNode;
    to?: string;
  }) => {
    const content = (
      <div className="flex items-center gap-3.5 px-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
        <Icon size={20} className="text-gray-600 dark:text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {toggleEl || (to && <ChevronRight size={16} className="text-gray-400" />)}
      </div>
    );

    return to ? <Link to={to}>{content}</Link> : <div>{content}</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar title="Privacidad" showBack showActions={false} />
      <div className="pt-14 space-y-4 py-4">

        <div className="bg-white dark:bg-gray-900 rounded-2xl mx-3 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visibilidad de la cuenta</p>
          </div>

          <Row
            icon={Lock}
            title="Cuenta privada"
            subtitle="Solo tus seguidores pueden ver tu contenido"
            toggle={<Toggle value={privacy.privateAccount} onChange={() => toggle('privateAccount')} />}
          />
          <Row
            icon={Eye}
            title="Mostrar estado de actividad"
            subtitle="Otros pueden ver cuándo estuviste activo"
            toggle={<Toggle value={privacy.showActivity} onChange={() => toggle('showActivity')} />}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl mx-3 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Interacciones</p>
          </div>

          <Row
            icon={Tag}
            title="Permitir etiquetas"
            subtitle="Las personas pueden etiquetarte en fotos"
            toggle={<Toggle value={privacy.allowTagging} onChange={() => toggle('allowTagging')} />}
          />
          <Row
            icon={MessageSquare}
            title="Quién puede mencionarte"
            subtitle={privacy.allowMentions === 'everyone' ? 'Todos' : privacy.allowMentions === 'followers' ? 'Solo seguidores' : 'Nadie'}
            to="/settings/mentions"
          />
          <Row
            icon={Users}
            title="Mostrar contenido sugerido"
            subtitle="Ver publicaciones de cuentas que no sigues"
            toggle={<Toggle value={privacy.showSuggestedContent} onChange={() => toggle('showSuggestedContent')} />}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl mx-3 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Datos</p>
          </div>

          <Row
            icon={Eye}
            title="Compartir datos con terceros"
            subtitle="Para mejorar anuncios y recomendaciones"
            toggle={<Toggle value={privacy.dataSharing} onChange={() => toggle('dataSharing')} />}
          />
          <Row
            icon={UserX}
            title="Cuentas bloqueadas"
            subtitle="Gestiona las cuentas que has bloqueado"
            to="/settings/blocked"
          />
        </div>

        <div className="mx-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-4">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            💡 Cuando tu cuenta es privada, solo tus seguidores aprobados pueden ver tus publicaciones, historias y reels.
          </p>
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
}
