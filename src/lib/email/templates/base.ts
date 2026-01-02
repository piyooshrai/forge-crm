import { DASHBOARD_URL } from '../ses-client';

export interface BaseTemplateParams {
  userName: string;
  severity: 'RED' | 'YELLOW' | 'GREEN';
  title: string;
  mainContent: string;
  actionItems?: string[];
  footerNote?: string;
}

const severityColors = {
  RED: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', emoji: '' },
  YELLOW: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', emoji: '' },
  GREEN: { bg: '#D1FAE5', border: '#10B981', text: '#065F46', emoji: '' },
};

export function generateBaseEmailHtml(params: BaseTemplateParams): string {
  const colors = severityColors[params.severity];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: ${colors.bg}; border-bottom: 3px solid ${colors.border}; padding: 20px;">
      <h1 style="margin: 0; color: ${colors.text}; font-size: 20px;">${colors.emoji} ${params.title}</h1>
    </div>

    <!-- Content -->
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px; color: #374151;">${params.userName},</p>

      <div style="margin: 16px 0;">
        ${params.mainContent}
      </div>

      ${params.actionItems && params.actionItems.length > 0 ? `
      <div style="margin: 24px 0; padding: 16px; background: #f9fafb; border-radius: 6px; border-left: 4px solid ${colors.border};">
        <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 14px; text-transform: uppercase;">Required Actions:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
          ${params.actionItems.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <a href="${DASHBOARD_URL}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #0891b2; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Dashboard
      </a>

      ${params.footerNote ? `
      <p style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
        ${params.footerNote}
      </p>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="padding: 16px 24px; background: #1a1f2e; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        This is an automated notification from The Algorithm's Forge CRM. Do not reply to this email.
      </p>
      <p style="margin: 8px 0 0; color: #6b7280; font-size: 11px;">
        Powered by The Algorithm
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateBaseEmailText(params: BaseTemplateParams): string {
  const emoji = severityColors[params.severity].emoji;
  let text = `${emoji} ${params.title}\n\n`;
  text += `${params.userName},\n\n`;
  text += `${params.mainContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}\n\n`;

  if (params.actionItems && params.actionItems.length > 0) {
    text += `REQUIRED ACTIONS:\n`;
    params.actionItems.forEach(item => {
      text += `- ${item}\n`;
    });
    text += '\n';
  }

  text += `View your dashboard: ${DASHBOARD_URL}\n\n`;

  if (params.footerNote) {
    text += `${params.footerNote}\n\n`;
  }

  text += `---\nThis is an automated notification from The Algorithm's Forge CRM.`;

  return text;
}
