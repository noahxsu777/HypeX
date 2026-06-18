import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');
  return <MainLayout user={session.user}>{children}</MainLayout>;
}
