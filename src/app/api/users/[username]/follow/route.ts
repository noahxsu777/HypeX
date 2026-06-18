import { NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { db } from '@/db';
import { users, follows, notifications } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await params;
    const followerId = session.user.id;

    // Resolve username to id
    const targetUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const followingId = targetUser[0].id;

    if (followerId === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
      .limit(1);

    let following: boolean;

    if (existing.length > 0) {
      await db
        .delete(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
      following = false;
    } else {
      await db.insert(follows).values({ followerId, followingId });
      following = true;

      // Create follow notification
      await db.insert(notifications).values({
        userId: followingId,
        actorId: followerId,
        type: 'follow',
        targetId: followerId,
        targetType: 'user',
      });
    }

    const [{ cnt: followerCount }] = await db
      .select({ cnt: count() })
      .from(follows)
      .where(eq(follows.followingId, followingId));

    return NextResponse.json({ following, followerCount: Number(followerCount) });
  } catch (error) {
    console.error('[users/[username]/follow POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
