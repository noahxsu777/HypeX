import { NextResponse } from 'next/server';
import { eq, and, desc, lt, ne, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  messages,
  users,
  conversations,
  conversationParticipants,
  notifications,
} from '@/db/schema';
import { auth } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher-server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = 30;

    // Verify user is a participant
    const participant = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const whereClause = cursor
      ? and(
          eq(messages.conversationId, conversationId),
          lt(messages.createdAt, new Date(cursor))
        )
      : eq(messages.conversationId, conversationId);

    const msgRows = await db
      .select({
        message: messages,
        sender: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
          isVerified: users.isVerified,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(whereClause)
      .orderBy(desc(messages.createdAt))
      .limit(limit + 1);

    const hasMore = msgRows.length > limit;
    const slice = hasMore ? msgRows.slice(0, limit) : msgRows;

    // Mark unread messages from others as read
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.isRead, false),
          ne(messages.senderId, userId)
        )
      );

    const nextCursor = hasMore
      ? slice[slice.length - 1].message.createdAt.toISOString()
      : null;

    return NextResponse.json({
      messages: slice.map(({ message, sender }) => ({ ...message, sender })),
      nextCursor,
    });
  } catch (error) {
    console.error('[messages/[conversationId] GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const userId = session.user.id;
    const body = await req.json();
    const { content, mediaUrl, mediaType, replyToId } = body;

    if (!content && !mediaUrl) {
      return NextResponse.json({ error: 'content or mediaUrl is required' }, { status: 400 });
    }

    // Verify user is a participant
    const participant = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: userId,
        content: content ?? null,
        mediaUrl: mediaUrl ?? null,
        mediaType: mediaType ?? null,
        replyToId: replyToId ?? null,
      })
      .returning();

    // Update conversation updatedAt
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // Get sender info
    const [sender] = await db
      .select({ id: users.id, name: users.name, username: users.username, image: users.image })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const messageWithSender = { ...newMessage, sender };

    // Trigger Pusher event
    await pusherServer.trigger(
      `private-conv-${conversationId}`,
      'new-message',
      { message: messageWithSender }
    );

    // Notify other participants
    const otherParticipants = await db
      .select({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          ne(conversationParticipants.userId, userId)
        )
      );

    for (const p of otherParticipants) {
      await db.insert(notifications).values({
        userId: p.userId,
        actorId: userId,
        type: 'message',
        targetId: conversationId,
        targetType: 'conversation',
      });
    }

    return NextResponse.json(messageWithSender, { status: 201 });
  } catch (error) {
    console.error('[messages/[conversationId] POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
