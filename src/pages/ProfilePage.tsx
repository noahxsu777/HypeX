import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Grid, Film, Bookmark, Tag, Settings, UserPlus, UserCheck, MoreHorizontal, Link as LinkIcon } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import Avatar from '../components/common/Avatar';
import { useStore } from '../store/useStore';
import { formatCount } from '../utils/helpers';
import { MOCK_POSTS } from '../data/mockData';

type Tab = 'posts' | 'reels' | 'saved' | 'tagged';

export default function ProfilePage() {
  const { username } = useParams();
  const { currentUser, users, toggleFollow } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('posts');

  const isMyProfile = !username || username === 'me' || username === currentUser.username;
  const profileUser = isMyProfile
    ? currentUser
    : users.find(u => u.username === username) || users[0];

  if (!profileUser) return null;

  const userPosts = MOCK_POSTS.filter(p => p.userId === profileUser.id || isMyProfile);

  const tabs = [
    { id: 'posts' as Tab, icon: Grid, label: 'Publicaciones' },
    { id: 'reels' as Tab, icon: Film, label: 'Reels' },
    { id: 'saved' as Tab, icon: Bookmark, label: 'Guardado' },
    { id: 'tagged' as Tab, icon: Tag, label: 'Etiquetado' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar
        title={profileUser.username}
        showBack={!isMyProfile}
        showActions={false}
        rightElement={
          isMyProfile ? (
            <Link to="/settings" className="p-2 text-gray-700 dark:text-gray-300">
              <Settings size={22} />
            </Link>
          ) : (
            <button className="p-2 text-gray-700 dark:text-gray-300">
              <MoreHorizontal size={22} />
            </button>
          )
        }
      />

      <div className="pt-14">
        {/* Profile header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-6 mb-4">
            <Avatar
              src={profileUser.avatar}
              alt={profileUser.username}
              size="xl"
              hasStory={!isMyProfile}
            />
            <div className="flex-1">
              <div className="grid grid-cols-3 text-center">
                {[
                  { label: 'Publ.', value: profileUser.postsCount },
                  { label: 'Seguidores', value: profileUser.followersCount },
                  { label: 'Siguiendo', value: profileUser.followingCount },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCount(value)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Name & bio */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <p className="font-bold text-gray-900 dark:text-white">{profileUser.displayName}</p>
              {profileUser.isVerified && (
                <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{profileUser.bio}</p>
            {profileUser.website && (
              <div className="flex items-center gap-1">
                <LinkIcon size={13} className="text-blue-500" />
                <a href="#" className="text-sm text-blue-500 font-medium">{profileUser.website}</a>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            {isMyProfile ? (
              <>
                <Link
                  to="/settings/edit-profile"
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold rounded-lg text-center"
                >
                  Editar perfil
                </Link>
                <Link
                  to="/settings"
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold rounded-lg text-center"
                >
                  Herramientas profesionales
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => toggleFollow(profileUser.id)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    profileUser.isFollowing
                      ? 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {profileUser.isFollowing ? (
                    <><UserCheck size={15} /> Siguiendo</>
                  ) : (
                    <><UserPlus size={15} /> Seguir</>
                  )}
                </button>
                <Link
                  to="/messages"
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm font-semibold rounded-lg text-center"
                >
                  Mensaje
                </Link>
                <button className="py-2 px-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg">
                  <MoreHorizontal size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Highlights */}
        {profileUser.highlights.length > 0 && (
          <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            {profileUser.highlights.map(highlight => (
              <div key={highlight.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer">
                <div className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600 overflow-hidden p-0.5">
                  <img src={highlight.coverUrl} alt={highlight.title} className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[60px] text-center truncate">
                  {highlight.title}
                </span>
              </div>
            ))}
            {isMyProfile && (
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <span className="text-2xl text-gray-400">+</span>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Nuevo</span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-3 flex items-center justify-center transition-colors ${
                activeTab === id
                  ? 'border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'text-gray-400'
              }`}
            >
              <Icon size={22} strokeWidth={activeTab === id ? 2 : 1.5} />
            </button>
          ))}
        </div>

        {/* Posts grid */}
        {(activeTab === 'posts' || activeTab === 'reels') && (
          <div className="grid grid-cols-3 gap-px">
            {userPosts.slice(0, activeTab === 'reels' ? 6 : 12).map(post => (
              <div key={post.id} className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                <img
                  src={post.media[0]?.url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {post.type === 'carousel' && (
                  <div className="absolute top-1.5 right-1.5">
                    <svg className="w-4 h-4 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Bookmark size={48} className="text-gray-200 dark:text-gray-700" />
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Guardado</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-8">
              Guarda fotos y videos para verlos de nuevo.
            </p>
          </div>
        )}

        {activeTab === 'tagged' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Tag size={48} className="text-gray-200 dark:text-gray-700" />
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Etiquetado</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-8">
              Cuando la gente te etiquete en fotos aparecerán aquí.
            </p>
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
  );
}
