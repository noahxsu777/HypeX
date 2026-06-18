import { auth } from '@/lib/auth';
import ChatWindow from '@/components/messages/ChatWindow';

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default async function ChatPage({ params }: Props) {
  const [session, { conversationId }] = await Promise.all([auth(), params]);
  return (
    <ChatWindow
      conversationId={conversationId}
      currentUserId={session!.user!.id as string}
      currentUserName={session!.user!.name || ''}
      currentUserImage={session!.user!.image || null}
    />
  );
}
