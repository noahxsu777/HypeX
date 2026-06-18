import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: postId } = await params;

    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_id', postId)
      .eq('target_type', 'post')
      .maybeSingle();

    let liked: boolean;

    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id);
      liked = false;
    } else {
      await supabase
        .from('likes')
        .insert({ user_id: user.id, target_id: postId, target_type: 'post' });
      liked = true;

      // Insert notification for post owner (skip if liking own post)
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (post && post.user_id !== user.id) {
        const admin = await createAdminClient();
        await admin.from('notifications').insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: 'like',
          target_id: postId,
          target_type: 'post',
        });
      }
    }

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('target_id', postId)
      .eq('target_type', 'post');

    return NextResponse.json({ liked, count: count ?? 0 });
  } catch (error) {
    console.error('POST /api/posts/[id]/like error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
