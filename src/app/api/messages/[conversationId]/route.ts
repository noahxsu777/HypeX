import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');

    // Verify user is a participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let query = supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(31);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: messagesRaw, error } = await query;
    if (error) throw error;

    const messages = (messagesRaw ?? []) as Array<Record<string, unknown> & { created_at: string }>;
    const hasMore = messages.length > 30;
    const pageMessages = hasMore ? messages.slice(0, 30) : messages;

    // Mark unread messages from others as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    return NextResponse.json({
      messages: pageMessages,
      next_cursor: hasMore ? pageMessages[pageMessages.length - 1].created_at : null,
    });
  } catch (error) {
    console.error('GET /api/messages/[conversationId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;
    const body = await request.json();
    const { content, media_url, media_type, reply_to_id } = body;

    if (!content && !media_url) {
      return NextResponse.json({ error: 'content or media_url is required' }, { status: 400 });
    }

    // Verify user is a participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: messageRaw, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content ?? null,
        media_url: media_url ?? null,
        media_type: media_type ?? null,
        reply_to_id: reply_to_id ?? null,
      })
      .select('*, sender:profiles(*)')
      .single();

    if (error) throw error;
    const message = messageRaw as Record<string, unknown> | null;

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Notify other participants using admin client (bypasses RLS for inserting to other users)
    const { data: otherParticipants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', user.id);

    if (otherParticipants && otherParticipants.length > 0) {
      const admin = await createAdminClient();
      await admin.from('notifications').insert(
        otherParticipants.map((p) => ({
          user_id: p.user_id,
          actor_id: user.id,
          type: 'message' as const,
          target_id: conversationId,
          target_type: 'conversation',
        }))
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('POST /api/messages/[conversationId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
