// 'use client'

// import { useEffect } from 'react'
// import socket from '@/lib/socket'
// import useNotificationStore from '@/store/notificationStore'

// const NotificationListener = () => {
//   const addNotification = useNotificationStore((state) => state.addNotification)

//   useEffect(() => {
//     const handleNotification = (notification: any) => {
//       addNotification({
//         id: notification.id,
//         message: notification.message,
//         type: notification.type,
//         edbId: notification.edbId,
//         createdAt: notification.createdAt,
//       })
//     }

//     socket.on('notification', handleNotification)

//     return () => {
//       socket.off('notification', handleNotification)
//     }
//   }, [addNotification])

//   return null
// }

// export default NotificationListener