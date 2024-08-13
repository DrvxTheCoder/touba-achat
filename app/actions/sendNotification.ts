'use server'

import { NextResponse } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'
import nodemailer from 'nodemailer'

// Create a transporter using Gmail SMTP
// Note: For production, use environment variables for these credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'flanpaul19@gmail.com', // Your Gmail address
    pass: 'vcqsutmiwgamvfhi' // Your Gmail app password
  }
})

// Function to send email
const sendEmail = async (to: string, subject: string, body: string) => {
  console.log('Attempting to send email to:', to);
  try {
    const info = await transporter.sendMail({
      from: '"TOUBA OIL" <your-email@gmail.com>',
      to: to,
      subject: subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
    })
    console.log('Message sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error }
  }
}

export type NotificationPayload = {
  type: NotificationType;
  message: string;
  entityId: string | number;
  entityType: 'EDB' | 'ODM';
  recipients: number[];  // Array of user IDs
  additionalData?: Record<string, any>;
}

export async function sendNotification(payload: NotificationPayload) {
  try {
    const { type, message, entityId, entityType, recipients, additionalData } = payload;

    const notification = await prisma.notification.create({
      data: {
        message,
        type,
        etatDeBesoinId: Number(entityId),
        ...(entityType === 'EDB' ? { etatDeBesoinId: Number(entityId) } : {}),
        ...(entityType === 'ODM' ? { ordreDeMissionId: Number(entityId) } : {}),
        recipients: {
          create: recipients.map(userId => ({
            userId,
            isRead: false,
            emailSent: false
          }))
        }
      },
      include: {
        recipients: {
          include: {
            user: true
          }
        }
      }
    })

    // Emit socket event
    const io: SocketIOServer = (global as any).io
    if (io) {
      recipients.forEach(userId => {
        io.to(userId.toString()).emit('notification', {
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
    for (const recipient of notification.recipients) {
      console.log('Processing recipient:', recipient.user.email);
      
      const emailSubject = `Nouvelle notification - ${type}`
      const emailBody = `
        Bonjour ${recipient.user.name},
    
        Vous avez reçu une nouvelle notification :
    
        ${message}
    
        Veuillez vous connecter à l'application pour plus de détails.
    
        Cordialement,
        L'équipe TOUBA OIL
      `
    
      // Send to the test email address
      if (recipient.user.email === 'w-iyfbd8@developermail.com') {
        console.log('Sending email to test address:', recipient.user.email);
        const emailResult = await sendEmail(recipient.user.email, emailSubject, emailBody)
    
        if (emailResult.success) {
          console.log('Email sent successfully, updating database');
          // Update emailSent status
          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              recipients: {
                update: {
                  where: { id: recipient.id },
                  data: { emailSent: true }
                }
              }
            }
          })
        } else {
          console.error('Failed to send email:', emailResult.error);
        }
      } else {
        console.log('Skipping email for non-test address:', recipient.user.email);
      }
    }

    return { success: true, notification }
  } catch (error) {
    console.error('Failed to send notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}