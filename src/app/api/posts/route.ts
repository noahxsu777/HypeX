import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const explore = searchParams.get('explore') === 'true';
    const limit = parseInt(searchParams.get('limit') ?? '21');

    let query;

    if (explore) {
      // Explore: show all posts from everyone
      query = supabase
        .from('posts')
        .select('*, user:profiles(*)')
        .order('created_at', { ascending: false })
        .limit(limit + 1);
    } else {
      // Personal feed: posts from followed users + own posts
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = following?.map((f) => f.following_id) ?? [];
      const feedIds = [...followingIds, user.id];

      query = supabase
        .from('posts')
        .select('*, user:profiles(*)')
        .in('user_id', feedIds)
        .order('created_at', { ascending: false })
        .limit(limit + 1);
    }

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: postsRaw, error } = await query;
    if (error) throw error;

    const posts = (postsRaw ?? []) as Array<{ id: string; created_at: string; [key: string]: unknown }>;
    const pageLimit = explore ? limit : 20;
    const hasMore = posts.length > pageLimit;
    const pagePosts = hasMore ? posts.slice(0, pageLimit) : posts;

    const postIds = pagePosts.map((p) => p.id);

    const [likesRes, savedRes, likeCountsRes, commentCountsRes] = await Promise.all([
      supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', user.id)
        .eq('target_type', 'post')
        .in('target_id', postIds),
      supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds),
      supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', 'post')
        .in('target_id', postIds),
      supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds),
    ]);

    const likedSet = new Set(likesRes.data?.map((l) => l.target_id) ?? []);
    const savedSet = new Set(savedRes.data?.map((s) => s.post_id) ?? []);

    const likeCountMap: Record<string, number> = {};
    for (const l of likeCountsRes.data ?? []) {
      likeCountMap[l.target_id] = (likeCountMap[l.target_id] ?? 0) + 1;
    }

    const commentCountMap: Record<string, number> = {};
    for (const c of commentCountsRes.data ?? []) {
      if (c.post_id) {
        commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1;
      }
    }

    const enrichedPosts = pagePosts.map((post) => ({
      ...post,
      is_liked: likedSet.has(post.id),
      is_saved: savedSet.has(post.id),
      _count: {
        likes: likeCountMap[post.id] ?? 0,
        comments: commentCountMap[post.id] ?? 0,
      },
    }));

    return NextResponse.json({
      posts: enrichedPosts,
      next_cursor: hasMore ? pagePosts[pagePosts.length - 1].created_at : null,
      nextCursor: hasMore ? pagePosts[pagePosts.length - 1].created_at : null,
    });
  } catch (error) {
    console.error('GET /api/posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { type, caption, location, media_urls } = body;

    if (!type || !media_urls || !Array.isArray(media_urls) || media_urls.length === 0) {
      return NextResponse.json({ error: 'type and media_urls are required' }, { status: 400 });
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, type, caption: caption ?? null, location: location ?? null, media_urls })
      .select('*, user:profiles(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('POST /api/posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
