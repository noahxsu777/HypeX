'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { Post, Profile } from '@/types';
import { useDebounce } from '@/lib/hooks';

export default function ExploreContent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['explore-posts'],
    queryFn: async () => {
      const res = await fetch('/api/posts?explore=true&limit=30');
      return res.json() as Promise<{ posts: Post[] }>;
    },
    enabled: !debouncedQuery,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(debouncedQuery)}`
      );
      return res.json() as Promise<{ users: Profile[] }>;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const explorePosts = posts?.posts ?? [];
  const searchUsers = searchData?.users ?? [];

  return (
    <div>
      {/* Search bar */}
      <div className="px-3 py-2 sticky top-14 bg-white dark:bg-black z-10">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            autoComplete="off"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 flex-shrink-0">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {debouncedQuery.length >= 2 ? (
        <div>
          {searchLoading && (
            <div className="space-y-1 pt-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-800 skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-800 rounded skeleton" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded skeleton" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!searchLoading && searchUsers.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3 text-center px-8">
              <Search size={40} className="text-gray-300 dark:text-gray-600" />
              <p className="font-semibold text-gray-900 dark:text-white">Sin resultados</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No se encontraron usuarios para &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          )}
          {searchUsers.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.username}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <Avatar
                src={user.image}
                alt={user.name ?? user.username ?? ''}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                  {user.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user.name}
                </p>
                {user._count && (
                  <p className="text-xs text-gray-400">
                    {user._count.followers.toLocaleString()} seguidores
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div>
          {postsLoading ? (
            <ExploreGridSkeleton />
          ) : (
            <ExploreGrid posts={explorePosts} />
          )}
        </div>
      )}
    </div>
  );
}

function ExploreGrid({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 gap-4 text-center px-8">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Search size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Explora contenido
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cuando haya publicaciones disponibles, aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-px">
      {posts.map((post, i) => {
        const isLarge = i % 7 === 0;
        return (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className={`relative bg-gray-100 dark:bg-gray-900 overflow-hidden ${
              isLarge ? 'col-span-2 row-span-2' : ''
            }`}
            style={{ aspectRatio: isLarge ? undefined : '1/1' }}
          >
            {isLarge && <div style={{ paddingBottom: '100%' }} />}
            {post.media_urls?.[0] && (
              <img
                src={post.media_urls[0]}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            )}
            {post.type === 'carousel' && (
              <div className="absolute top-1.5 right-1.5">
                <svg
                  className="w-4 h-4 text-white drop-shadow"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm5-4a1 1 0 000 2h10a3 3 0 013 3v10a1 1 0 102 0V7a5 5 0 00-5-5H7z" />
                </svg>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function ExploreGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-px">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`bg-gray-200 dark:bg-gray-800 skeleton ${
            i % 7 === 0 ? 'col-span-2 row-span-2' : ''
          }`}
          style={{
            aspectRatio: i % 7 === 0 ? undefined : '1/1',
            paddingBottom: i % 7 === 0 ? '100%' : undefined,
          }}
        />
      ))}
    </div>
  );
}
