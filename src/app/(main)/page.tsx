import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HomeFeed from '@/components/home/HomeFeed';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div className="min-h-screen bg-white dark:bg-black pt-0">
      <HomeFeed userId={user.id} />
    </div>
  );
}
