import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username } = await params;

    // Resolve username to id
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const followingId = targetProfile.id;

    if (user.id === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .maybeSingle();

    let following: boolean;

    if (existing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);
      following = false;
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: followingId });
      following = true;

      // Insert follow notification for the target user
      const admin = await createAdminClient();
      await admin.from('notifications').insert({
        user_id: followingId,
        actor_id: user.id,
        type: 'follow',
        target_id: user.id,
        target_type: 'user',
      });
    }

    const { count: follower_count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', followingId);

    return NextResponse.json({ following, follower_count: follower_count ?? 0 });
  } catch (error) {
    console.error('POST /api/users/[username]/follow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
