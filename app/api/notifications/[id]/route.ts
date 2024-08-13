import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
  }

  try {
    const updatedNotification = await prisma.notificationRecipient.updateMany({
      where: {
        notificationId: id,
        userId: parseInt(session.user.id)
      },
      data: {
        isRead: true
      }
    });

    if (updatedNotification.count === 0) {
      return NextResponse.json({ error: 'Notification not found or already read' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}