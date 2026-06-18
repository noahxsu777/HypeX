import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q) {
      return NextResponse.json({ users: [] });
    }

    const searchPattern = `%${q}%`;

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, name, image, bio, is_verified')
      .or(`username.ilike.${searchPattern},name.ilike.${searchPattern}`)
      .limit(20);

    if (error) throw error;
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const profileIds = profiles.map((p) => p.id);

    const [followerCountsRes, isFollowingRes] = await Promise.all([
      supabase
        .from('follows')
        .select('following_id')
        .in('following_id', profileIds),
      supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', profileIds),
    ]);

    const followerCountMap: Record<string, number> = {};
    for (const f of followerCountsRes.data ?? []) {
      followerCountMap[f.following_id] = (followerCountMap[f.following_id] ?? 0) + 1;
    }

    const followingSet = new Set(isFollowingRes.data?.map((f) => f.following_id) ?? []);

    const enriched = profiles.map((profile) => ({
      ...profile,
      _count: {
        followers: followerCountMap[profile.id] ?? 0,
      },
      is_following: followingSet.has(profile.id),
    }));

    return NextResponse.json({ users: enriched });
  } catch (error) {
    console.error('GET /api/users/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
