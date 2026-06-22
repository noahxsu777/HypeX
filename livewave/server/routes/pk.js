import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

// Track active PK timers so we can clear them on early end
const pkTimers = new Map();

export default (io) => {
  const router = express.Router();

  // POST /api/pk/invite - challenger invites another streamer to PK
  router.post('/invite', authenticate, (req, res) => {
    const { inviterRoomId, targetUsername } = req.body;

    if (!inviterRoomId || !targetUsername) {
      return res.status(400).json({ error: 'inviterRoomId and targetUsername are required' });
    }

    // Validate inviter's room
    const inviterRoom = db.prepare(
      "SELECT * FROM rooms WHERE id = ? AND status = 'live' AND host_id = ?"
    ).get(inviterRoomId, req.user.id);
    if (!inviterRoom) {
      return res.status(404).json({ error: 'Your live room not found' });
    }

    // Find target user
    const targetUser = db.prepare('SELECT * FROM users WHERE username = ?').get(targetUsername);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }
    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot invite yourself to PK' });
    }

    // Find target's live room
    const targetRoom = db.prepare(
      "SELECT * FROM rooms WHERE host_id = ? AND status = 'live'"
    ).get(targetUser.id);
    if (!targetRoom) {
      return res.status(404).json({ error: 'Target user is not currently live' });
    }

    // Check no existing pending/active PK for either room
    const existingPk = db.prepare(`
      SELECT id FROM pk_sessions
      WHERE status IN ('pending', 'active')
        AND (room_a_id = ? OR room_b_id = ? OR room_a_id = ? OR room_b_id = ?)
    `).get(inviterRoomId, inviterRoomId, targetRoom.id, targetRoom.id);
    if (existingPk) {
      return res.status(409).json({ error: 'One of the rooms already has an active PK' });
    }

    const pkSessionId = uuidv4();
    db.prepare(`
      INSERT INTO pk_sessions (id, room_a_id, room_b_id, host_a_id, host_b_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(pkSessionId, inviterRoomId, targetRoom.id, req.user.id, targetUser.id);

    const pkSession = db.prepare('SELECT * FROM pk_sessions WHERE id = ?').get(pkSessionId);
    const inviter = db.prepare('SELECT id, username, avatar_url FROM users WHERE id = ?').get(req.user.id);

    // Notify target's room of the PK invite
    io.to(`room:${targetRoom.id}`).emit('pk:invited', {
      pkSessionId,
      inviterRoom: inviterRoom,
      inviterUser: inviter,
      targetRoomId: targetRoom.id,
    });

    res.status(201).json({ pkSession, message: 'PK invitation sent' });
  });

  // POST /api/pk/accept
  router.post('/accept', authenticate, (req, res) => {
    const { pkSessionId } = req.body;
    if (!pkSessionId) return res.status(400).json({ error: 'pkSessionId is required' });

    const pkSession = db.prepare('SELECT * FROM pk_sessions WHERE id = ?').get(pkSessionId);
    if (!pkSession) return res.status(404).json({ error: 'PK session not found' });
    if (pkSession.status !== 'pending') {
      return res.status(400).json({ error: 'PK session is not pending' });
    }
    if (pkSession.host_b_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the invited host can accept' });
    }

    // Start PK
    db.prepare(
      "UPDATE pk_sessions SET status = 'active', started_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(pkSessionId);

    const updated = db.prepare('SELECT * FROM pk_sessions WHERE id = ?').get(pkSessionId);

    // Notify both rooms
    io.to(`room:${pkSession.room_a_id}`).emit('pk:accepted', { pkSession: updated });
    io.to(`room:${pkSession.room_b_id}`).emit('pk:accepted', { pkSession: updated });

    // Auto-end after 5 minutes
    const timer = setTimeout(() => {
      endPkSession(pkSessionId, io, 'timeout');
    }, 5 * 60 * 1000);
    pkTimers.set(pkSessionId, timer);

    res.json({ pkSession: updated, durationSeconds: 300 });
  });

  // POST /api/pk/reject
  router.post('/reject', authenticate, (req, res) => {
    const { pkSessionId } = req.body;
    if (!pkSessionId) return res.status(400).json({ error: 'pkSessionId is required' });

    const pkSession = db.prepare('SELECT * FROM pk_sessions WHERE id = ?').get(pkSessionId);
    if (!pkSession) return res.status(404).json({ error: 'PK session not found' });
    if (pkSession.status !== 'pending') {
      return res.status(400).json({ error: 'PK session is not pending' });
    }
    if (pkSession.host_b_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the invited host can reject' });
    }

    db.prepare(
      "UPDATE pk_sessions SET status = 'rejected', ended_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(pkSessionId);

    const rejecter = db.prepare('SELECT username FROM users WHERE id = ?').get(req.user.id);

    io.to(`room:${pkSession.room_a_id}`).emit('pk:rejected', {
      pkSessionId,
      rejectedBy: rejecter.username,
    });

    res.json({ success: true, message: 'PK invitation rejected' });
  });

  // POST /api/pk/end - manually end PK before timeout
  router.post('/end', authenticate, (req, res) => {
    const { pkSessionId } = req.body;
    if (!pkSessionId) return res.status(400).json({ error: 'pkSessionId is required' });

    const pkSession = db.prepare('SELECT * FROM pk_sessions WHERE id = ?').get(pkSessionId);
    if (!pkSession) return res.status(404).json({ error: 'PK session not found' });
    if (pkSession.status !== 'active') {
      return res.status(400).json({ error: 'PK session is not active' });
    }
    if (pkSession.host_a_id !== req.user.id && pkSession.host_b_id !== req.user.id) {
      return res.status(403).json({ error: 'Only PK hosts can end the session' });
    }

    const result = endPkSession(pkSessionId, io, 'manual');
    res.json(result);
  });

  // GET /api/pk/status/:pkSessionId
  router.get('/status/:pkSessionId', (req, res) => {
    const pkSession = db.prepare('SELECT * FROM pk_sessions WHERE id = ?').get(req.params.pkSessionId);
    if (!pkSession) return res.status(404).json({ error: 'PK session not found' });

    const hostA = db.prepare('SELECT id, username, avatar_url FROM users WHERE id = ?').get(pkSession.host_a_id);
    const hostB = db.prepare('SELECT id, username, avatar_url FROM users WHERE id = ?').get(pkSession.host_b_id);

    res.json({ pkSession, hostA, hostB });
  });

  // GET /api/pk/active - list all active PK sessions
  router.get('/active', (req, res) => {
    const sessions = db.prepare(`
      SELECT pk.*,
        ua.username AS host_a_username, ua.avatar_url AS host_a_avatar,
        ub.username AS host_b_username, ub.avatar_url AS host_b_avatar,
        ra.title AS room_a_title, rb.title AS room_b_title
      FROM pk_sessions pk
      JOIN users ua ON pk.host_a_id = ua.id
      JOIN users ub ON pk.host_b_id = ub.id
      JOIN rooms ra ON pk.room_a_id = ra.id
      JOIN rooms rb ON pk.room_b_id = rb.id
      WHERE pk.status = 'active'
    `).all();
    res.json({ sessions });
  });

  return router;
};

// Helper: end PK session, determine winner, emit events
function endPkSession(pkSessionId, io, reason = 'manual') {
  // Clear timer if exists
  if (pkTimers.has(pkSessionId)) {
    clearTimeout(pkTimers.get(pkSessionId));
    pkTimers.delete(pkSessionId);
  }

  const pkSession = db.prepare('SELECT * FROM pk_sessions WHERE id = ?').get(pkSessionId);
  if (!pkSession || pkSession.status !== 'active') {
    return { error: 'PK session not active' };
  }

  let winnerRoomId = null;
  if (pkSession.score_a > pkSession.score_b) {
    winnerRoomId = pkSession.room_a_id;
  } else if (pkSession.score_b > pkSession.score_a) {
    winnerRoomId = pkSession.room_b_id;
  }
  // null = tie

  db.prepare(`
    UPDATE pk_sessions
    SET status = 'ended', ended_at = CURRENT_TIMESTAMP, winner_room_id = ?
    WHERE id = ?
  `).run(winnerRoomId, pkSessionId);

  const updated = db.prepare('SELECT * FROM pk_sessions WHERE id = ?').get(pkSessionId);

  const resultPayload = {
    pkSessionId,
    score_a: updated.score_a,
    score_b: updated.score_b,
    winnerRoomId,
    reason,
  };

  io.to(`room:${pkSession.room_a_id}`).emit('pk:ended', resultPayload);
  io.to(`room:${pkSession.room_b_id}`).emit('pk:ended', resultPayload);

  return { pkSession: updated, winnerRoomId, reason };
}
