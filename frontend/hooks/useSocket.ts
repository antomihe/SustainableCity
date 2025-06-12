// frontend\hooks\useSocket.ts
import { useContext } from 'react';
import { SocketContext } from '@/contexts/SocketContext';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider from @/contexts/SocketContext');
  }
  return context;
};