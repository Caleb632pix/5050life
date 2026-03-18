/**
 * Socket.io Real-Time Handler
 * ───────────────────────────
 * Handles: live chat, bet updates, notifications, live scores, typing indicators
 */
const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
const User       = require('../models/User');
const { Message, Conversation } = require('../models/Social');
const logger     = require('../config/logger');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin:      [process.env.FRONTEND_URL, 'http://localhost:3000'],
      credentials: true
    },
    pingTimeout:  60000,
    pingInterval: 25000
  });

  // ── Auth middleware ──────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findByPk(decoded.id, {
        attributes: ['id', 'username', 'avatarUrl', 'isActive', 'isBanned']
      });

      if (!user || !user.isActive || user.isBanned) {
        return next(new Error('Access denied'));
      }

      socket.userId   = user.id;
      socket.username = user.username;
      socket.user     = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection ───────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.username} (${socket.id})`);

    // Join user's personal room for notifications
    socket.join(`user:${socket.userId}`);

    // ── Join a conversation room ────────────────────────────────────
    socket.on('join_conversation', async ({ conversationId }) => {
      try {
        const convo = await Conversation.findById(conversationId);
        if (!convo || !convo.participants.includes(socket.userId)) {
          socket.emit('error', { message: 'Access denied to this conversation' });
          return;
        }
        socket.join(`conversation:${conversationId}`);
        socket.emit('joined_conversation', { conversationId });

        // Mark messages as read
        await Message.updateMany(
          { conversationId, 'readBy.userId': { $ne: socket.userId }, senderId: { $ne: socket.userId } },
          { $push: { readBy: { userId: socket.userId, readAt: new Date() } } }
        );
      } catch (err) {
        logger.error('join_conversation error:', err);
      }
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ── Typing indicators ───────────────────────────────────────────
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId:   socket.userId,
        username: socket.username
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId
      });
    });

    // ── Betting room live updates ─────────────────────────────────
    socket.on('join_betting_room', ({ roomId }) => {
      socket.join(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('user_joined_room', {
        userId:   socket.userId,
        username: socket.username
      });
    });

    socket.on('leave_betting_room', ({ roomId }) => {
      socket.leave(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('user_left_room', {
        userId: socket.userId
      });
    });

    // ── Live bet watching ─────────────────────────────────────────
    socket.on('watch_bet', ({ betId }) => {
      socket.join(`bet:${betId}`);
    });

    socket.on('unwatch_bet', ({ betId }) => {
      socket.leave(`bet:${betId}`);
    });

    // ── Live sports event ────────────────────────────────────────
    socket.on('watch_event', ({ eventId }) => {
      socket.join(`event:${eventId}`);
    });

    socket.on('unwatch_event', ({ eventId }) => {
      socket.leave(`event:${eventId}`);
    });

    // ── Disconnect ────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.username} — ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${socket.username}:`, err);
    });
  });

  logger.info('✅ Socket.io initialised');
  return io;
}

// ── Emit helpers (called from services) ───────────────────────────────────
function emitToUser(userId, event, data) {
  if (io) io.to(`user:${userId}`).emit(event, data);
}

function emitBetUpdate(betId, data) {
  if (io) io.to(`bet:${betId}`).emit('bet_update', data);
}

function emitRoomUpdate(roomId, data) {
  if (io) io.to(`room:${roomId}`).emit('room_update', data);
}

function emitEventScore(eventId, data) {
  if (io) io.to(`event:${eventId}`).emit('score_update', data);
}

function emitLiveOdds(eventId, data) {
  if (io) io.to(`event:${eventId}`).emit('odds_update', data);
}

function broadcastNotification(event, data) {
  if (io) io.emit(event, data);
}

function getIO() { return io; }

module.exports = {
  initSocket, getIO,
  emitToUser, emitBetUpdate, emitRoomUpdate,
  emitEventScore, emitLiveOdds, broadcastNotification
};
          
