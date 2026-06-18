import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: postId } = await params;

    const { data: commentsRaw, error } = await supabase
      .from('comments')
      .select('*, user:profiles(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const comments = (commentsRaw ?? []) as Array<{ id: string; [key: string]: unknown }>;
    const commentIds = comments.map((c) => c.id);

    if (commentIds.length === 0) {
      return NextResponse.json({ comments: [] });
    }

    const [likeRes, likeCountsRes] = await Promise.all([
      supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', user.id)
        .eq('target_type', 'comment')
        .in('target_id', commentIds),
      supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', 'comment')
        .in('target_id', commentIds),
    ]);

    const likedSet = new Set(likeRes.data?.map((l) => l.target_id) ?? []);

    const likeCountMap: Record<string, number> = {};
    for (const l of likeCountsRes.data ?? []) {
      likeCountMap[l.target_id] = (likeCountMap[l.target_id] ?? 0) + 1;
    }

    const enriched = comments.map((comment) => ({
      ...comment,
      is_liked: likedSet.has(comment.id),
      _count: {
        likes: likeCountMap[comment.id] ?? 0,
      },
    }));

    return NextResponse.json({ comments: enriched });
  } catch (error) {
    console.error('GET /api/posts/[id]/comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: postId } = await params;
    const body = await request.json();
    const { content, parent_id } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const { data: commentRaw, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        post_id: postId,
        content,
        parent_id: parent_id ?? null,
      })
      .select('*, user:profiles(*)')
      .single();
    const comment = commentRaw as (Record<string, unknown> & { id: string }) | null;
    if (!comment) throw new Error('Failed to create comment');

    if (error) throw error;

    // Notify post owner
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    const admin = await createAdminClient();

    if (post && post.user_id !== user.id) {
      await admin.from('notifications').insert({
        user_id: post.user_id,
        actor_id: user.id,
        type: 'comment',
        target_id: postId,
        target_type: 'post',
      });
    }

    // Create mention notifications for @-tagged users
    const mentionMatches = content.match(/@(\w+)/g) ?? [];
    for (const mention of mentionMatches) {
      const mentionedUsername = mention.slice(1);
      const { data: mentionedUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', mentionedUsername)
        .maybeSingle();

      if (mentionedUser && mentionedUser.id !== user.id) {
        await admin.from('notifications').insert({
          user_id: mentionedUser.id,
          actor_id: user.id,
          type: 'mention',
          target_id: comment.id,
          target_type: 'comment',
        });
      }
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/posts/[id]/comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
