import { NextResponse } from 'next/server';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { db } from '@/db';
import {
  conversations,
  conversationParticipants,
  messages,
  users,
} from '@/db/schema';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get conversations the user participates in
    const userConvs = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId));

    const convIds = userConvs.map((r) => r.conversationId);

    if (convIds.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const { inArray } = await import('drizzle-orm');

    // Get conversations with last message
    const convRows = await db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, convIds))
      .orderBy(desc(conversations.updatedAt));

    // For each conversation, get last message and participants
    const enriched = await Promise.all(
      convRows.map(async (conv) => {
        const [lastMessage] = await db
          .select({
            message: messages,
            sender: {
              id: users.id,
              name: users.name,
              username: users.username,
              image: users.image,
            },
          })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        const [{ cnt: unreadCount }] = await db
          .select({ cnt: count() })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.isRead, false),
              sql`${messages.senderId} != ${userId}`
            )
          );

        const participants = await db
          .select({
            user: {
              id: users.id,
              name: users.name,
              username: users.username,
              image: users.image,
              isVerified: users.isVerified,
            },
          })
          .from(conversationParticipants)
          .leftJoin(users, eq(conversationParticipants.userId, users.id))
          .where(eq(conversationParticipants.conversationId, conv.id));

        return {
          ...conv,
          lastMessage: lastMessage ?? null,
          unreadCount: Number(unreadCount),
          participants: participants.map((p) => p.user),
        };
      })
    );

    return NextResponse.json({ conversations: enriched });
  } catch (error) {
    console.error('[messages GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { participantId, participantIds, groupName } = body;

    const isGroup = !!groupName && Array.isArray(participantIds) && participantIds.length > 1;

    if (!isGroup) {
      // 1-on-1: check if conversation already exists
      const targetId = participantId as string;
      if (!targetId) {
        return NextResponse.json({ error: 'participantId is required' }, { status: 400 });
      }

      // Find existing 1-on-1 conversation between userId and targetId
      const myConvs = await db
        .select({ conversationId: conversationParticipants.conversationId })
        .from(conversationParticipants)
        .where(eq(conversationParticipants.userId, userId));

      const myConvIds = myConvs.map((r) => r.conversationId);

      if (myConvIds.length > 0) {
        const { inArray } = await import('drizzle-orm');

        // Find conversation where target is also a participant and it's not a group
        const shared = await db
          .select({ conversationId: conversationParticipants.conversationId })
          .from(conversationParticipants)
          .leftJoin(
            conversations,
            eq(conversationParticipants.conversationId, conversations.id)
          )
          .where(
            and(
              eq(conversationParticipants.userId, targetId),
              inArray(conversationParticipants.conversationId, myConvIds),
              eq(conversations.isGroup, false)
            )
          )
          .limit(1);

        if (shared.length > 0) {
          return NextResponse.json({ conversationId: shared[0].conversationId });
        }
      }

      // Create new 1-on-1 conversation
      const [newConv] = await db
        .insert(conversations)
        .values({ isGroup: false })
        .returning();

      await db.insert(conversationParticipants).values([
        { conversationId: newConv.id, userId },
        { conversationId: newConv.id, userId: targetId },
      ]);

      return NextResponse.json({ conversationId: newConv.id }, { status: 201 });
    } else {
      // Group conversation
      const allParticipantIds = Array.isArray(participantIds) ? participantIds : [];
      if (!allParticipantIds.includes(userId)) {
        allParticipantIds.push(userId);
      }

      const [newConv] = await db
        .insert(conversations)
        .values({ isGroup: true, groupName })
        .returning();

      await db.insert(conversationParticipants).values(
        allParticipantIds.map((pid: string) => ({
          conversationId: newConv.id,
          userId: pid,
        }))
      );

      return NextResponse.json({ conversationId: newConv.id }, { status: 201 });
    }
  } catch (error) {
    console.error('[messages POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
