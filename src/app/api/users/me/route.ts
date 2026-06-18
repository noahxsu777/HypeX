import { NextResponse } from 'next/server';
import { eq, count } from 'drizzle-orm';
import { db } from '@/db';
import { users, follows, posts } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];

    const [
      [{ cnt: followerCount }],
      [{ cnt: followingCount }],
      [{ cnt: postCount }],
    ] = await Promise.all([
      db.select({ cnt: count() }).from(follows).where(eq(follows.followingId, userId)),
      db.select({ cnt: count() }).from(follows).where(eq(follows.followerId, userId)),
      db.select({ cnt: count() }).from(posts).where(eq(posts.userId, userId)),
    ]);

    return NextResponse.json({
      ...user,
      followerCount: Number(followerCount),
      followingCount: Number(followingCount),
      postCount: Number(postCount),
    });
  } catch (error) {
    console.error('[users/me GET]', error);
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
    const body = await req.json();
    const { name, username, bio, website, image } = body;

    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (image !== undefined) updateData.image = image;

    // Check if new username is taken by someone else
    if (username) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== userId) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[users/me PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
