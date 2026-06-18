import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcryptjs from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from '@/db/schema';

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          return null;
        }

        // Users authenticated via OAuth won't have a password hash stored
        // in the users table. In a full implementation you'd have a separate
        // passwords table. For now we cast image as potential hash source or
        // return null for OAuth-only accounts.
        const passwordHash = (user as unknown as Record<string, unknown>)
          .passwordHash as string | undefined;

        if (!passwordHash) {
          return null;
        }

        const isValid = await bcryptjs.compare(password, passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = (token.username ?? null) as string | null;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as typeof user & { username?: string | null }).username;
      }

      // Refresh username from DB on every token rotation in case it changed
      if (token.id && !token.username) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
        });
        if (dbUser) {
          token.username = dbUser.username;
        }
      }

      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
});
