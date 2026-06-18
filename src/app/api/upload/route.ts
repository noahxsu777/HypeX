import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadMedia } from '@/lib/cloudinary';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'posts';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadMedia(buffer, {
      folder,
      resource_type: 'auto',
    });

    return NextResponse.json({
      url: result.url,
      public_id: result.public_id,
      resource_type: result.resource_type,
    });
  } catch (error) {
    console.error('[upload POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
