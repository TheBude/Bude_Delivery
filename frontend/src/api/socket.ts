import { io, Socket } from 'socket.io-client';
import { getToken } from './client';
import { APP_CONFIG } from '../constants';

let socket: Socket | null = null;

export const initSocket = (userId?: string, role?: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = getToken();

  socket = io(APP_CONFIG.SOCKET_URL, {
    auth: {
      token: token || undefined,
      userId,
      role,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to server, ID:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
