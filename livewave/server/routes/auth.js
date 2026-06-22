import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

function generateZegoToken(appId, userId, secret, expireTime = 3600) {
  const timestamp = Math.floor(Date.now() / 1000);
  const expireTimestamp = timestamp + expireTime;
  const nonce = Math.floor(Math.random() * 2147483647);

  const payload = JSON.stringify({
    app_id: appId,
    user_id: userId,
    nonce,
    ctime: timestamp,
    expire: expireTimestamp,
  });

  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');

  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, password, phone } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be 3-30 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password, 10);
  const avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  db.prepare(
    'INSERT INTO users (id, username, phone, password_hash, avatar_url) VALUES (?, ?, ?, ?, ?)'
  ).run(id, username, phone || null, password_hash, avatar_url);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const token = signToken(user);

  res.status(201).json({ token, user: safeUser(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user);
  res.json({ token, user: safeUser(user) });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: safeUser(user) });
});

// POST /api/auth/token  - generate ZEGOCLOUD token
router.post('/token', authenticate, (req, res) => {
  const appId = parseInt(process.env.ZEGO_APP_ID) || 0;
  const appSign = process.env.ZEGO_APP_SIGN || 'placeholder_secret';
  const token = generateZegoToken(appId, req.user.id, appSign);
  res.json({ token, userId: req.user.id, appId });
});

export default router;
