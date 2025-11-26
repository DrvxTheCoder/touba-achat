// hooks/useNotifications.ts
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { NotificationType } from '@prisma/client';


// Singleton state
let globalState = {
  notifications: [] as CustomNotification[],
  previousNotifications: [] as CustomNotification[],
  subscribers: new Set<(notifications: CustomNotification[]) => void>(),
};

export type CustomNotification = {
  id: number;
  message: string;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
  etatDeBesoinId: string | null;
  ordreDeMissionId: number | null;
};

const extractDocumentId = (message: string): { type: 'edb' | 'odm' | 'bdc' | null, id: string | null } => {
  const edbMatch = message.match(/EDB-[A-Z0-9]+/);
  const odmMatch = message.match(/ODM-[A-Z0-9]+/);
  const bdcMatch = message.match(/BDC\d{4}\d{1}\d{1}-\d{3}/);

  if (edbMatch) return { type: 'edb', id: edbMatch[0] };
  if (odmMatch) return { type: 'odm', id: odmMatch[0] };
  if (bdcMatch) return { type: 'bdc', id: bdcMatch[0] };
  
  return { type: null, id: null };
};

const generateDocumentUrl = (type: 'edb' | 'odm' | 'bdc' | null, id: string | null): string => {
  if (!type || !id) return '';
  
  switch (type) {
    case 'edb':
      return `/dashboard/etats/${id}`;
    case 'odm':
      return `/dashboard/odm/${id}`;
    case 'bdc':
      return `/bdc?bdcId=${id}`;
    default:
      return '';
  }
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

    // Only show toasts for the 3 most recent notifications
    if (newNotifications.length > 0) {
      audioElement?.play().catch(console.error);
      
      // Sort by creation date (newest first) and take only the first 3
      const recentNotifications = [...newNotifications]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4);
      
      recentNotifications.forEach(notification => {
        const { type, id } = extractDocumentId(notification.message);
        const url = generateDocumentUrl(type, id);

        toast("Nouvelle notification", {
          description: notification.message,
          duration: 3000,
          action: {
            label: "Voir",
            onClick: () => {
              // Mark as read when clicking the action button
              window.location.href = url;
              fetch(`/api/notifications/${notification.id}`, { method: 'PUT' });
            },
          },
        });
      });
      
      // If there are more notifications than we're showing
      const hiddenCount = newNotifications.length - recentNotifications.length;
      if (hiddenCount > 0) {
        toast(`${hiddenCount} autres notifications`, {
          description: "Consultez le centre de notifications pour voir toutes les notifications",
          duration: 3000,
        });
      }
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