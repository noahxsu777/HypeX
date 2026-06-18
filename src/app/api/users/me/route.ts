import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const [followerCountRes, followingCountRes, postCountRes] = await Promise.all([
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id),
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    return NextResponse.json({
      ...profile,
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

    const body = await request.json();
    const { name, username, bio, website, image } = body;

    // Check if new username is taken by someone else
    if (username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    const updateData: {
      name?: string | null;
      username?: string | null;
      bio?: string | null;
      website?: string | null;
      image?: string | null;
    } = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (image !== undefined) updateData.image = image;

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error('PATCH /api/users/me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
