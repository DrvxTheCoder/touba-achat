'use server'

import { NextResponse } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from '@/lib/prisma'
import { NotificationType, EDBStatus, ODMStatus } from '@prisma/client'
import nodemailer from 'nodemailer'
import { render } from '@react-email/render'
import ToubaOilNotificationEmail from '@/components/templates/EmailTemplate'
import { createNotification } from '../api/utils/notificationsUtil'


type EntityType = 'EDB' | 'ODM';

const baseUrl = process.env.APP_URL
? `http://localhost:3000`
: "";

// Create a transporter using the cPanel SMTP settings
const transporter = nodemailer.createTransport({
  host: 'mail.connectinterim.com',
  port: 465,
  secure: true, // Use SSL/TLS
  auth: {
    user: 'test@connectinterim.com',
    pass: process.env.CPANEL_EMAIL_PASSWORD // Store this in your environment variables
  }
})

// Function to send email
const sendEmail = async (to: string, subject: string, html: string) => {
  console.log('Attempting to send email to:', to);
  try {
    const info = await transporter.sendMail({
      from: '"Touba App™" <test@connectinterim.com>',
      to: to,
      subject: subject,
      html: html,
    })
    console.log('Message sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error }
  }
}

export type NotificationPayload = {
  entityId: string;
  entityType: EntityType;
  newStatus: EDBStatus | ODMStatus;
  actorId: number;
  actionInitiator: string;
  additionalData?: Record<string, any>;
}



function getPageNameFromEntityType(entityType: EntityType): string {
  switch (entityType) {
    case 'EDB':
      return 'etats';
    case 'ODM':
      return 'odm';
    default:
      // This ensures type safety by exhaustively checking all possible values of EntityType
      const _exhaustiveCheck: never = entityType;
      throw new Error(`Unhandled entity type: ${entityType}`);
  }
}

export async function sendNotification(payload: NotificationPayload) {
  try {
    const { entityId, entityType, newStatus, actorId, actionInitiator, additionalData } = payload;

    const { notification, subject, body } = await createNotification(
      entityId,
      entityType,
      newStatus,
      actorId,
      actionInitiator
    );

    // Emit socket event
    const io: SocketIOServer = (global as any).io
    if (io) {
      notification.recipients.forEach(recipient => {
        io.to(recipient.userId.toString()).emit('notification', {
          id: notification.id,
          message: notification.message,
          type: notification.type,
          entityId,
          entityType,
          createdAt: notification.createdAt,
          ...additionalData
        })
      })
    }

    // Send email notifications
    // for (const recipient of notification.recipients) {
    //   try {
    //     const emailHtml = await render(
    //       ToubaOilNotificationEmail({
    //         recipientName: recipient.user.name,
    //         recipientEmail: recipient.user.email,
    //         actionType: newStatus,
    //         actionInitiator: actionInitiator,
    //         entityType: entityType,
    //         entityId: entityId,
    //         actionLink: `https://touba-achat.vercel.app/dashboard/etats/${entityId}`,
    //         notificationDetails: body
    //       })
    //     )

    //     const emailResult = await sendEmail(recipient.user.email, subject, emailHtml)

    //     if (emailResult.success) {
    //       console.log(`Email sent successfully to ${recipient.user.email}`);
    //       await prisma.notificationRecipient.update({
    //         where: { id: recipient.id },
    //         data: { emailSent: true }
    //       })
    //     } else {
    //       console.error(`Failed to send email to ${recipient.user.email}:`, emailResult.error);
    //     }
    //   } catch (emailError) {
    //     console.error(`Error processing email for ${recipient.user.email}:`, emailError);
    //   }
    // }

    // Send email notification to test email
      const testRecipientEmail = 'flanpaul19@gmail.com'; // Your test email address

      try {
        const emailHtml = await render(
          ToubaOilNotificationEmail({
            recipientName: "Recipient",
            recipientEmail: testRecipientEmail,
            actionType: newStatus,
            actionInitiator: actionInitiator,
            entityType: entityType,
            entityId: entityId,
            actionLink: `${baseUrl}/dashboard/${getPageNameFromEntityType(entityType)}/${entityId}`,
            notificationDetails: body
          })
        )
  
        const emailResult = await sendEmail(testRecipientEmail, subject, emailHtml)
  
        if (emailResult.success) {
          console.log(`Test email sent successfully to ${testRecipientEmail}`);
          // Note: We're not updating the database here since we're using a test email
        } else {
          console.error(`Failed to send test email to ${testRecipientEmail}:`, emailResult.error);
        }
      } catch (emailError) {
        console.error(`Error processing test email for ${testRecipientEmail}:`, emailError);
      }

    // End Test recipient

    return { success: true, notification }
  } catch (error) {
    console.error('Failed to send notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}