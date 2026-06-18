import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');

    // Resolve username to id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let query = supabase
      .from('posts')
      .select('*, user:profiles(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(21);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: postsRaw, error } = await query;
    if (error) throw error;

    const posts = (postsRaw ?? []) as Array<{ id: string; created_at: string; [key: string]: unknown }>;
    const hasMore = posts.length > 20;
    const pagePosts = hasMore ? posts.slice(0, 20) : posts;
    const postIds = pagePosts.map((p) => p.id);

    if (postIds.length === 0) {
      return NextResponse.json({ posts: [], next_cursor: null });
    }

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

    const enriched = pagePosts.map((post) => ({
      ...post,
      is_liked: likedSet.has(post.id),
      is_saved: savedSet.has(post.id),
      _count: {
        likes: likeCountMap[post.id] ?? 0,
        comments: commentCountMap[post.id] ?? 0,
      },
    }));

    return NextResponse.json({
      posts: enriched,
      next_cursor: hasMore ? pagePosts[pagePosts.length - 1].created_at : null,
    });
  } catch (error) {
    console.error('GET /api/users/[username]/posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
