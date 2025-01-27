// hooks/useNotifications.ts
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { NotificationType } from '@prisma/client';

export type CustomNotification = {
  id: number;
  message: string;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
  etatDeBesoinId: string | null;
  ordreDeMissionId: number | null;
};

// Singleton state
let globalState = {
  notifications: [] as CustomNotification[],
  previousNotifications: [] as CustomNotification[],
  subscribers: new Set<(notifications: CustomNotification[]) => void>(),
};

// Singleton audio instance
const audioElement = typeof window !== 'undefined' ? new Audio('/assets/sounds/notification-chime.wav') : null;

async function fetchNotifications() {
  try {
    const response = await fetch('/api/notifications');
    const data: CustomNotification[] = await response.json();
    
    const newNotifications = data.filter(notification => 
      !globalState.previousNotifications.some(prevNotif => 
        prevNotif.id === notification.id
      )
    );

    const reverseOrder = [...newNotifications].reverse();

    if (reverseOrder.length > 0) {
      audioElement?.play().catch(console.error);
      
      newNotifications.forEach(notification => {
        toast("Nouvelle notification", {
          description: notification.message,
          duration: 5000
        });
      });
    }

    globalState.previousNotifications = data;
    globalState.notifications = data;
    globalState.subscribers.forEach(callback => callback(data));
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }
}

// Start polling immediately
let pollInterval: NodeJS.Timeout | null = null;
if (typeof window !== 'undefined' && !pollInterval) {
  fetchNotifications();
  pollInterval = setInterval(fetchNotifications, 10000);
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<CustomNotification[]>(globalState.notifications);

  useEffect(() => {
    // Subscribe to updates
    const callback = (newNotifications: CustomNotification[]) => {
      setNotifications(newNotifications);
    };
    globalState.subscribers.add(callback);

    // Initial fetch if no data
    if (globalState.notifications.length === 0) {
      fetchNotifications();
    }

    return () => {
      globalState.subscribers.delete(callback);
    };
  }, []);

  const markAsRead = async (id: number) => {
    await fetch(`/api/notifications/${id}`, { method: 'PUT' });
    const updatedNotifications = notifications.filter(n => n.id !== id);
    globalState.notifications = updatedNotifications;
    globalState.subscribers.forEach(callback => callback(updatedNotifications));
  };

  const markAllAsRead = async () => {
    await fetch('/api/notifications/mark-all-read', { method: 'PUT' });
    globalState.notifications = [];
    globalState.subscribers.forEach(callback => callback([]));
  };

  return { notifications, markAsRead, markAllAsRead };
}