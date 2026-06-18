import { NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { db } from '@/db';
import { likes, posts, notifications } from '@/db/schema';
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

    const { id: postId } = await params;
    const userId = session.user.id;

    const existing = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.targetId, postId), eq(likes.targetType, 'post')))
      .limit(1);

    let liked: boolean;

    if (existing.length > 0) {
      await db
        .delete(likes)
        .where(and(eq(likes.userId, userId), eq(likes.targetId, postId), eq(likes.targetType, 'post')));
      liked = false;
    } else {
      await db.insert(likes).values({ userId, targetId: postId, targetType: 'post' });
      liked = true;

      // Create notification for post owner (skip if liking own post)
      const postRows = await db
        .select({ userId: posts.userId })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (postRows.length > 0 && postRows[0].userId !== userId) {
        await db.insert(notifications).values({
          userId: postRows[0].userId,
          actorId: userId,
          type: 'like',
          targetId: postId,
          targetType: 'post',
        });
      }
    }

    const [{ cnt }] = await db
      .select({ cnt: count() })
      .from(likes)
      .where(and(eq(likes.targetId, postId), eq(likes.targetType, 'post')));

    return NextResponse.json({ liked, count: Number(cnt) });
  } catch (error) {
    console.error('[posts/[id]/like POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
