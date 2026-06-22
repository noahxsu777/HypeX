import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const COIN_PACKAGES = [
  { id: 'pkg_100', coins: 100, price_usd: 0.99, bonus: 0, label: '100 Coins' },
  { id: 'pkg_500', coins: 500, price_usd: 4.99, bonus: 0, label: '500 Coins' },
  { id: 'pkg_1000', coins: 1000, price_usd: 9.99, bonus: 100, label: '1,000 Coins + 100 Bonus' },
  { id: 'pkg_2500', coins: 2500, price_usd: 24.99, bonus: 250, label: '2,500 Coins + 250 Bonus' },
  { id: 'pkg_5000', coins: 5000, price_usd: 49.99, bonus: 750, label: '5,000 Coins + 750 Bonus' },
  { id: 'pkg_10000', coins: 10000, price_usd: 99.99, bonus: 2000, label: '10,000 Coins + 2,000 Bonus' },
];

const PACKAGE_MAP = Object.fromEntries(COIN_PACKAGES.map((p) => [p.id, p]));

export default (io) => {
  const router = express.Router();

  // GET /api/users/:id/profile
  router.get('/:id/profile', (req, res) => {
    const user = db.prepare(`
      SELECT id, username, avatar_url, bio, coins, diamonds,
             followers_count, following_count, created_at
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Recent streams
    const recentRooms = db.prepare(
      "SELECT id, title, category, status, viewer_count, created_at FROM rooms WHERE host_id = ? ORDER BY created_at DESC LIMIT 10"
    ).all(req.params.id);

    res.json({ user, recentRooms });
  });

  // POST /api/users/follow/:userId
  router.post('/follow/:userId', authenticate, (req, res) => {
    const targetId = req.params.userId;
    const followerId = req.user.id;

    if (targetId === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const target = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const existing = db.prepare(
      'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
    ).get(followerId, targetId);
    if (existing) {
      return res.status(409).json({ error: 'Already following this user' });
    }

    db.transaction(() => {
      db.prepare(
        'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)'
      ).run(followerId, targetId);
      db.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?').run(targetId);
      db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(followerId);
    })();

    io.to(`user:${targetId}`).emit('user:new_follower', {
      followerId,
      followerUsername: req.user.username,
    });

    res.json({ success: true, following: true });
  });

  // DELETE /api/users/follow/:userId
  router.delete('/follow/:userId', authenticate, (req, res) => {
    const targetId = req.params.userId;
    const followerId = req.user.id;

    const existing = db.prepare(
      'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
    ).get(followerId, targetId);
    if (!existing) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    db.transaction(() => {
      db.prepare(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?'
      ).run(followerId, targetId);
      db.prepare('UPDATE users SET followers_count = MAX(0, followers_count - 1) WHERE id = ?').run(targetId);
      db.prepare('UPDATE users SET following_count = MAX(0, following_count - 1) WHERE id = ?').run(followerId);
    })();

    res.json({ success: true, following: false });
  });

  // GET /api/leaderboard/top-gifters
  router.get('/leaderboard/top-gifters', (req, res) => {
    const topGifters = db.prepare(`
      SELECT u.id, u.username, u.avatar_url, u.diamonds,
             COALESCE(SUM(g.coin_value), 0) AS total_coins_spent
      FROM users u
      LEFT JOIN gifts g ON g.sender_id = u.id
      GROUP BY u.id
      ORDER BY u.diamonds DESC
      LIMIT 10
    `).all();
    res.json({ leaderboard: topGifters });
  });

  // GET /api/leaderboard/top-streamers
  router.get('/leaderboard/top-streamers', (req, res) => {
    const topStreamers = db.prepare(`
      SELECT u.id, u.username, u.avatar_url, u.followers_count, u.diamonds,
             COUNT(r.id) AS total_streams,
             COALESCE(SUM(r.viewer_count), 0) AS total_viewers
      FROM users u
      LEFT JOIN rooms r ON r.host_id = u.id
      GROUP BY u.id
      ORDER BY u.followers_count DESC
      LIMIT 10
    `).all();
    res.json({ leaderboard: topStreamers });
  });

  // PATCH /api/users/profile
  router.patch('/profile', authenticate, (req, res) => {
    const { bio, avatar_url } = req.body;
    const updates = [];
    const params = [];

    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio.substring(0, 200));
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      params.push(avatar_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const user = db.prepare(
      'SELECT id, username, avatar_url, bio, coins, diamonds, followers_count, following_count FROM users WHERE id = ?'
    ).get(req.user.id);

    res.json({ user });
  });

  // GET /api/users/coins/packages
  router.get('/coins/packages', (req, res) => {
    res.json({ packages: COIN_PACKAGES });
  });

  // POST /api/users/coins/purchase
  router.post('/coins/purchase', authenticate, (req, res) => {
    const { packageId } = req.body;
    if (!packageId) return res.status(400).json({ error: 'packageId is required' });

    const pkg = PACKAGE_MAP[packageId];
    if (!pkg) return res.status(400).json({ error: 'Invalid package' });

    // TODO: integrate Stripe payment verification here
    // For now, coins are added directly (demo mode)
    const totalCoins = pkg.coins + pkg.bonus;

    const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(req.user.id);

    db.transaction(() => {
      db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(totalCoins, req.user.id);
      db.prepare(
        'INSERT INTO transactions (id, user_id, type, amount, coins_before, coins_after) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        uuidv4(),
        req.user.id,
        'purchase',
        totalCoins,
        user.coins,
        user.coins + totalCoins
      );
    })();

    const updated = db.prepare('SELECT coins FROM users WHERE id = ?').get(req.user.id);

    res.json({
      success: true,
      coins_added: totalCoins,
      coins_balance: updated.coins,
      package: pkg,
      note: 'Payment processing coming soon (Stripe integration pending)',
    });
  });

  // GET /api/users/transactions - coin transaction history for current user
  router.get('/transactions', authenticate, (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const transactions = db.prepare(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(req.user.id, parseInt(limit), offset);

    res.json({ transactions });
  });

  // GET /api/users/following - users current user follows
  router.get('/following', authenticate, (req, res) => {
    const following = db.prepare(`
      SELECT u.id, u.username, u.avatar_url, u.bio, u.followers_count, f.created_at AS followed_at
      FROM follows f JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user.id);
    res.json({ following });
  });

  // GET /api/users/followers - users following the current user
  router.get('/followers', authenticate, (req, res) => {
    const followers = db.prepare(`
      SELECT u.id, u.username, u.avatar_url, u.bio, u.followers_count, f.created_at AS followed_at
      FROM follows f JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user.id);
    res.json({ followers });
  });

  return router;
};
