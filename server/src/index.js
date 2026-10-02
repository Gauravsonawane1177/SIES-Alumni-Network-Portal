const http = require('http');
const { Server } = require('socket.io');
const env = require('./config/env');
const { pool } = require('./config/db');
const app = require('./app');
const { attachSocket } = require('./socket');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.clientUrl,
    credentials: true
  }
});

attachSocket(io);

server.listen(env.port, async () => {
  try {
    await pool.query('SELECT 1');
    console.log(`API listening on port ${env.port}`);
  } catch (error) {
    console.error('Database connection failed. Check DATABASE_URL.');
    console.error(error.message);
    process.exit(1);
  }
});
