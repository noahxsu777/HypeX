import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ConversationsList from '@/components/messages/ConversationsList';
import TopBar from '@/components/layout/TopBar';

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar title="Mensajes" />
      <div className="pt-14">
        <ConversationsList currentUserId={user.id} />
      </div>
    </div>
  );
}
