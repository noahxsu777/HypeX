import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MyProfilePage() {
  const session = await auth();
  const username = (session?.user as any)?.username || session?.user?.name || 'me';
  redirect(`/profile/${username}`);
}
