import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'] },
});

app.use(cors());
app.use(express.json());

// Make io available to routes via app
app.set('io', io);

// Import routes - routes needing io use factory pattern
import authRoutes from './routes/auth.js';
import roomRoutesFactory from './routes/rooms.js';
import giftRoutesFactory from './routes/gifts.js';
import pkRoutesFactory from './routes/pk.js';
import userRoutesFactory from './routes/users.js';

const roomRoutes = roomRoutesFactory(io);
const giftRoutes = giftRoutesFactory(io);
const pkRoutes = pkRoutesFactory(io);
const userRoutes = userRoutesFactory(io);

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/pk', pkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a room channel
  socket.on('join:room', (roomId) => {
    socket.join(`room:${roomId}`);
    socket.data.roomId = roomId;
    console.log(`Socket ${socket.id} joined room:${roomId}`);

    // Increment viewer count
    import('./db/database.js').then(({ default: db }) => {
      db.prepare(
        "UPDATE rooms SET viewer_count = viewer_count + 1 WHERE id = ? AND status = 'live'"
      ).run(roomId);
      const room = db.prepare('SELECT viewer_count FROM rooms WHERE id = ?').get(roomId);
      if (room) {
        io.to(`room:${roomId}`).emit('room:viewer_count', { count: room.viewer_count });
      }
    });
  });

  // Leave a room channel
  socket.on('leave:room', (roomId) => {
    socket.leave(`room:${roomId}`);
    decrementViewerCount(roomId);
  });

  // Send a chat message (no DB write - ephemeral)
  socket.on('chat:send', ({ roomId, userId, username, content }) => {
    if (!roomId || !content) return;
    io.to(`room:${roomId}`).emit('room:new_comment', {
      id: Date.now().toString(),
      userId,
      username,
      content,
      timestamp: new Date().toISOString(),
    });
  });

  // Join personal notification channel
  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
  });

  // Disconnect - decrement viewer count if in a room
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket.data.roomId) {
      decrementViewerCount(socket.data.roomId);
    }
  });
});

async function decrementViewerCount(roomId) {
  try {
    const { default: db } = await import('./db/database.js');
    db.prepare(
      "UPDATE rooms SET viewer_count = MAX(0, viewer_count - 1) WHERE id = ? AND status = 'live'"
    ).run(roomId);
    const room = db.prepare('SELECT viewer_count FROM rooms WHERE id = ?').get(roomId);
    if (room) {
      io.to(`room:${roomId}`).emit('room:viewer_count', { count: room.viewer_count });
    }
  } catch (err) {
    console.error('Error decrementing viewer count:', err);
  }
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`LiveWave server running on port ${PORT}`);
});

export { io };
