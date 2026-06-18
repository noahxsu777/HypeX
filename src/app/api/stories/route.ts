import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get IDs of followed users
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = following?.map((f) => f.following_id) ?? [];
    const feedIds = [...followingIds, user.id];

    const now = new Date().toISOString();

    const { data: storiesRaw, error } = await supabase
      .from('stories')
      .select('*, user:profiles(*)')
      .in('user_id', feedIds)
      .gt('expires_at', now)
      .order('created_at', { ascending: true });

    if (error) throw error;

    type StoryRow = { user_id: string; user: unknown; [key: string]: unknown };
    const stories = (storiesRaw ?? []) as StoryRow[];

    // Group by user
    const grouped: Record<string, { user: unknown; stories: unknown[] }> = {};

    for (const story of stories) {
      const uid = story.user_id;
      if (!grouped[uid]) {
        grouped[uid] = { user: story.user, stories: [] };
      }
      const { user: _user, ...storyWithoutUser } = story;
      grouped[uid].stories.push(storyWithoutUser);
    }

    return NextResponse.json({ stories: Object.values(grouped) });
  } catch (error) {
    console.error('GET /api/stories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { media_url, media_type, duration } = body;

    if (!media_url || !media_type) {
      return NextResponse.json({ error: 'media_url and media_type are required' }, { status: 400 });
    }

    const { data: storyRaw, error } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        media_url,
        media_type,
        duration: duration ?? 5000,
      })
      .select('*, user:profiles(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({ story: storyRaw }, { status: 201 });
  } catch (error) {
    console.error('POST /api/stories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
