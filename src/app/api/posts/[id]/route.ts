import { NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { db } from '@/db';
import { posts, users, likes, savedPosts, comments } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const result = await db
      .select({
        post: posts,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
          isVerified: users.isVerified,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { post, user } = result[0];

    const [userLike, userSave, [likeCountRow], [commentCountRow]] = await Promise.all([
      db
        .select()
        .from(likes)
        .where(and(eq(likes.userId, userId), eq(likes.targetId, id), eq(likes.targetType, 'post')))
        .limit(1),
      db
        .select()
        .from(savedPosts)
        .where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, id)))
        .limit(1),
      db
        .select({ cnt: count() })
        .from(likes)
        .where(and(eq(likes.targetId, id), eq(likes.targetType, 'post'))),
      db
        .select({ cnt: count() })
        .from(comments)
        .where(eq(comments.postId, id)),
    ]);

    return NextResponse.json({
      ...post,
      user,
      isLiked: userLike.length > 0,
      isSaved: userSave.length > 0,
      likeCount: Number(likeCountRow?.cnt ?? 0),
      commentCount: Number(commentCountRow?.cnt ?? 0),
    });
  } catch (error) {
    console.error('[posts/[id] GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const existing = await db
      .select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existing[0].userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(posts).where(eq(posts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[posts/[id] DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
