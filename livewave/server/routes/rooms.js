import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

export default (io) => {
  const router = express.Router();

  // GET /api/rooms/live - paginated list of live rooms with optional category filter
  router.get('/live', (req, res) => {
    const { category, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT r.*, u.username AS host_username, u.avatar_url AS host_avatar
      FROM rooms r
      JOIN users u ON r.host_id = u.id
      WHERE r.status = 'live'
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ' AND r.category = ?';
      params.push(category);
    }

    query += ' ORDER BY r.viewer_count DESC, r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const rooms = db.prepare(query).all(...params);

    const countQuery = category && category !== 'all'
      ? "SELECT COUNT(*) AS total FROM rooms WHERE status = 'live' AND category = ?"
      : "SELECT COUNT(*) AS total FROM rooms WHERE status = 'live'";
    const countParams = category && category !== 'all' ? [category] : [];
    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      rooms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  });

  // POST /api/rooms/create
  router.post('/create', authenticate, (req, res) => {
    const { title, category = 'entertainment', thumbnail_url } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    // End any existing live room by this user
    db.prepare(
      "UPDATE rooms SET status = 'ended', ended_at = CURRENT_TIMESTAMP, viewer_count = 0 WHERE host_id = ? AND status = 'live'"
    ).run(req.user.id);

    const id = uuidv4();
    db.prepare(
      'INSERT INTO rooms (id, host_id, title, category, thumbnail_url) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.user.id, title, category, thumbnail_url || null);

    const room = db.prepare(`
      SELECT r.*, u.username AS host_username, u.avatar_url AS host_avatar
      FROM rooms r JOIN users u ON r.host_id = u.id
      WHERE r.id = ?
    `).get(id);

    // Notify all clients about new live room
    io.emit('room:created', room);

    res.status(201).json({ room });
  });

  // POST /api/rooms/end
  router.post('/end', authenticate, (req, res) => {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ error: 'roomId is required' });

    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.host_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the host can end this stream' });
    }

    db.prepare(
      "UPDATE rooms SET status = 'ended', ended_at = CURRENT_TIMESTAMP, viewer_count = 0 WHERE id = ?"
    ).run(roomId);

    // End any active PK sessions for this room
    db.prepare(`
      UPDATE pk_sessions SET status = 'ended', ended_at = CURRENT_TIMESTAMP
      WHERE (room_a_id = ? OR room_b_id = ?) AND status = 'active'
    `).run(roomId, roomId);

    io.to(`room:${roomId}`).emit('room:ended', { roomId });

    res.json({ success: true, roomId });
  });

  // GET /api/rooms/:id - single room with host info
  router.get('/:id', (req, res) => {
    const room = db.prepare(`
      SELECT r.*, u.username AS host_username, u.avatar_url AS host_avatar,
             u.bio AS host_bio, u.followers_count AS host_followers
      FROM rooms r JOIN users u ON r.host_id = u.id
      WHERE r.id = ?
    `).get(req.params.id);

    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Fetch recent comments
    const comments = db.prepare(
      'SELECT * FROM comments WHERE room_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(req.params.id);

    res.json({ room, comments: comments.reverse() });
  });

  // POST /api/rooms/:id/comment
  router.post('/:id/comment', authenticate, (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(req.user.id);
    const id = uuidv4();

    db.prepare(
      'INSERT INTO comments (id, room_id, user_id, username, content) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.params.id, req.user.id, user.username, content.trim());

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);

    io.to(`room:${req.params.id}`).emit('room:new_comment', comment);

    res.status(201).json({ comment });
  });

  // PATCH /api/rooms/:id/viewers - update viewer count
  router.patch('/:id/viewers', (req, res) => {
    const { delta = 0 } = req.body; // +1 join, -1 leave
    db.prepare(
      'UPDATE rooms SET viewer_count = MAX(0, viewer_count + ?) WHERE id = ? AND status = ?'
    ).run(parseInt(delta), req.params.id, 'live');

    const room = db.prepare('SELECT viewer_count FROM rooms WHERE id = ?').get(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    io.to(`room:${req.params.id}`).emit('room:viewer_count', { count: room.viewer_count });

    res.json({ viewer_count: room.viewer_count });
  });

  return router;
};
