import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditProfilePage from '@/components/settings/EditProfilePage';

export default async function EditProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <EditProfilePage />;
}
