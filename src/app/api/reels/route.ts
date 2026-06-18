import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');

    let query = supabase
      .from('reels')
      .select('*, user:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(21);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: reelsRaw, error } = await query;
    if (error) throw error;

    const reels = (reelsRaw ?? []) as Array<{ id: string; created_at: string; [key: string]: unknown }>;
    const hasMore = reels.length > 20;
    const pageReels = hasMore ? reels.slice(0, 20) : reels;
    const reelIds = pageReels.map((r) => r.id);

    if (reelIds.length === 0) {
      return NextResponse.json({ reels: [], next_cursor: null });
    }

    const [likeRes, likeCountsRes, commentCountsRes] = await Promise.all([
      supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', user.id)
        .eq('target_type', 'reel')
        .in('target_id', reelIds),
      supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', 'reel')
        .in('target_id', reelIds),
      supabase
        .from('comments')
        .select('reel_id')
        .in('reel_id', reelIds),
    ]);

    const likedSet = new Set(likeRes.data?.map((l) => l.target_id) ?? []);

    const likeCountMap: Record<string, number> = {};
    for (const l of likeCountsRes.data ?? []) {
      likeCountMap[l.target_id] = (likeCountMap[l.target_id] ?? 0) + 1;
    }

    const commentCountMap: Record<string, number> = {};
    for (const c of commentCountsRes.data ?? []) {
      if (c.reel_id) {
        commentCountMap[c.reel_id] = (commentCountMap[c.reel_id] ?? 0) + 1;
      }
    }

    const enriched = pageReels.map((reel) => ({
      ...reel,
      is_liked: likedSet.has(reel.id),
      _count: {
        likes: likeCountMap[reel.id] ?? 0,
        comments: commentCountMap[reel.id] ?? 0,
      },
    }));

    return NextResponse.json({
      reels: enriched,
      next_cursor: hasMore ? pageReels[pageReels.length - 1].created_at : null,
    });
  } catch (error) {
    console.error('GET /api/reels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { video_url, thumbnail_url, caption, audio_title, audio_artist } = body;

    if (!video_url) {
      return NextResponse.json({ error: 'video_url is required' }, { status: 400 });
    }

    const { data: reelRaw, error } = await supabase
      .from('reels')
      .insert({
        user_id: user.id,
        video_url,
        thumbnail_url: thumbnail_url ?? null,
        caption: caption ?? null,
        audio_title: audio_title ?? null,
        audio_artist: audio_artist ?? null,
      })
      .select('*, user:profiles(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({ reel: reelRaw }, { status: 201 });
  } catch (error) {
    console.error('POST /api/reels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
