'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Grid,
  Film,
  Bookmark,
  Tag,
  UserPlus,
  UserCheck,
  MoreHorizontal,
  LinkIcon,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Avatar from '@/components/ui/Avatar';
import TopBar from '@/components/layout/TopBar';
import type { Post, Profile } from '@/types';
import { formatCount } from '@/lib/utils';

interface Props {
  user: Profile & { is_own_profile?: boolean };
  currentUserId: string;
}

type Tab = 'posts' | 'reels' | 'saved' | 'tagged';

export default function ProfilePage({ user: initialUser, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>('posts');
  const [isFollowing, setIsFollowing] = useState(initialUser.is_following ?? false);
  const [followerCount, setFollowerCount] = useState(
    initialUser._count?.followers ?? 0
  );

  const isOwnProfile = initialUser.is_own_profile ?? initialUser.id === currentUserId;

  const { data: postsData } = useQuery({
    queryKey: ['user-posts', initialUser.username, tab],
    queryFn: async () => {
      const res = await fetch(
        `/api/users/${initialUser.username}/posts?type=${tab}`
      );
      return res.json() as Promise<{ posts: Post[] }>;
    },
    enabled: tab === 'posts' || tab === 'reels',
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${initialUser.username}/follow`, {
        method: 'POST',
      });
      return res.json() as Promise<{ following: boolean; followerCount: number }>;
    },
    onSuccess: (data) => {
      setIsFollowing(data.following);
      setFollowerCount(data.followerCount);
    },
  });

  const posts = postsData?.posts ?? [];

  const tabs = [
    { id: 'posts' as Tab, Icon: Grid },
    { id: 'reels' as Tab, Icon: Film },
    { id: 'saved' as Tab, Icon: Bookmark, onlyOwn: true },
    { id: 'tagged' as Tab, Icon: Tag },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar
        title={initialUser.username ?? ''}
        showBack={!isOwnProfile}
        right={
          isOwnProfile ? (
            <Link
              href="/settings"
              className="p-2 text-gray-700 dark:text-gray-300"
            >
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
          <div className="flex items-center gap-5 mb-4">
            <Avatar
              src={initialUser.image}
              alt={initialUser.name ?? initialUser.username ?? ''}
              size="xl"
            />
            <div className="flex-1">
              <div className="grid grid-cols-3 text-center gap-2">
                {[
                  { label: 'Public.', value: initialUser._count?.posts ?? 0 },
                  { label: 'Seguidores', value: followerCount },
                  { label: 'Siguiendo', value: initialUser._count?.following ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCount(value)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Name & bio */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-gray-900 dark:text-white">
                {initialUser.name}
              </p>
              {initialUser.is_verified && (
                <svg
                  className="w-4 h-4 text-blue-500 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            {initialUser.bio && (
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {initialUser.bio}
              </p>
            )}
            {initialUser.website && (
              <div className="flex items-center gap-1">
                <LinkIcon size={13} className="text-blue-500" />
                <a
                  href={initialUser.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 font-medium"
                >
                  {initialUser.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          {isOwnProfile ? (
            <div className="flex gap-2">
              <Link
                href="/settings/edit-profile"
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold rounded-lg text-center"
              >
                Editar perfil
              </Link>
              <Link
                href="/settings"
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold rounded-lg text-center"
              >
                Herramientas
              </Link>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  isFollowing
                    ? 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {followMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserCheck size={14} /> Siguiendo
                  </>
                ) : (
                  <>
                    <UserPlus size={14} /> Seguir
                  </>
                )}
              </button>
              <Link
                href="/messages"
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm font-semibold rounded-lg text-center"
              >
                Mensaje
              </Link>
              <button className="py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                <MoreHorizontal size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mt-2">
          {tabs
            .filter((t) => !t.onlyOwn || isOwnProfile)
            .map(({ id, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 py-3 flex items-center justify-center transition-colors ${
                  tab === id
                    ? 'border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <Icon size={22} strokeWidth={tab === id ? 2 : 1.5} />
              </button>
            ))}
        </div>

        {/* Posts grid */}
        {(tab === 'posts' || tab === 'reels') && (
          <div className="grid grid-cols-3 gap-px">
            {posts.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center py-16 gap-3 text-center px-8">
                <Grid size={48} className="text-gray-200 dark:text-gray-700" />
                <p className="font-semibold text-gray-900 dark:text-white">
                  No hay publicaciones aún
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="relative aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden"
                >
                  {post.media_urls?.[0] && (
                    <img
                      src={post.media_urls[0]}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {post.type === 'carousel' && (
                    <div className="absolute top-1.5 right-1.5">
                      <svg
                        className="w-4 h-4 text-white drop-shadow"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <rect x="2" y="2" width="20" height="20" rx="2" />
                        <path d="M7 2v20M17 2v20M2 12h20" />
                      </svg>
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>
        )}

        {tab === 'saved' && (
          <div className="flex flex-col items-center py-16 gap-3 text-center px-8">
            <Bookmark size={48} className="text-gray-200 dark:text-gray-700" />
            <p className="font-semibold text-gray-900 dark:text-white">
              Solo tú puedes ver esto
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Las fotos y videos que guardas aparecen aquí.
            </p>
          </div>
        )}

        {tab === 'tagged' && (
          <div className="flex flex-col items-center py-16 gap-3 text-center px-8">
            <Tag size={48} className="text-gray-200 dark:text-gray-700" />
            <p className="font-semibold text-gray-900 dark:text-white">
              Fotos en las que apareces
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cuando te etiqueten en fotos aparecerán aquí.
            </p>
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
  );
}
