import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatWindow from '@/components/messages/ChatWindow';

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <ChatWindow conversationId={conversationId} currentUserId={user.id} />;
}
