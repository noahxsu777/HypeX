import { NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const actor = users;
    const result = await db
      .select({
        notification: notifications,
        actor: {
          id: actor.id,
          name: actor.name,
          username: actor.username,
          image: actor.image,
          isVerified: actor.isVerified,
        },
      })
      .from(notifications)
      .leftJoin(actor, eq(notifications.actorId, actor.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    const enriched = result.map(({ notification, actor: actorInfo }) => ({
      ...notification,
      actor: actorInfo,
    }));

    return NextResponse.json({ notifications: enriched });
  } catch (error) {
    console.error('[notifications GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[notifications PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
