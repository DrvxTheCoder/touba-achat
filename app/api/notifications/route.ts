import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        recipients: {
          some: {
            userId: parseInt(session.user.id),
            isRead: false // Only fetch unread notifications
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50, // Limit to the 50 most recent notifications
      include: {
        etatDeBesoin: {
          select: {
            edbId: true // Include the edbId for linking
          }
        }
      }
    });

    // Transform the data to include edbId at the top level
    const transformedNotifications = notifications.map(notification => ({
      ...notification,
      edbId: notification.etatDeBesoin?.edbId
    }));

    return NextResponse.json(transformedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}