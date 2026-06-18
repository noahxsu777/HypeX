import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SettingsPage from '@/components/settings/SettingsPage';

export default async function Settings() {
  const session = await auth();
  if (!session) redirect('/login');
  return <SettingsPage user={session.user} />;
}
