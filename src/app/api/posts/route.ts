import { NextResponse } from 'next/server';
import { eq, and, desc, sql, or, inArray, count, lt } from 'drizzle-orm';
import { db } from '@/db';
import { posts, users, likes, savedPosts, follows, comments, hashtags, postHashtags } from '@/db/schema';
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

    // Get IDs of users this user follows
    const followingRows = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followingIds = followingRows.map((r) => r.followingId);
    // Include own posts
    const feedUserIds = [...followingIds, userId];

    const whereClause = feedUserIds.length > 0
      ? cursor
        ? and(
            inArray(posts.userId, feedUserIds),
            lt(posts.createdAt, new Date(cursor))
          )
        : inArray(posts.userId, feedUserIds)
      : cursor
        ? and(eq(posts.userId, userId), lt(posts.createdAt, new Date(cursor)))
        : eq(posts.userId, userId);

    const feedPosts = await db
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

    const hasMore = feedPosts.length > limit;
    const slice = hasMore ? feedPosts.slice(0, limit) : feedPosts;

    // Enrich with like/save status and counts
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
          .where(and(eq(likes.userId, userId), inArray(likes.targetId, postIds), eq(likes.targetType, 'post'))),
        db
          .select({ postId: savedPosts.postId })
          .from(savedPosts)
          .where(and(eq(savedPosts.userId, userId), inArray(savedPosts.postId, postIds))),
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
    console.error('[posts GET]', error);
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
    const { caption, location, mediaUrls, type } = body;

    if (!type || !mediaUrls || mediaUrls.length === 0) {
      return NextResponse.json({ error: 'type and mediaUrls are required' }, { status: 400 });
    }

    const [newPost] = await db
      .insert(posts)
      .values({ userId, caption, location, mediaUrls, type })
      .returning();

    // Extract and upsert hashtags
    if (caption) {
      const tagMatches = caption.match(/#(\w+)/g) ?? [];
      const tagNames = tagMatches.map((t: string) => t.slice(1).toLowerCase());

      for (const tagName of tagNames) {
        // Upsert hashtag
        const existing = await db
          .select()
          .from(hashtags)
          .where(eq(hashtags.name, tagName))
          .limit(1);

        let hashtagId: string;
        if (existing.length > 0) {
          hashtagId = existing[0].id;
          await db
            .update(hashtags)
            .set({ postCount: sql`${hashtags.postCount} + 1` })
            .where(eq(hashtags.id, hashtagId));
        } else {
          const [newTag] = await db
            .insert(hashtags)
            .values({ name: tagName, postCount: 1 })
            .returning();
          hashtagId = newTag.id;
        }

        await db.insert(postHashtags).values({ postId: newPost.id, hashtagId }).onConflictDoNothing();
      }
    }

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('[posts POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
