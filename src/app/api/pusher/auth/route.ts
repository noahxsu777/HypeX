import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher-server';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.text();
    const params = new URLSearchParams(body);
    const socketId = params.get('socket_id')!;
    const channel = params.get('channel_name')!;

    const authResponse = pusherServer.authorizeChannel(socketId, channel, {
      user_id: session.user.id as string,
      user_info: { name: session.user.name },
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('[pusher/auth POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
