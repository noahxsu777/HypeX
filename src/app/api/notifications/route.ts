import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: notificationsRaw, error } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    type NotifRow = { target_type: string | null; target_id: string | null; [key: string]: unknown };
    const notifications = (notificationsRaw ?? []) as NotifRow[];

    // For post-related notifications, fetch the post
    const postTargetIds = notifications
      .filter((n) => n.target_type === 'post' && n.target_id)
      .map((n) => n.target_id as string);

    let postMap: Record<string, unknown> = {};
    if (postTargetIds.length > 0) {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, media_urls, type, caption')
        .in('id', postTargetIds);

      postMap = Object.fromEntries((posts ?? []).map((p) => [p.id, p]));
    }

    const enriched = notifications.map((n) => ({
      ...n,
      post: n.target_type === 'post' && n.target_id ? (postMap[n.target_id] ?? null) : null,
    }));

    return NextResponse.json({ notifications: enriched });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
