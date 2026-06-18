import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ProfilePage from '@/components/profile/ProfilePage';

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) notFound();

  const [followersRes, followingRes, postsRes, isFollowingRes] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
    profile.id !== user.id
      ? supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id).eq('following_id', profile.id)
      : Promise.resolve({ count: 0 }),
  ]);

  return (
    <ProfilePage
      user={{
        ...profile,
        _count: {
          followers: followersRes.count ?? 0,
          following: followingRes.count ?? 0,
          posts: postsRes.count ?? 0,
        },
        is_following: (isFollowingRes.count ?? 0) > 0,
        is_own_profile: profile.id === user.id,
      }}
      currentUserId={user.id}
    />
  );
}
