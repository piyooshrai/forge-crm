import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { prisma } from '@/lib/prisma';
import { AlertType, AlertSeverity } from '@prisma/client';

// SES client singleton
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Recipient configuration
export const RECIPIENTS = {
  HR: 'hr@the-algo.com',
  SAM: 'sam@the-algo.com',
  CEO: 'ceo@the-algo.com',
} as const;

export const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://forge.the-algo.com/dashboard';
export const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@the-algo.com';

export interface SendAlertEmailParams {
  userId: string;
  userEmail: string;
  alertType: AlertType;
  severity: AlertSeverity;
  subject: string;
  htmlBody: string;
  textBody: string;
  ccRecipients?: string[];
  quotaTarget?: number;
  quotaActual?: number;
  period?: string;
}

export async function sendAlertEmail(params: SendAlertEmailParams): Promise<string | null> {
  const {
    userId,
    userEmail,
    alertType,
    severity,
    subject,
    htmlBody,
    textBody,
    ccRecipients = [],
    quotaTarget,
    quotaActual,
    period,
  } = params;

  const emailParams: SendEmailCommandInput = {
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [userEmail],
      CcAddresses: ccRecipients.length > 0 ? ccRecipients : undefined,
    },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: htmlBody, Charset: 'UTF-8' },
        Text: { Data: textBody, Charset: 'UTF-8' },
      },
    },
  };

  try {
    const command = new SendEmailCommand(emailParams);
    const response = await sesClient.send(command);

    // Log email permanently - NEVER delete these records
    await prisma.emailLog.create({
      data: {
        alertType,
        severity,
        userId,
        recipientTo: userEmail,
        recipientsCc: ccRecipients,
        subject,
        body: htmlBody,
        sesMessageId: response.MessageId,
        quotaTarget,
        quotaActual,
        period,
      },
    });

    return response.MessageId || null;
  } catch (error) {
    console.error('Failed to send email:', error);

    // Still log the attempt even if it failed
    await prisma.emailLog.create({
      data: {
        alertType,
        severity,
        userId,
        recipientTo: userEmail,
        recipientsCc: ccRecipients,
        subject,
        body: htmlBody,
        sesMessageId: null, // Indicates failure
        quotaTarget,
        quotaActual,
        period,
      },
    });

    throw error;
  }
}
