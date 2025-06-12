// frontend\lib\socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
let socket: Socket | null = null;
let currentNamespace: string | undefined = undefined;

export const getSocket = (namespace?: string): Socket => {
  const url = namespace ? `${SOCKET_URL}/${namespace}` : SOCKET_URL;
  if (!socket || currentNamespace !== (namespace || '')) {
    // Desconectar socket anterior si existe y el namespace cambió
    if (socket && socket.connected) {
      socket.disconnect();
    }
    socket = io(url, {
      // Opcional: pasar token para autenticación de socket si tu backend lo requiere
      // auth: { token: "TU_JWT_SI_ES_NECESARIO_PARA_CONEXION_INICIAL" },
      withCredentials: true, 
      transports: ['websocket', 'polling'], 
    });
    currentNamespace = namespace || '';

    socket.on('connect', () => {
      console.log(`Socket connected: ${socket?.id} to namespace ${currentNamespace || 'default'}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected from ${currentNamespace || 'default'}: ${reason}`);
      if (reason === 'io server disconnect') {
        // el servidor desconectó la conexión, puedes intentar reconectar manualmente
        // socket.connect();
      }
    });

    socket.on('connect_error', (error: Error) => {
      console.error(`Socket connection error for namespace ${currentNamespace || 'default'}:`, error);
    });
  }
  // Always return a Socket object
  if (!socket) {
    // Fallback: create a socket if for some reason it's still null
    socket = io(url, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    currentNamespace = namespace || '';
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
    console.log('Socket disconnected manually.');
  }
  socket = null;
};