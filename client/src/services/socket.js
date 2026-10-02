import { io } from 'socket.io-client';

let socket;

export function connectSocket() {
  if (socket?.connected) return socket;
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    withCredentials: true,
    transports: ['websocket', 'polling']
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
