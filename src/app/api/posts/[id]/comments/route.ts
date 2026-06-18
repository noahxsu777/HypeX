import { NextResponse } from 'next/server';
import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '@/db';
import { comments, users, likes, notifications, posts } from '@/db/schema';
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

    const { id: postId } = await params;
    const userId = session.user.id;

    const result = await db
      .select({
        comment: comments,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
          isVerified: users.isVerified,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    // Enrich with like counts and user's like status
    const commentIds = result.map((r) => r.comment.id);
    let likedSet = new Set<string>();
    let likeCounts: Record<string, number> = {};

    if (commentIds.length > 0) {
      const { inArray } = await import('drizzle-orm');

      const [userLikes, likeCountRows] = await Promise.all([
        db
          .select({ targetId: likes.targetId })
          .from(likes)
          .where(
            and(
              eq(likes.userId, userId),
              inArray(likes.targetId, commentIds),
              eq(likes.targetType, 'comment')
            )
          ),
        db
          .select({ targetId: likes.targetId, cnt: count() })
          .from(likes)
          .where(and(inArray(likes.targetId, commentIds), eq(likes.targetType, 'comment')))
          .groupBy(likes.targetId),
      ]);

      likedSet = new Set(userLikes.map((l) => l.targetId));
      likeCounts = Object.fromEntries(likeCountRows.map((r) => [r.targetId, Number(r.cnt)]));
    }

    const enriched = result.map(({ comment, user }) => ({
      ...comment,
      user,
      isLiked: likedSet.has(comment.id),
      likeCount: likeCounts[comment.id] ?? 0,
    }));

    return NextResponse.json({ comments: enriched });
  } catch (error) {
    console.error('[posts/[id]/comments GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const body = await req.json();
    const { content, parentId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const [newComment] = await db
      .insert(comments)
      .values({ userId, postId, content, parentId: parentId ?? null })
      .returning();

    // Get commenter info
    const [commenter] = await db
      .select({ id: users.id, name: users.name, username: users.username, image: users.image })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Notify post owner
    const postRows = await db
      .select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (postRows.length > 0 && postRows[0].userId !== userId) {
      await db.insert(notifications).values({
        userId: postRows[0].userId,
        actorId: userId,
        type: 'comment',
        targetId: postId,
        targetType: 'post',
      });
    }

    // Create mention notifications for @-tagged users
    const mentionMatches = content.match(/@(\w+)/g) ?? [];
    for (const mention of mentionMatches) {
      const mentionedUsername = mention.slice(1);
      const mentionedUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, mentionedUsername))
        .limit(1);

      if (mentionedUser.length > 0 && mentionedUser[0].id !== userId) {
        await db.insert(notifications).values({
          userId: mentionedUser[0].id,
          actorId: userId,
          type: 'mention',
          targetId: newComment.id,
          targetType: 'comment',
        });
      }
    }

    return NextResponse.json({ ...newComment, user: commenter }, { status: 201 });
  } catch (error) {
    console.error('[posts/[id]/comments POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
