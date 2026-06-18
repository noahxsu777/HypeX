import { NextResponse } from 'next/server';
import { eq, and, desc, count, inArray, lt } from 'drizzle-orm';
import { db } from '@/db';
import { posts, users, likes, savedPosts, comments } from '@/db/schema';
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
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = 20;

    // Resolve username to id
    const targetUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUserId = targetUser[0].id;

    const whereClause = cursor
      ? and(eq(posts.userId, targetUserId), lt(posts.createdAt, new Date(cursor)))
      : eq(posts.userId, targetUserId);

    const userPosts = await db
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
      .where(whereClause)
      .orderBy(desc(posts.createdAt))
      .limit(limit + 1);

    const hasMore = userPosts.length > limit;
    const slice = hasMore ? userPosts.slice(0, limit) : userPosts;
    const postIds = slice.map((r) => r.post.id);

    let likedSet = new Set<string>();
    let savedSet = new Set<string>();
    let likeCounts: Record<string, number> = {};
    let commentCounts: Record<string, number> = {};

    if (postIds.length > 0) {
      const [userLikes, userSaved, likeCountRows, commentCountRows] = await Promise.all([
        db
          .select({ targetId: likes.targetId })
          .from(likes)
          .where(
            and(
              eq(likes.userId, currentUserId),
              inArray(likes.targetId, postIds),
              eq(likes.targetType, 'post')
            )
          ),
        db
          .select({ postId: savedPosts.postId })
          .from(savedPosts)
          .where(and(eq(savedPosts.userId, currentUserId), inArray(savedPosts.postId, postIds))),
        db
          .select({ targetId: likes.targetId, cnt: count() })
          .from(likes)
          .where(and(inArray(likes.targetId, postIds), eq(likes.targetType, 'post')))
          .groupBy(likes.targetId),
        db
          .select({ postId: comments.postId, cnt: count() })
          .from(comments)
          .where(inArray(comments.postId, postIds))
          .groupBy(comments.postId),
      ]);

      likedSet = new Set(userLikes.map((l) => l.targetId));
      savedSet = new Set(userSaved.map((s) => s.postId));
      likeCounts = Object.fromEntries(likeCountRows.map((r) => [r.targetId, Number(r.cnt)]));
      commentCounts = Object.fromEntries(commentCountRows.map((r) => [r.postId!, Number(r.cnt)]));
    }

    const enriched = slice.map(({ post, user }) => ({
      ...post,
      user,
      isLiked: likedSet.has(post.id),
      isSaved: savedSet.has(post.id),
      likeCount: likeCounts[post.id] ?? 0,
      commentCount: commentCounts[post.id] ?? 0,
    }));

    const nextCursor = hasMore
      ? slice[slice.length - 1].post.createdAt.toISOString()
      : null;

    return NextResponse.json({ posts: enriched, nextCursor });
  } catch (error) {
    console.error('[users/[username]/posts GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
