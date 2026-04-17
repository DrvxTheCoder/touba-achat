'use server'

import { prisma } from '@/lib/prisma'
import { NotificationType, EDBStatus, ODMStatus, StockEDBStatus } from '@prisma/client'
import nodemailer from 'nodemailer'
import { render } from '@react-email/render'
import ToubaOilNotificationEmail from '@/components/templates/EmailTemplate'
import { createNotification } from '../api/utils/notificationsUtil'

type EntityType = 'EDB' | 'ODM' | 'STOCK';

export type NotificationPayload = {
  entityId: string;
  entityType: EntityType;
  newStatus: EDBStatus | ODMStatus | StockEDBStatus;
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
    case 'STOCK':
      return 'etats/stock';
    default:
      const _exhaustiveCheck: never = entityType;
      throw new Error(`Unhandled entity type: ${entityType}`);
  }
}

// ─── Email (toggle by commenting/uncommenting the block in sendNotification) ──

const transporter = nodemailer.createTransport({
  host: 'mail.touba-energy.com',
  port: 465,
  secure: true,
  auth: {
    user: 'app@touba-energy.com',
    pass: process.env.CPANEL_EMAIL_PASSWORD,
  },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: '"Touba App™" <app@touba-energy.com>',
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

async function sendEmailNotifications(
  notification: any,
  payload: NotificationPayload,
  body: string,
  subject: string
) {
  const baseUrl = process.env.APP_URL ? `https://touba-app.com` : '';

  for (const recipient of notification.recipients) {
    try {
      const emailHtml = await render(
        ToubaOilNotificationEmail({
          recipientName: recipient.user.name,
          recipientEmail: recipient.user.email,
          actionType: payload.newStatus,
          actionInitiator: payload.actionInitiator,
          entityType: payload.entityType,
          entityId: payload.entityId,
          actionLink: `${baseUrl}/dashboard/${getPageNameFromEntityType(payload.entityType)}/${payload.entityId}`,
          notificationDetails: body,
        })
      );

      const emailResult = await sendEmail(recipient.user.email, subject, emailHtml);

      if (emailResult.success) {
        await prisma.notificationRecipient.update({
          where: { id: recipient.id },
          data: { emailSent: true },
        });
      } else {
        console.error(`Failed to send email to ${recipient.user.email}:`, emailResult.error);
      }
    } catch (emailError) {
      console.error(`Error processing email for ${recipient.user.email}:`, emailError);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function sendNotification(payload: NotificationPayload) {
  try {
    const { entityId, entityType, newStatus, actorId, actionInitiator } = payload;

    // Always create the in-app DB notification
    const { notification, subject, body } = await createNotification(
      entityId,
      entityType,
      newStatus,
      actorId,
      actionInitiator
    );

    // ── Email notifications ──────────────────────────────────────────────────
    // To disable emails entirely, comment out the block below.
    // await sendEmailNotifications(notification, payload, body, subject);
    // ── End email notifications ──────────────────────────────────────────────

    return { success: true, notification };
  } catch (error) {
    console.error('Failed to send notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}
