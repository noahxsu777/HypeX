import { useState } from 'react';
import { Search } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Avatar from '../../components/common/Avatar';
import { useStore } from '../../store/useStore';

export default function BlockedUsersPage() {
  const { users, unblockUser } = useStore();
  const [query, setQuery] = useState('');
  const blockedUsers = users.filter(u => u.isBlocked);
  const filtered = blockedUsers.filter(u =>
    !query || u.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar title="Cuentas bloqueadas" showBack showActions={false} />
      <div className="pt-14">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar cuentas bloqueadas"
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="text-5xl">🚫</div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {query ? 'Sin resultados' : 'No has bloqueado a nadie'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-8">
              Cuando bloquees a alguien, no podrá ver tu perfil ni contactarte.
            </p>
          </div>
        ) : (
          filtered.map(user => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800">
              <Avatar src={user.avatar} alt={user.username} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.username}</p>
                <p className="text-xs text-gray-500">{user.displayName}</p>
              </div>
              <button
                onClick={() => unblockUser(user.id)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white"
              >
                Desbloquear
              </button>
            </div>
          ))
        )}
        <div className="h-20" />
      </div>
    </div>
  );
}
