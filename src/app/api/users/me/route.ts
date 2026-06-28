import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDb } from '@/lib/neon/client';
import { profiles } from '@/lib/neon/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();

    // Try Neon first
    let [neonProfile] = await db.select().from(profiles).where(eq(profiles.id, user.id));

    // Lazy-sync: if not in Neon yet, pull from Supabase and upsert
    if (!neonProfile) {
      const { data: sbProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const profileData = {
        id: user.id,
        email: user.email ?? null,
        username: sbProfile?.username ?? user.user_metadata?.username ?? null,
        name: sbProfile?.name ?? user.user_metadata?.full_name ?? null,
        bio: sbProfile?.bio ?? null,
        website: sbProfile?.website ?? null,
        image: sbProfile?.image ?? user.user_metadata?.avatar_url ?? null,
        is_private: sbProfile?.is_private ?? false,
        is_verified: sbProfile?.is_verified ?? false,
      };
      await db.insert(profiles).values(profileData).onConflictDoUpdate({
        target: profiles.id,
        set: profileData,
      });
      [neonProfile] = await db.select().from(profiles).where(eq(profiles.id, user.id));
    }

    if (!neonProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const [followerCountRes, followingCountRes, postCountRes] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    return NextResponse.json({
      ...neonProfile,
      _count: {
        followers: followerCountRes.count ?? 0,
        following: followingCountRes.count ?? 0,
        posts: postCountRes.count ?? 0,
      },
    });
  } catch (error) {
    console.error('GET /api/users/me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    const body = await request.json();
    const { name, username, bio, website, image } = body;

    // Check if new username is taken by someone else in Neon
    if (username) {
      const [existing] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.username, username));
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    type ProfileUpdate = {
      name?: string | null;
      username?: string | null;
      bio?: string | null;
      website?: string | null;
      image?: string | null;
    };
    const updateData: ProfileUpdate = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (image !== undefined) updateData.image = image;

    // Write to Neon
    await db.update(profiles).set(updateData).where(eq(profiles.id, user.id));
    const [updated] = await db.select().from(profiles).where(eq(profiles.id, user.id));

    // Sync to Supabase profiles (for PostgREST joins)
    await supabase.from('profiles').update(updateData).eq('id', user.id);

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error('PATCH /api/users/me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
