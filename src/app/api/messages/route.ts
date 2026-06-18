import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get conversation IDs this user participates in
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    const convIds = participations?.map((p) => p.conversation_id) ?? [];

    if (convIds.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Get conversations ordered by updated_at
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Enrich each conversation with participants, last message, unread count
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const [participantsRes, lastMessageRes, unreadRes] = await Promise.all([
          supabase
            .from('conversation_participants')
            .select('user:profiles(*)')
            .eq('conversation_id', conv.id),
          supabase
            .from('messages')
            .select('*, sender:profiles(*)')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id),
        ]);

        const participants = (participantsRes.data as Array<{ user: unknown }> | null)?.map((p) => p.user) ?? [];
        return {
          ...conv,
          participants,
          last_message: lastMessageRes.data ?? null,
          unread_count: unreadRes.count ?? 0,
        };
      })
    );

    return NextResponse.json({ conversations: enriched });
  } catch (error) {
    console.error('GET /api/messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { participant_id, participant_ids, group_name } = body;

    const isGroup = !!group_name && Array.isArray(participant_ids) && participant_ids.length > 1;

    if (!isGroup) {
      // 1-on-1: check if conversation already exists
      const targetId = participant_id as string;
      if (!targetId) {
        return NextResponse.json({ error: 'participant_id is required' }, { status: 400 });
      }

      // Find my conversations
      const { data: myParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      const myConvIds = myParticipations?.map((p) => p.conversation_id) ?? [];

      if (myConvIds.length > 0) {
        // Find a conversation where the target is also a participant and it's not a group
        const { data: sharedRaw } = await supabase
          .from('conversation_participants')
          .select('conversation_id, conversation:conversations!inner(is_group)')
          .eq('user_id', targetId)
          .in('conversation_id', myConvIds)
          .eq('conversation.is_group', false)
          .limit(1)
          .maybeSingle();

        const shared = sharedRaw as { conversation_id: string } | null;
        if (shared) {
          return NextResponse.json({ conversation_id: shared.conversation_id });
        }
      }

      // Create new 1-on-1 conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ is_group: false })
        .select()
        .single();

      if (convError) throw convError;

      await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: targetId },
      ]);

      return NextResponse.json({ conversation_id: newConv.id }, { status: 201 });
    } else {
      // Group conversation
      const allParticipantIds: string[] = Array.isArray(participant_ids) ? [...participant_ids] : [];
      if (!allParticipantIds.includes(user.id)) {
        allParticipantIds.push(user.id);
      }

      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ is_group: true, group_name })
        .select()
        .single();

      if (convError) throw convError;

      await supabase.from('conversation_participants').insert(
        allParticipantIds.map((pid) => ({
          conversation_id: newConv.id,
          user_id: pid,
        }))
      );

      return NextResponse.json({ conversation_id: newConv.id }, { status: 201 });
    }
  } catch (error) {
    console.error('POST /api/messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
