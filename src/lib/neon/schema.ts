import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  email: text('email'),
  username: text('username').unique(),
  name: text('name'),
  bio: text('bio'),
  website: text('website'),
  image: text('image'),
  is_private: boolean('is_private').default(false),
  is_verified: boolean('is_verified').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
