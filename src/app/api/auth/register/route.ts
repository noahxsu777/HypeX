import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { users, accounts } from '@/db/schema';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, email, password } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if email or username already exists
    const existing = await db
      .select({ id: users.id, email: users.email, username: users.username })
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);

    if (existing.length > 0) {
      const taken = existing[0];
      if (taken.email === email) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    const passwordHash = await bcryptjs.hash(password, 12);

    // Insert user
    const [newUser] = await db
      .insert(users)
      .values({ name, username, email, image: null })
      .returning();

    // Store password hash in accounts.access_token (credentials provider approach)
    await db.insert(accounts).values({
      userId: newUser.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: email,
      access_token: passwordHash,
    });

    const { ...userWithoutSensitive } = newUser;
    return NextResponse.json(userWithoutSensitive, { status: 201 });
  } catch (error) {
    console.error('[register]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
