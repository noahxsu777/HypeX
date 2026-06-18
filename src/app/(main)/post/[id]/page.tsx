import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import PostDetailPage from '@/components/post/PostDetailPage';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect('/login');

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    with: { user: true },
  });

  if (!post) notFound();

  return <PostDetailPage postId={id} currentUserId={session.user.id} />;
}
