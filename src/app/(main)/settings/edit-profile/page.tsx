import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EditProfilePage from '@/components/settings/EditProfilePage';

export default async function EditProfile() {
  const session = await auth();
  if (!session) redirect('/login');
  return <EditProfilePage user={session.user} />;
}
