import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

let socketInstance = null;

export default function useSocket(roomId, handlers = {}) {
  const { token } = useAuthStore();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io('/', { auth: { token }, transports: ['websocket', 'polling'] });
    }

    if (roomId) socketInstance.emit('join:room', roomId);

    const events = [
      'room:viewer_joined',
      'room:viewer_left',
      'room:gift_received',
      'pk:invited',
      'pk:accepted',
      'pk:rejected',
      'pk:score_update',
      'pk:ended',
      'room:new_comment',
    ];

    events.forEach(event => {
      socketInstance.on(event, (data) => {
        if (handlersRef.current[event]) handlersRef.current[event](data);
      });
    });

    return () => {
      if (roomId) socketInstance.emit('leave:room', roomId);
      events.forEach(event => socketInstance.off(event));
    };
  }, [roomId, token]);

  const emit = useCallback((event, data) => {
    if (socketInstance) socketInstance.emit(event, data);
  }, []);

  return { emit, socket: socketInstance };
}
