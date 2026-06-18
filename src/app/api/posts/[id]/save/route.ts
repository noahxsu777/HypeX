import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { savedPosts } from '@/db/schema';
import { auth } from '@/lib/auth';

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

    const existing = await db
      .select()
      .from(savedPosts)
      .where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)))
      .limit(1);

    let saved: boolean;

    if (existing.length > 0) {
      await db
        .delete(savedPosts)
        .where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)));
      saved = false;
    } else {
      await db.insert(savedPosts).values({ userId, postId });
      saved = true;
    }

    return NextResponse.json({ saved });
  } catch (error) {
    console.error('[posts/[id]/save POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
