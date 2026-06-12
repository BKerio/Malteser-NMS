import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '@/config/env';
import { getStoredToken } from '@/stores/authStorage';
import type { Role } from '@/types/api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
}

export async function connectSocket(userId: string, role: Role): Promise<Socket> {
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
