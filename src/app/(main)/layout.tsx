import { createClient } from '@/lib/supabase/server';
import MainLayout from '@/components/layout/MainLayout';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Unauthenticated: render the page content without navigation
  // The page itself will decide what to show (login form)
  if (!user) {
    return <>{children}</>;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return <MainLayout currentUserId={user.id} currentUserImage={profile?.image ?? null}>{children}</MainLayout>;
}
