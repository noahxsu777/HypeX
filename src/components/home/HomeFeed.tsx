'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import PostCard from './PostCard';
import StoriesBar from './StoriesBar';
import type { Post } from '@/types';
import Link from 'next/link';

async function fetchFeed(cursor?: string) {
  const url = cursor ? `/api/posts?cursor=${cursor}` : '/api/posts';
  const res = await fetch(url);
  if (!res.ok) return { posts: [], nextCursor: null };
  const json = await res.json();
  return {
    posts: (json.posts ?? []) as Post[],
    nextCursor: (json.nextCursor ?? json.next_cursor ?? null) as string | null,
  };
}

async function fetchExplorePosts() {
  const res = await fetch('/api/posts?explore=true&limit=20');
  if (!res.ok) return { posts: [] as Post[] };
  const json = await res.json();
  return { posts: (json.posts ?? []) as Post[] };
}

export default function HomeFeed({ userId }: { userId: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: ['feed'],
      queryFn: ({ pageParam }) => fetchFeed(pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const feedIsEmpty = !isLoading && posts.length === 0;

  const { data: exploreData, isLoading: exploreLoading } = useQuery({
    queryKey: ['explore-fallback'],
    queryFn: fetchExplorePosts,
    enabled: feedIsEmpty,
  });

  const observer = useRef<IntersectionObserver | undefined>(undefined);
  const lastRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  if (isLoading) return <FeedSkeleton />;

  // Show personal feed when there are posts
  if (posts.length > 0) {
    return (
      <>
        <StoriesBar />
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {posts.map((post, i) => (
            <div
              key={post.id}
              ref={i === posts.length - 1 ? lastRef : undefined}
            >
              <PostCard post={post} currentUserId={userId} />
            </div>
          ))}
        </div>
        {isFetchingNextPage && (
          <div className="py-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
      </>
    );
  }

  // Feed is empty — show explore/trending content so the page isn't blank
  return (
    <>
      <StoriesBar />

      {/* Suggestion banner */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Sigue a personas para ver su contenido aquí
        </p>
        <Link href="/explore" className="text-xs font-semibold text-blue-500">
          Explorar →
        </Link>
      </div>

      {/* Trending posts */}
      {exploreLoading ? (
        <FeedSkeleton />
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {(exploreData?.posts ?? []).map((post) => (
            <PostCard key={post.id} post={post} currentUserId={userId} />
          ))}
          {(exploreData?.posts ?? []).length === 0 && <EmptyFeed />}
        </div>
      )}
    </>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-1">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-black">
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-2 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="aspect-square bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="px-3 py-3 space-y-2">
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sé el primero</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Todavía no hay publicaciones. ¡Crea la primera!
      </p>
      <Link
        href="/create"
        className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-semibold"
      >
        Crear publicación
      </Link>
    </div>
  );
}
