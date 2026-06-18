import { useState } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Avatar from '../components/common/Avatar';
import { useStore } from '../store/useStore';
import { MOCK_POSTS, TRENDING_HASHTAGS } from '../data/mockData';
import { formatCount } from '../utils/helpers';

export default function ExplorePage() {
  const { users } = useStore();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'top' | 'accounts' | 'tags' | 'places'>('top');
  const [focused, setFocused] = useState(false);

  const filteredUsers = query
    ? users.filter(u =>
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.displayName.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredTags = query
    ? TRENDING_HASHTAGS.filter(t => t.tag.toLowerCase().includes(query.toLowerCase()))
    : [];

  const showResults = focused && query.length > 0;
  const posts = MOCK_POSTS;

  // Build explore grid with varied sizes
  const grid = posts.slice(0, 12);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar showActions={false} />

      <div className="pt-14">
        {/* Search bar */}
        <div className="px-3 py-2 sticky top-14 bg-white dark:bg-black z-30">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="Buscar usuarios, hashtags..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
              autoComplete="off"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Search results */}
        {showResults ? (
          <div className="px-3">
            {/* Tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto hide-scrollbar">
              {(['top', 'accounts', 'tags', 'places'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium flex-shrink-0 transition-colors ${
                    activeTab === tab
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {tab === 'top' ? 'Principal' : tab === 'accounts' ? 'Cuentas' : tab === 'tags' ? 'Etiquetas' : 'Lugares'}
                </button>
              ))}
            </div>

            {/* Users */}
            {(activeTab === 'top' || activeTab === 'accounts') && filteredUsers.map(user => (
              <Link
                key={user.id}
                to={`/profile/${user.username}`}
                className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-gray-800"
              >
                <Avatar src={user.avatar} alt={user.username} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {user.username}
                    </p>
                    {user.isVerified && (
                      <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.displayName}</p>
                  <p className="text-xs text-gray-400">{formatCount(user.followersCount)} seguidores</p>
                </div>
              </Link>
            ))}

            {/* Hashtags */}
            {(activeTab === 'top' || activeTab === 'tags') && filteredTags.map(({ tag, count }) => (
              <Link
                key={tag}
                to={`/hashtag/${tag}`}
                className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-gray-800"
              >
                <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-gray-700 dark:text-gray-300 text-lg font-bold">#</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">#{tag}</p>
                  <p className="text-xs text-gray-400">{count} publicaciones</p>
                </div>
              </Link>
            ))}

            {filteredUsers.length === 0 && filteredTags.length === 0 && (
              <p className="text-center text-gray-400 py-10">No se encontraron resultados para "{query}"</p>
            )}
          </div>
        ) : (
          <>
            {/* Trending hashtags */}
            <div className="px-3 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-gray-700 dark:text-gray-300" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tendencias</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_HASHTAGS.slice(0, 8).map(({ tag }) => (
                  <Link
                    key={tag}
                    to={`/hashtag/${tag}`}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Photo grid */}
            <div className="explore-grid">
              {grid.map((post, i) => {
                const isBig = i % 7 === 0 || i % 7 === 4;
                return (
                  <div
                    key={post.id}
                    className={`relative bg-gray-200 dark:bg-gray-800 overflow-hidden ${
                      isBig ? 'col-span-2 row-span-2' : ''
                    }`}
                    style={{ aspectRatio: isBig ? '1' : '1' }}
                  >
                    <img
                      src={post.media[0]?.url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {post.type === 'carousel' && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-4 h-4 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="h-20" />
      </div>
    </div>
  );
}
