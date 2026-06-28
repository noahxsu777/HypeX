import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDb } from '@/lib/neon/client';
import { profiles } from '@/lib/neon/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username } = await params;
    const db = getDb();

    // Fetch from Neon
    let [profile] = await db.select().from(profiles).where(eq(profiles.username, username));

    // Fallback to Supabase if not in Neon yet
    if (!profile) {
      const { data: sbProfile } = await supabase.from('profiles').select('*').eq('username', username).single();
      if (!sbProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const sbProfileAny = sbProfile as Record<string, unknown>;
      const profileData = {
        id: sbProfile.id,
        email: (sbProfileAny.email as string | null) ?? null,
        username: sbProfile.username ?? null,
        name: sbProfile.name ?? null,
        bio: sbProfile.bio ?? null,
        website: sbProfile.website ?? null,
        image: sbProfile.image ?? null,
        is_private: sbProfile.is_private ?? false,
        is_verified: sbProfile.is_verified ?? false,
      };
      await db.insert(profiles).values(profileData).onConflictDoUpdate({
        target: profiles.id,
        set: profileData,
      });
      [profile] = await db.select().from(profiles).where(eq(profiles.id, sbProfile.id));
    }

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [followerCountRes, followingCountRes, postCountRes, isFollowingRes] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle(),
    ]);

    return NextResponse.json({
      ...profile,
      _count: {
        followers: followerCountRes.count ?? 0,
        following: followingCountRes.count ?? 0,
        posts: postCountRes.count ?? 0,
      },
      is_following: !!isFollowingRes.data,
    });
  } catch (error) {
    console.error('GET /api/users/[username] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
