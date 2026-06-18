import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import PostDetailPage from '@/components/post/PostDetailPage';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('id', id)
    .single();

  if (!post) notFound();

  return <PostDetailPage postId={id} currentUserId={user.id} />;
}
