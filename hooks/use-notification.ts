// hooks/useNotifications.ts
import { useState, useEffect } from 'react';
import { Notification } from '@prisma/client'; // Make sure this import is correct
import { useSession } from 'next-auth/react';
import { NotificationType } from '@prisma/client';

export type CustomNotification = {
  id: number;
  message: string;
  type: NotificationType;
  createdAt: string;
  etatDeBesoinId: string | null;
  ordreDeMissionId: number | null;
  // Add any other fields that your API returns
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<CustomNotification[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
    }
  }, [session]);

  const fetchNotifications = async () => {
    const response = await fetch('/api/notifications');
    const data: CustomNotification[] = await response.json();
    setNotifications(data);
  };

  const markAsRead = async (id: number) => {
    await fetch(`/api/notifications/${id}`, { method: 'PUT' });
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAllAsRead = async () => {
    await fetch('/api/notifications/mark-all-read', { method: 'PUT' });
    setNotifications([]);
  };

  return { notifications, markAsRead, markAllAsRead };
}