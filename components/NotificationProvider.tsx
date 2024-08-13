'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { initSocket, getSocket } from '@/lib/socket';
import { toast } from 'sonner';
import { Socket } from 'socket.io-client';
import { NotificationType } from '@prisma/client';

type Notification = {
  id: number;
  message: string;
  type: NotificationType;
  entityId: string | number;
  entityType: 'EDB' | 'ODM';
  createdAt: string;
  additionalData?: Record<string, any>;
};

type NotificationContextType = {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  isConnected: boolean;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  const addNotification = useCallback((notification: Notification) => {
    console.log('Adding notification:', notification);
    setNotifications(prev => [notification, ...prev]);
    toast(notification.message, {
      duration: 5000,
      action: {
        label: 'Voir',
        onClick: () => {
          // Navigate to the relevant page based on entityType and entityId
          // You'll need to implement this navigation logic
        },
      },
    });
  }, []);

  useEffect(() => {
    let socket: Socket | null = null;

    const setupSocket = async () => {
      if (session?.user) {
        try {
          socket = await getSocket();
          setIsConnected(true);

          socket.on('new_notification', (notification: Notification) => {
            console.log('Received new notification:', notification);
            addNotification(notification);
          });

          socket.on('disconnect', () => setIsConnected(false));
          socket.on('connect', () => setIsConnected(true));

          console.log('Socket setup complete');
          // Fetch existing notifications if needed
          // fetchNotifications();
        } catch (error) {
          console.error('Error setting up socket:', error);
          setIsConnected(false);
        }
      }
    };

    setupSocket();

    return () => {
      if (socket) {
        console.log('Cleaning up socket');
        socket.off('new_notification');
        socket.off('disconnect');
        socket.off('connect');
      }
    };
  }, [session, addNotification]);

  const markAsRead = async (id: number) => {
    // Implement API call to mark notification as read
    // await fetch(`/api/notifications/${id}`, { method: 'PUT' });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = async () => {
    // Implement API call to mark all notifications as read
    // await fetch('/api/notifications/mark-all-read', { method: 'PUT' });
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, isConnected }}>
      {children}
    </NotificationContext.Provider>
  );
};