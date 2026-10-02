const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const env = require('../config/env');
const { query } = require('../config/db');
const { persistMessage } = require('../controllers/messageController');

const onlineUsers = new Map();

function getTokenFromSocket(socket) {
  const header = socket.handshake.headers.cookie;
  if (header) {
    const parsed = cookie.parse(header);
    if (parsed.access_token) return parsed.access_token;
  }
  const auth = socket.handshake.auth && socket.handshake.auth.token;
  if (auth) return auth;
  return null;
}

function attachSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, env.jwtSecret);
      const { rows } = await query(`SELECT id, role, status FROM users WHERE id = $1`, [payload.sub]);
      if (!rows[0] || rows[0].status !== 'ACTIVE') return next(new Error('Account is not active'));
      socket.user = rows[0];
      next();
    } catch {
      next(new Error('Invalid session'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(userId);
    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
    io.emit('presence', { userId, online: true });

    socket.on('typing', ({ to }) => {
      if (to) io.to(to).emit('typing', { from: userId });
    });

    socket.on('send_message', async ({ to, content }, ack) => {
      try {
        const message = await persistMessage(userId, to, content);
        io.to(to).emit('receive_message', message);
        socket.emit('receive_message', message);
        if (typeof ack === 'function') ack({ success: true, message });
      } catch (error) {
        if (typeof ack === 'function') ack({ success: false, message: error.message });
      }
    });

    socket.on('disconnect', () => {
      const count = (onlineUsers.get(userId) || 1) - 1;
      if (count <= 0) {
        onlineUsers.delete(userId);
        io.emit('presence', { userId, online: false });
      } else {
        onlineUsers.set(userId, count);
      }
    });
  });
}

function isOnline(userId) {
  return onlineUsers.has(userId);
}

module.exports = { attachSocket, isOnline };
