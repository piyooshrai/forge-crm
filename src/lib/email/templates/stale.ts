import { generateBaseEmailHtml, generateBaseEmailText } from './base';
import { DASHBOARD_URL } from '../ses-client';

export interface StaleAlertParams {
  userName: string;
  severity: 'RED' | 'YELLOW';
  staleDeals: Array<{ id: string; name: string; daysSinceUpdate: number }>;
  staleLeads: Array<{ id: string; name: string; daysSinceUpdate: number }>;
}

export function generateStaleAlertEmail(params: StaleAlertParams) {
  const { userName, severity, staleDeals, staleLeads } = params;

  const isRed = severity === 'RED';
  const title = isRed
    ? 'URGENT: Stale Items Require Immediate Action'
    : 'Reminder: Follow-Up Needed';

  const baseUrl = DASHBOARD_URL.replace('/dashboard', '');

  let mainContent = `
    <p style="color: ${isRed ? '#991B1B' : '#92400E'}; font-weight: 600; font-size: 15px;">
      ${isRed
        ? 'The following items have been idle for too long and require immediate attention. Continued neglect will result in performance review.'
        : 'Reminder to follow up on the items below. Keep momentum going.'}
    </p>
  `;

  if (staleDeals.length > 0) {
    mainContent += `
      <div style="margin: 20px 0;">
        <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 14px; text-transform: uppercase;">
          Stale Deals (${isRed ? '>14 days' : '7-13 days'} idle)
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Deal Name</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Days Idle</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${staleDeals.map(d => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${d.name}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb; color: ${isRed ? '#991B1B' : '#92400E'}; font-weight: 600;">${d.daysSinceUpdate}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">
                  <a href="${baseUrl}/deals/${d.id}" style="color: #0891b2; text-decoration: none;">View</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (staleLeads.length > 0) {
    mainContent += `
      <div style="margin: 20px 0;">
        <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 14px; text-transform: uppercase;">
          Stale Leads (${isRed ? '>7 days' : '3-6 days'} idle)
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Lead Name</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Days Idle</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${staleLeads.map(l => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${l.name}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb; color: ${isRed ? '#991B1B' : '#92400E'}; font-weight: 600;">${l.daysSinceUpdate}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">
                  <a href="${baseUrl}/leads/${l.id}" style="color: #0891b2; text-decoration: none;">View</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  const actionItems = isRed
    ? [
        'Update each item with current status or next steps',
        'Move forward or close as lost',
        'Schedule follow-up activities for active opportunities',
      ]
    : [
        'Schedule discovery call or follow-up',
        'Log next contact attempt',
      ];

  const footerNote = isRed
    ? 'This alert has been copied to HR. Continued neglect will result in performance review.'
    : undefined;

  return {
    subject: isRed
      ? `URGENT: ${userName} - ${staleDeals.length + staleLeads.length} Stale Items Need Attention`
      : `Reminder: ${userName} - Follow-Up Needed`,
    html: generateBaseEmailHtml({ userName, severity, title, mainContent, actionItems, footerNote }),
    text: generateBaseEmailText({ userName, severity, title, mainContent: mainContent.replace(/<[^>]*>/g, ''), actionItems, footerNote }),
  };
}
