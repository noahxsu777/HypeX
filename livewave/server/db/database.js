import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = new Database(join(__dirname, 'livewave.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  coins INTEGER DEFAULT 500,
  diamonds INTEGER DEFAULT 0,
  bio TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'entertainment',
  status TEXT DEFAULT 'live',
  viewer_count INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  FOREIGN KEY(host_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  sender_id TEXT,
  receiver_id TEXT,
  room_id TEXT,
  gift_type TEXT,
  coin_value INTEGER DEFAULT 0,
  diamond_value INTEGER DEFAULT 0,
  pk_points INTEGER DEFAULT 0,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pk_sessions (
  id TEXT PRIMARY KEY,
  room_a_id TEXT,
  room_b_id TEXT,
  host_a_id TEXT,
  host_b_id TEXT,
  score_a INTEGER DEFAULT 0,
  score_b INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  started_at DATETIME,
  ended_at DATETIME,
  winner_room_id TEXT
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT,
  following_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT,
  amount INTEGER,
  coins_before INTEGER,
  coins_after INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  room_id TEXT,
  user_id TEXT,
  username TEXT,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// Seed demo users if not exist
const seedUsers = () => {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('demo_host');
  if (!existing) {
    const hash = bcrypt.hashSync('password123', 10);
    const users = [
      {
        id: uuidv4(),
        username: 'demo_host',
        password_hash: hash,
        coins: 10000,
        bio: 'Demo streamer',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo_host',
      },
      {
        id: uuidv4(),
        username: 'alice_live',
        password_hash: hash,
        coins: 5000,
        bio: 'Music & Dance',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      },
      {
        id: uuidv4(),
        username: 'bob_gamer',
        password_hash: hash,
        coins: 3000,
        bio: 'Gaming streamer',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      },
      {
        id: uuidv4(),
        username: 'carol_music',
        password_hash: hash,
        coins: 8000,
        bio: 'Live music',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
      },
    ];
    const insert = db.prepare(
      'INSERT INTO users (id, username, password_hash, coins, bio, avatar_url) VALUES (?, ?, ?, ?, ?, ?)'
    );
    users.forEach((u) =>
      insert.run(u.id, u.username, u.password_hash, u.coins, u.bio, u.avatar_url)
    );
    console.log('Demo users seeded');
  }
};

seedUsers();

export default db;
