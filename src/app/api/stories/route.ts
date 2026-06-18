import { NextResponse } from 'next/server';
import { eq, and, gt, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { stories, users, follows } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    // Get IDs of followed users
    const followingRows = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const feedUserIds = [...followingRows.map((r) => r.followingId), userId];

    const activeStories = await db
      .select({
        story: stories,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
          isVerified: users.isVerified,
        },
      })
      .from(stories)
      .leftJoin(users, eq(stories.userId, users.id))
      .where(
        and(
          inArray(stories.userId, feedUserIds),
          gt(stories.expiresAt, now)
        )
      )
      .orderBy(stories.createdAt);

    // Group by user
    const grouped: Record<
      string,
      { user: typeof activeStories[0]['user']; stories: typeof activeStories[0]['story'][] }
    > = {};

    for (const { story, user } of activeStories) {
      const uid = user?.id ?? story.userId;
      if (!grouped[uid]) {
        grouped[uid] = { user, stories: [] };
      }
      grouped[uid].stories.push(story);
    }

    return NextResponse.json({ stories: Object.values(grouped) });
  } catch (error) {
    console.error('[stories GET]', error);
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
    const { mediaUrl, mediaType, duration } = body;

    if (!mediaUrl || !mediaType) {
      return NextResponse.json({ error: 'mediaUrl and mediaType are required' }, { status: 400 });
    }

    const [newStory] = await db
      .insert(stories)
      .values({
        userId,
        mediaUrl,
        mediaType,
        duration: duration ?? 5000,
      })
      .returning();

    return NextResponse.json(newStory, { status: 201 });
  } catch (error) {
    console.error('[stories POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
