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

    const { id: reelId } = await params;

    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_id', reelId)
      .eq('target_type', 'reel')
      .maybeSingle();

    let liked: boolean;

    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id);
      liked = false;
    } else {
      await supabase
        .from('likes')
        .insert({ user_id: user.id, target_id: reelId, target_type: 'reel' });
      liked = true;

      // Insert notification for reel owner (skip if liking own reel)
      const { data: reel } = await supabase
        .from('reels')
        .select('user_id')
        .eq('id', reelId)
        .single();

      if (reel && reel.user_id !== user.id) {
        const admin = await createAdminClient();
        await admin.from('notifications').insert({
          user_id: reel.user_id,
          actor_id: user.id,
          type: 'like',
          target_id: reelId,
          target_type: 'reel',
        });
      }
    }

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('target_id', reelId)
      .eq('target_type', 'reel');

    return NextResponse.json({ liked, count: count ?? 0 });
  } catch (error) {
    console.error('POST /api/reels/[id]/like error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
