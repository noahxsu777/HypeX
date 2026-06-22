import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const GIFT_CATALOG = [
  { id: 'rose', name: 'Rose', emoji: '🌹', coin_value: 1, diamond_value: 0, pk_points: 1, tier: 'basic', lottie: 'rose' },
  { id: 'kiss', name: 'Kiss', emoji: '💋', coin_value: 5, diamond_value: 0, pk_points: 5, tier: 'basic', lottie: 'kiss' },
  { id: 'beer', name: 'Beer', emoji: '🍺', coin_value: 10, diamond_value: 1, pk_points: 10, tier: 'basic', lottie: 'beer' },
  { id: 'cake', name: 'Cake', emoji: '🎂', coin_value: 50, diamond_value: 5, pk_points: 50, tier: 'mid', lottie: 'cake' },
  { id: 'sports_car', name: 'Sports Car', emoji: '🏎️', coin_value: 200, diamond_value: 20, pk_points: 200, tier: 'premium', lottie: 'sports_car' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', coin_value: 500, diamond_value: 50, pk_points: 500, tier: 'premium', lottie: 'rocket' },
  { id: 'universe', name: 'Universe', emoji: '🌌', coin_value: 2000, diamond_value: 200, pk_points: 2000, tier: 'epic', lottie: 'universe' },
  { id: 'galaxy', name: 'Galaxy', emoji: '🌠', coin_value: 5000, diamond_value: 500, pk_points: 5000, tier: 'epic', lottie: 'galaxy' },
];

const GIFT_MAP = Object.fromEntries(GIFT_CATALOG.map((g) => [g.id, g]));

export default (io) => {
  const router = express.Router();

  // GET /api/gifts/catalog
  router.get('/catalog', (req, res) => {
    res.json({ catalog: GIFT_CATALOG });
  });

  // POST /api/gifts/send
  router.post('/send', authenticate, (req, res) => {
    const { roomId, giftId, quantity = 1 } = req.body;

    if (!roomId || !giftId) {
      return res.status(400).json({ error: 'roomId and giftId are required' });
    }

    const gift = GIFT_MAP[giftId];
    if (!gift) return res.status(400).json({ error: 'Invalid gift type' });

    const qty = Math.max(1, Math.min(parseInt(quantity) || 1, 100));
    const totalCost = gift.coin_value * qty;
    const totalDiamonds = gift.diamond_value * qty;
    const totalPkPoints = gift.pk_points * qty;

    const room = db.prepare('SELECT * FROM rooms WHERE id = ? AND status = ?').get(roomId, 'live');
    if (!room) return res.status(404).json({ error: 'Room not found or not live' });

    const sender = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!sender) return res.status(404).json({ error: 'Sender not found' });

    if (sender.coins < totalCost) {
      return res.status(400).json({
        error: 'Insufficient coins',
        coins: sender.coins,
        required: totalCost,
      });
    }

    // Deduct coins from sender, add diamonds to receiver
    const sendTransaction = db.transaction(() => {
      // Deduct from sender
      db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(totalCost, sender.id);

      // Add diamonds to receiver (host)
      db.prepare('UPDATE users SET diamonds = diamonds + ? WHERE id = ?').run(totalDiamonds, room.host_id);

      // Record gift
      const giftRecord = {
        id: uuidv4(),
        sender_id: sender.id,
        receiver_id: room.host_id,
        room_id: roomId,
        gift_type: giftId,
        coin_value: totalCost,
        diamond_value: totalDiamonds,
        pk_points: totalPkPoints,
      };
      db.prepare(
        'INSERT INTO gifts (id, sender_id, receiver_id, room_id, gift_type, coin_value, diamond_value, pk_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        giftRecord.id,
        giftRecord.sender_id,
        giftRecord.receiver_id,
        giftRecord.room_id,
        giftRecord.gift_type,
        giftRecord.coin_value,
        giftRecord.diamond_value,
        giftRecord.pk_points
      );

      // Record transaction
      db.prepare(
        'INSERT INTO transactions (id, user_id, type, amount, coins_before, coins_after) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        uuidv4(),
        sender.id,
        'gift_sent',
        -totalCost,
        sender.coins,
        sender.coins - totalCost
      );

      // Update PK session score if active
      const pkSession = db.prepare(`
        SELECT * FROM pk_sessions
        WHERE status = 'active' AND (room_a_id = ? OR room_b_id = ?)
      `).get(roomId, roomId);

      if (pkSession) {
        if (pkSession.room_a_id === roomId) {
          db.prepare('UPDATE pk_sessions SET score_a = score_a + ? WHERE id = ?').run(
            totalPkPoints,
            pkSession.id
          );
        } else {
          db.prepare('UPDATE pk_sessions SET score_b = score_b + ? WHERE id = ?').run(
            totalPkPoints,
            pkSession.id
          );
        }

        const updated = db.prepare('SELECT * FROM pk_sessions WHERE id = ?').get(pkSession.id);
        io.to(`room:${pkSession.room_a_id}`).emit('pk:score_update', {
          pkSessionId: pkSession.id,
          score_a: updated.score_a,
          score_b: updated.score_b,
        });
        io.to(`room:${pkSession.room_b_id}`).emit('pk:score_update', {
          pkSessionId: pkSession.id,
          score_a: updated.score_a,
          score_b: updated.score_b,
        });
      }

      return giftRecord;
    });

    const giftRecord = sendTransaction();
    const updatedSender = db.prepare('SELECT coins FROM users WHERE id = ?').get(sender.id);

    // Emit gift animation to room
    const giftPayload = {
      giftId,
      giftName: gift.name,
      emoji: gift.emoji,
      lottie: gift.lottie,
      tier: gift.tier,
      quantity: qty,
      senderId: sender.id,
      senderUsername: sender.username,
      senderAvatar: sender.avatar_url,
      coinValue: totalCost,
      pkPoints: totalPkPoints,
    };
    io.to(`room:${roomId}`).emit('gift:received', giftPayload);

    res.json({
      success: true,
      gift: giftRecord,
      coins_remaining: updatedSender.coins,
    });
  });

  // GET /api/gifts/history/:userId
  router.get('/history/:userId', authenticate, (req, res) => {
    const { page = 1, limit = 20, type = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.params.userId;

    let query, params;

    if (type === 'sent') {
      query = `
        SELECT g.*, u.username AS receiver_username
        FROM gifts g
        LEFT JOIN users u ON g.receiver_id = u.id
        WHERE g.sender_id = ?
        ORDER BY g.sent_at DESC LIMIT ? OFFSET ?
      `;
      params = [userId, parseInt(limit), offset];
    } else if (type === 'received') {
      query = `
        SELECT g.*, u.username AS sender_username
        FROM gifts g
        LEFT JOIN users u ON g.sender_id = u.id
        WHERE g.receiver_id = ?
        ORDER BY g.sent_at DESC LIMIT ? OFFSET ?
      `;
      params = [userId, parseInt(limit), offset];
    } else {
      query = `
        SELECT g.*,
          su.username AS sender_username,
          ru.username AS receiver_username
        FROM gifts g
        LEFT JOIN users su ON g.sender_id = su.id
        LEFT JOIN users ru ON g.receiver_id = ru.id
        WHERE g.sender_id = ? OR g.receiver_id = ?
        ORDER BY g.sent_at DESC LIMIT ? OFFSET ?
      `;
      params = [userId, userId, parseInt(limit), offset];
    }

    const gifts = db.prepare(query).all(...params);
    res.json({ gifts });
  });

  return router;
};
