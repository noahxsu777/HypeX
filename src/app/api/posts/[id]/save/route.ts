import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle();

    let saved: boolean;

    if (existing) {
      await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);
      saved = false;
    } else {
      await supabase
        .from('saved_posts')
        .insert({ user_id: user.id, post_id: postId });
      saved = true;
    }

    return NextResponse.json({ saved });
  } catch (error) {
    console.error('POST /api/posts/[id]/save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
