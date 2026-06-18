import { auth } from '@/lib/auth';
import ConversationsList from '@/components/messages/ConversationsList';
import TopBar from '@/components/layout/TopBar';
import { SquarePen } from 'lucide-react';

export default async function MessagesPage() {
  const session = await auth();
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar
        title="Mensajes"
        right={
          <a href="/messages/new" className="p-2 text-gray-700 dark:text-gray-300">
            <SquarePen size={22} />
          </a>
        }
      />
      <div className="pt-14">
        <ConversationsList currentUserId={session!.user!.id as string} />
      </div>
    </div>
  );
}
