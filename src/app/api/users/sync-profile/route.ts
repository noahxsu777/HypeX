import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDb } from '@/lib/neon/client';
import { profiles } from '@/lib/neon/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: sbProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const sbProfileAny = sbProfile as Record<string, unknown> | null;
    const profileData = {
      id: user.id,
      email: user.email ?? null,
      username: (sbProfileAny?.username as string | null) ?? user.user_metadata?.username ?? null,
      name: (sbProfileAny?.name as string | null) ?? user.user_metadata?.full_name ?? null,
      bio: (sbProfileAny?.bio as string | null) ?? null,
      website: (sbProfileAny?.website as string | null) ?? null,
      image: (sbProfileAny?.image as string | null) ?? user.user_metadata?.avatar_url ?? null,
      is_private: (sbProfileAny?.is_private as boolean | null) ?? false,
      is_verified: (sbProfileAny?.is_verified as boolean | null) ?? false,
    };

    const db = getDb();
    await db.insert(profiles).values(profileData).onConflictDoUpdate({
      target: profiles.id,
      set: {
        email: profileData.email,
        username: profileData.username,
        name: profileData.name,
        bio: profileData.bio,
        website: profileData.website,
        image: profileData.image,
        is_private: profileData.is_private,
        is_verified: profileData.is_verified,
      },
    });

    const [neonProfile] = await db.select().from(profiles).where(eq(profiles.id, user.id));
    return NextResponse.json({ profile: neonProfile }, { status: 200 });
  } catch (error) {
    console.error('POST /api/users/sync-profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
