'use client'

import React, { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socket';

export const TestNotificationButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const simulateNotification = async () => {
    setIsLoading(true);
    try {
      const socket = await getSocket();
      const notificationData = {
        id: Math.floor(Math.random() * 1000000),
        message: 'This is a simulated notification',
        createdAt: new Date().toISOString(),
      };
      socket.emit('simulate_notification', notificationData);
      // Don't show a success toast here, as it will be handled by the notification listener
    } catch (error) {
      console.error('Error simulating notification:', error);
      toast.error('Failed to simulate notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={simulateNotification} disabled={isLoading}>
      {isLoading ? 'Simulating...' : 'Simulate Notification'}
    </Button>
  );
};