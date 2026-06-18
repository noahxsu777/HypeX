import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: postRaw, error } = await supabase
      .from('posts')
      .select('*, user:profiles(*)')
      .eq('id', id)
      .single();

    const post = postRaw as Record<string, unknown> | null;
    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const [likeRes, savedRes, likeCountRes, commentCountRes] = await Promise.all([
      supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_id', id)
        .eq('target_type', 'post')
        .maybeSingle(),
      supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('post_id', id)
        .maybeSingle(),
      supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('target_id', id)
        .eq('target_type', 'post'),
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', id),
    ]);

    return NextResponse.json({
      post: {
        ...post,
        is_liked: !!likeRes.data,
        is_saved: !!savedRes.data,
        _count: {
          likes: likeCountRes.count ?? 0,
          comments: commentCountRes.count ?? 0,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/posts/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/posts/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
