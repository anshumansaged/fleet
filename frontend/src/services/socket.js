import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = (ownerId) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, { transports: ['websocket'] });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket.emit('join_owner_room', ownerId);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
