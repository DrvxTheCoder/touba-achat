// components/NotificationCenter.tsx
"use client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BellIcon } from "lucide-react";
import { CustomNotification, useNotifications } from "@/hooks/use-notification";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from "./ui/scroll-area";
import { useRouter } from "next/navigation"; // Change this import
import Link from "next/link";

export const NotificationCenter = () => {
    const { notifications, markAsRead, markAllAsRead } = useNotifications();
    const router = useRouter();

    const handleNotificationClick = (notification: CustomNotification) => {
        markAsRead(notification.id);
        // router.push(`/dashboard/etats/${notification.etatDeBesoinId}`);
        // router.push(`/dashboard/ordres-de-mission/${notification.ordreDeMissionId}`);
    };

    return (
        <Popover>
            <PopoverTrigger>
                <div className="relative">
                    <BellIcon className="h-[1.2rem] w-[1.2rem]" />
                    {notifications.length > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary rounded-full">
                            {notifications.length}
                        </span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="mr-5 mt-2 p-0 w-fit min-w-[25rem] max-w-[30rem]">
                <div className="w-full flex flex-row justify-between p-2 border-b">
                    <h5 className="text-sm text-muted-foreground font-semibold">Notifications</h5>
                    {notifications.length > 0 && (
                        <small className="cursor-pointer text-xs hover:underline hover:text-blue-500 underline-offset-2 p-1 rounded-lg" onClick={markAllAsRead}>
                            Marquer tout comme lu
                        </small>
                    )}

                </div>
                {notifications.length > 0 ? (
                    <ScrollArea className="h-60 max-h-72">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className="flex items-center p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 border-b"
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-secondary-foreground dark:text-gray-100 truncate">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        Aucune nouvelle notification.
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}