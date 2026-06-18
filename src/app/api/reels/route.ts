import { NextResponse } from 'next/server';
import { eq, and, desc, count, inArray, lt } from 'drizzle-orm';
import { db } from '@/db';
import { reels, users, likes, savedPosts } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = 20;

    const whereClause = cursor ? lt(reels.createdAt, new Date(cursor)) : undefined;

    const reelRows = await db
      .select({
        reel: reels,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
          isVerified: users.isVerified,
        },
      })
      .from(reels)
      .leftJoin(users, eq(reels.userId, users.id))
      .where(whereClause)
      .orderBy(desc(reels.createdAt))
      .limit(limit + 1);

    const hasMore = reelRows.length > limit;
    const slice = hasMore ? reelRows.slice(0, limit) : reelRows;
    const reelIds = slice.map((r) => r.reel.id);

    let likedSet = new Set<string>();
    let likeCounts: Record<string, number> = {};

    if (reelIds.length > 0) {
      const [userLikes, likeCountRows] = await Promise.all([
        db
          .select({ targetId: likes.targetId })
          .from(likes)
          .where(
            and(
              eq(likes.userId, userId),
              inArray(likes.targetId, reelIds),
              eq(likes.targetType, 'reel')
            )
          ),
        db
          .select({ targetId: likes.targetId, cnt: count() })
          .from(likes)
          .where(and(inArray(likes.targetId, reelIds), eq(likes.targetType, 'reel')))
          .groupBy(likes.targetId),
      ]);

      likedSet = new Set(userLikes.map((l) => l.targetId));
      likeCounts = Object.fromEntries(likeCountRows.map((r) => [r.targetId, Number(r.cnt)]));
    }

    const enriched = slice.map(({ reel, user }) => ({
      ...reel,
      user,
      isLiked: likedSet.has(reel.id),
      likeCount: likeCounts[reel.id] ?? 0,
    }));

    const nextCursor = hasMore
      ? slice[slice.length - 1].reel.createdAt.toISOString()
      : null;

    return NextResponse.json({ reels: enriched, nextCursor });
  } catch (error) {
    console.error('[reels GET]', error);
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
    const { videoUrl, thumbnailUrl, caption, audioTitle, audioArtist } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    const [newReel] = await db
      .insert(reels)
      .values({ userId, videoUrl, thumbnailUrl, caption, audioTitle, audioArtist })
      .returning();

    return NextResponse.json(newReel, { status: 201 });
  } catch (error) {
    console.error('[reels POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
