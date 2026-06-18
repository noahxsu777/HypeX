import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function MyProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
  redirect(`/profile/${profile?.username ?? user.id}`);
}
