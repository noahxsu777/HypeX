import { NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { db } from '@/db';
import { likes, reels, notifications } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reelId } = await params;
    const userId = session.user.id;

    const existing = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.targetId, reelId), eq(likes.targetType, 'reel')))
      .limit(1);

    let liked: boolean;

    if (existing.length > 0) {
      await db
        .delete(likes)
        .where(and(eq(likes.userId, userId), eq(likes.targetId, reelId), eq(likes.targetType, 'reel')));
      liked = false;
    } else {
      await db.insert(likes).values({ userId, targetId: reelId, targetType: 'reel' });
      liked = true;

      // Notify reel owner
      const reelRows = await db
        .select({ userId: reels.userId })
        .from(reels)
        .where(eq(reels.id, reelId))
        .limit(1);

      if (reelRows.length > 0 && reelRows[0].userId !== userId) {
        await db.insert(notifications).values({
          userId: reelRows[0].userId,
          actorId: userId,
          type: 'like',
          targetId: reelId,
          targetType: 'reel',
        });
      }
    }

    const [{ cnt }] = await db
      .select({ cnt: count() })
      .from(likes)
      .where(and(eq(likes.targetId, reelId), eq(likes.targetType, 'reel')));

    return NextResponse.json({ liked, count: Number(cnt) });
  } catch (error) {
    console.error('[reels/[id]/like POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
