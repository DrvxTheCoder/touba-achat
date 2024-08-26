'use server'

import { NextResponse } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'
import nodemailer from 'nodemailer'

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
const sendEmail = async (to: string, subject: string, body: string) => {
  console.log('Attempting to send email to:', to);
  try {
    const info = await transporter.sendMail({
      from: '"Touba App™" <test@connectinterim.com>',
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
    const testRecipientEmail = 'flanpaul19@gmail.com'; // Test recipient email

    const emailSubject = `Nouvelle notification`
    const emailBody = `
      Bonjour,
  
      Vous avez reçu une nouvelle notification :
  
      ${message}
  
      Veuillez vous connecter à l'application pour plus de détails.
  
      Cordialement,
      L'équipe TOUBA OIL
    `
  
    console.log('Sending email to test address:', testRecipientEmail);
    const emailResult = await sendEmail(testRecipientEmail, emailSubject, emailBody)

    if (emailResult.success) {
      console.log('Email sent successfully to test address');
      // Note: We're not updating the database here since we're using a test email
    } else {
      console.error('Failed to send email:', emailResult.error);
    }

    return { success: true, notification }
  } catch (error) {
    console.error('Failed to send notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}