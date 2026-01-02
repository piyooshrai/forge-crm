import { generateBaseEmailHtml, generateBaseEmailText } from './base';
import { formatCurrency, formatPercentage } from '../helpers';

export interface QuotaAlertParams {
  userName: string;
  quotaTarget: number;
  quotaActual: number;
  daysRemaining: number;
  severity: 'RED' | 'YELLOW' | 'GREEN';
}

export function generateQuotaAlertEmail(params: QuotaAlertParams) {
  const percentage = (params.quotaActual / params.quotaTarget) * 100;

  let title: string;
  let mainContent: string;
  let actionItems: string[] = [];
  let footerNote: string | undefined;

  if (params.severity === 'RED') {
    title = 'URGENT: Quota Performance Alert';
    mainContent = `
      <p style="color: #991B1B; font-weight: 600; font-size: 15px;">Your current quota attainment is ${formatPercentage(percentage)} (${formatCurrency(params.quotaActual)} / ${formatCurrency(params.quotaTarget)}) with ${params.daysRemaining} days remaining.</p>

      <div style="margin: 20px 0; padding: 16px; background: #FEF2F2; border-radius: 6px; border: 1px solid #FECACA;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Quota Target:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${formatCurrency(params.quotaTarget)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Current Progress:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #991B1B; font-weight: 600;">${formatCurrency(params.quotaActual)} (${formatPercentage(percentage)})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Days Remaining:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #991B1B; font-weight: 600;">${params.daysRemaining}</td>
          </tr>
        </table>
      </div>

      <p style="color: #374151;">This is significantly below expectations. Immediate action required.</p>
    `;
    actionItems = [
      'Review your pipeline in Forge CRM',
      'Identify deals to close this month',
      'Schedule time with your manager today',
    ];
    footerNote = 'This performance alert has been copied to HR for record-keeping.';
  } else if (params.severity === 'GREEN') {
    title = 'Outstanding Performance: Quota Exceeded';
    mainContent = `
      <p style="color: #065F46; font-weight: 600; font-size: 15px;">Congratulations! You've achieved ${formatPercentage(percentage)} of your monthly quota (${formatCurrency(params.quotaActual)} / ${formatCurrency(params.quotaTarget)}).</p>

      <div style="margin: 20px 0; padding: 16px; background: #D1FAE5; border-radius: 6px; border: 1px solid #A7F3D0;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Quota Target:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${formatCurrency(params.quotaTarget)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Current Achievement:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #065F46; font-weight: 600;">${formatCurrency(params.quotaActual)} (${formatPercentage(percentage)})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Days Remaining:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${params.daysRemaining}</td>
          </tr>
        </table>
      </div>

      <p style="color: #374151;">Your outstanding performance this month has been recognized. Keep up the excellent work!</p>
    `;
    footerNote = 'This achievement has been recognized and copied to HR for your personnel file.';
  } else {
    title = 'Monthly Progress Update: On Track';
    mainContent = `
      <p style="color: #92400E; font-weight: 600; font-size: 15px;">You're on track with ${formatPercentage(percentage)} quota attainment (${formatCurrency(params.quotaActual)} / ${formatCurrency(params.quotaTarget)}) and ${params.daysRemaining} days remaining.</p>

      <div style="margin: 20px 0; padding: 16px; background: #FEF3C7; border-radius: 6px; border: 1px solid #FDE68A;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Quota Target:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${formatCurrency(params.quotaTarget)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Current Progress:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #92400E; font-weight: 600;">${formatCurrency(params.quotaActual)} (${formatPercentage(percentage)})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Days Remaining:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${params.daysRemaining}</td>
          </tr>
        </table>
      </div>

      <p style="color: #374151;">Keep pushing to close the gap. You're doing well.</p>
    `;
    actionItems = [
      'Review open deals in negotiation',
      'Continue following up on active opportunities',
    ];
  }

  return {
    subject: `${params.severity === 'RED' ? 'Performance Alert' : params.severity === 'GREEN' ? 'Congratulations' : 'Progress Update'}: ${params.userName} - ${formatPercentage(percentage)} to Monthly Quota`,
    html: generateBaseEmailHtml({ userName: params.userName, severity: params.severity, title, mainContent, actionItems, footerNote }),
    text: generateBaseEmailText({ userName: params.userName, severity: params.severity, title, mainContent: mainContent.replace(/<[^>]*>/g, ''), actionItems, footerNote }),
  };
}
