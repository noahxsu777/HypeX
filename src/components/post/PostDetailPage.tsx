'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { Post } from '@/types';
import { timeAgo, formatCount } from '@/lib/utils';
import CommentsSheet from '@/components/home/CommentsSheet';
import { useState } from 'react';

export default function PostDetailPage({ postId }: { postId: string; currentUserId: string }) {
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}`);
      return res.json() as Promise<{ post: Post }>;
    },
  });

  const post = data?.post;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 pt-safe">
          <button onClick={() => router.back()} className="p-1">
            <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <h2 className="flex-1 text-center font-semibold text-gray-900 dark:text-white">Publicación</h2>
          <div className="w-8" />
        </div>
        <div className="aspect-square bg-gray-200 dark:bg-gray-800 skeleton" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h2 className="flex-1 text-center font-semibold text-gray-900 dark:text-white">Publicación</h2>
        <button className="p-1"><MoreHorizontal size={22} className="text-gray-700 dark:text-gray-300" /></button>
      </div>

      {/* Post author */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/profile/${post.user.username}`}>
          <Avatar src={post.user.image} alt={post.user.name} size="md" />
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${post.user.username}`}>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{post.user.username}</p>
          </Link>
          {post.location && <p className="text-xs text-gray-500">{post.location}</p>}
        </div>
      </div>

      {/* Media */}
      {post.mediaUrls[0] && (
        <div className="aspect-square overflow-hidden">
          <img
            src={post.mediaUrls[0]}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center px-4 py-2 gap-4">
        <button className="p-1">
          <Heart size={26} className={post.isLiked ? 'text-red-500 fill-current' : 'text-gray-700 dark:text-gray-300'} />
        </button>
        <button onClick={() => setShowComments(true)} className="p-1">
          <MessageCircle size={26} className="text-gray-700 dark:text-gray-300" />
        </button>
        <button className="p-1">
          <Share2 size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex-1" />
        <button className="p-1">
          <Bookmark size={26} className={post.isSaved ? 'fill-current text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} />
        </button>
      </div>

      {/* Likes */}
      <p className="px-4 text-sm font-semibold text-gray-900 dark:text-white">
        {formatCount(post._count?.likes ?? 0)} me gusta
      </p>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 py-1">
          <p className="text-sm text-gray-900 dark:text-white">
            <Link href={`/profile/${post.user.username}`} className="font-semibold">{post.user.username}</Link>{' '}
            {post.caption}
          </p>
        </div>
      )}

      {/* Comments */}
      <button onClick={() => setShowComments(true)} className="px-4 py-1">
        <p className="text-sm text-gray-400">
          Ver los {formatCount(post._count?.comments ?? 0)} comentarios
        </p>
      </button>

      <p className="px-4 py-1 text-[11px] text-gray-400 uppercase">{timeAgo(post.createdAt)}</p>

      <CommentsSheet
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

      <div className="h-20" />
    </div>
  );
}
