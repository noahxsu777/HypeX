import { createClient } from '@/lib/supabase/server';
import HomeFeed from '@/components/home/HomeFeed';
import LoginPage from '@/app/(auth)/login/page';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Show login at the root URL when not authenticated — no redirect
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <HomeFeed userId={user.id} />
    </div>
  );
}
