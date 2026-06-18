import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, follows, posts } from '@/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ProfilePage from '@/components/profile/ProfilePage';

interface Props {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const [session, { username }] = await Promise.all([auth(), params]);

  // Fetch user by username
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) notFound();

  const currentUserId = session?.user?.id as string;
  const isOwnProfile = currentUserId === user.id;

  // Get counts
  const [[followerCount], [followingCount], [postCount], following] = await Promise.all([
    db.select({ value: count() }).from(follows).where(eq(follows.followingId, user.id)),
    db.select({ value: count() }).from(follows).where(eq(follows.followerId, user.id)),
    db.select({ value: count() }).from(posts).where(eq(posts.userId, user.id)),
    currentUserId && !isOwnProfile
      ? db.select().from(follows).where(and(eq(follows.followerId, currentUserId), eq(follows.followingId, user.id))).limit(1)
      : Promise.resolve([]),
  ]);

  const profileData = {
    id: user.id,
    name: user.name ?? '',
    username: user.username ?? username,
    email: user.email ?? '',
    image: user.image,
    bio: user.bio,
    website: user.website,
    isVerified: user.isVerified,
    isPrivate: user.isPrivate,
    createdAt: user.createdAt,
    _count: {
      followers: followerCount.value,
      following: followingCount.value,
      posts: postCount.value,
    },
    isFollowing: following.length > 0,
    isOwnProfile,
  };

  return <ProfilePage user={profileData} currentUserId={currentUserId} />;
}
