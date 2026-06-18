import { NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { db } from '@/db';
import { users, follows, posts } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await params;
    const currentUserId = session.user.id;

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];

    const [
      [{ cnt: followerCount }],
      [{ cnt: followingCount }],
      [{ cnt: postCount }],
      isFollowingRows,
    ] = await Promise.all([
      db
        .select({ cnt: count() })
        .from(follows)
        .where(eq(follows.followingId, user.id)),
      db
        .select({ cnt: count() })
        .from(follows)
        .where(eq(follows.followerId, user.id)),
      db
        .select({ cnt: count() })
        .from(posts)
        .where(eq(posts.userId, user.id)),
      db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, currentUserId),
            eq(follows.followingId, user.id)
          )
        )
        .limit(1),
    ]);

    const isFollowing = isFollowingRows.length > 0;

    const { email, emailVerified, ...publicUser } = user;

    return NextResponse.json({
      ...publicUser,
      followerCount: Number(followerCount),
      followingCount: Number(followingCount),
      postCount: Number(postCount),
      isFollowing,
    });
  } catch (error) {
    console.error('[users/[username] GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
