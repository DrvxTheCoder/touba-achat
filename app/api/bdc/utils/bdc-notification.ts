import { prisma } from '@/lib/prisma';
import { bdcNotificationRules } from '../config/notification-config/bdc-rules';
import { keyPersonnel } from '../config/notification-config/personnel';
import { BDCStatus, Department } from '@prisma/client';

export async function getBDCNotificationRecipients(
  status: BDCStatus,
  departmentName: string,
  creatorEmail: string
): Promise<string[]> {
  const recipients = new Set<string>();
  const department = departmentName.includes('Direction') ? 
    departmentName.split(' ')[1].toUpperCase() : 
    departmentName;

  // Get department-specific rules
  const statusRules = bdcNotificationRules[status];
  const departmentRules = statusRules[department];
  const allRules = statusRules['ALL'];

  // Check if creator is in skipForUsers
  const isExemptCreator = departmentRules?.skipForUsers?.includes(creatorEmail) ||
    allRules?.skipForUsers?.includes(creatorEmail);

  if (!isExemptCreator) {
    // Add department-specific recipients
    if (departmentRules) {
      departmentRules.recipients.forEach(r => recipients.add(r));
    }

    // Add general recipients for this status
    if (allRules) {
      allRules.recipients.forEach(r => recipients.add(r));
    }
  }

  return Array.from(recipients);
}