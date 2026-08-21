import { io, Socket } from 'socket.io-client';
import { getSocketUrl, getApiBaseUrl } from '@/config/env';
import { ensureApiReady } from '@/api/client';
import { getStoredToken } from '@/stores/authStorage';
import type { Role } from '@/types/api';

let socket: Socket | null = null;
let socketBaseUrl: string | null = null;

function createSocket(url: string): Socket {
  return io(url, {
    autoConnect: false,
    transports: ['websocket'],
  });
}

export function getSocket(): Socket {
  const url = getSocketUrl();
  if (!socket || socketBaseUrl !== url) {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    socket = createSocket(url);
    socketBaseUrl = url;
  }
  return socket;
}

export async function connectSocket(userId: string, role: Role): Promise<Socket> {
  // Prefer the same host the REST client resolved to
  await ensureApiReady();
  const url = getSocketUrl() || getApiBaseUrl();
  if (socket && socketBaseUrl !== url) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    socketBaseUrl = null;
  }

  const s = getSocket();
  const token = await getStoredToken();

  if (s.connected) {
    s.emit('join:room', { userId, roles: [role] });
    return s;
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Socket connection timeout')), 10000);

    s.auth = { token };
    s.connect();

    s.once('connect', () => {
      clearTimeout(timeout);
      s.emit('join:room', { userId, roles: [role] });
      resolve(s);
    });

    s.once('connect_error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
