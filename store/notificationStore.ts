import create from 'zustand'
import { NotificationType } from '@prisma/client'

type Notification = {
  id: number
  edbId: string;
  message: string;
  type: NotificationType;
  createdAt: string
}

type NotificationStore = {
  notifications: Notification[]
  addNotification: (notification: Notification) => void
  markAsRead: (id: number) => void
  clearAll: () => void
}

const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({ notifications: [...state.notifications, notification] })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearAll: () => set({ notifications: [] }),
}))

export default useNotificationStore