import { NextResponse } from 'next/server';
import { eq, and, count, or, ilike } from 'drizzle-orm';
import { db } from '@/db';
import { users, follows } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    if (!q) {
      return NextResponse.json({ users: [] });
    }

    const searchPattern = `%${q}%`;

    const matchedUsers = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
        bio: users.bio,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(or(ilike(users.username, searchPattern), ilike(users.name, searchPattern)))
      .limit(20);

    if (matchedUsers.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const userIds = matchedUsers.map((u) => u.id);

    // Get follower counts and isFollowing status for each matched user
    const { inArray } = await import('drizzle-orm');

    const [followerCountRows, isFollowingRows] = await Promise.all([
      db
        .select({ followingId: follows.followingId, cnt: count() })
        .from(follows)
        .where(inArray(follows.followingId, userIds))
        .groupBy(follows.followingId),
      db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(
          and(
            eq(follows.followerId, currentUserId),
            inArray(follows.followingId, userIds)
          )
        ),
    ]);

    const followerCounts = Object.fromEntries(
      followerCountRows.map((r) => [r.followingId, Number(r.cnt)])
    );
    const followingSet = new Set(isFollowingRows.map((r) => r.followingId));

    const enriched = matchedUsers.map((user) => ({
      ...user,
      followerCount: followerCounts[user.id] ?? 0,
      isFollowing: followingSet.has(user.id),
    }));

    return NextResponse.json({ users: enriched });
  } catch (error) {
    console.error('[users/search GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
