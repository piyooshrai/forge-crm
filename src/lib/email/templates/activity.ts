import { generateBaseEmailHtml, generateBaseEmailText } from './base';
import { formatPercentage } from '../helpers';

export interface ActivityAlertParams {
  userName: string;
  severity: 'RED' | 'GREEN';
  expectedActivities: number;
  actualActivities: number;
  activityBreakdown?: {
    calls: number;
    emails: number;
    meetings: number;
    notes: number;
  };
  teamAverage?: number;
}

export function generateActivityAlertEmail(params: ActivityAlertParams) {
  const { userName, severity, expectedActivities, actualActivities, activityBreakdown, teamAverage } = params;

  const percentage = (actualActivities / expectedActivities) * 100;

  let title: string;
  let mainContent: string;
  let actionItems: string[] = [];
  let footerNote: string | undefined;

  if (severity === 'RED') {
    title = 'URGENT: Low Activity Alert';
    mainContent = `
      <p style="color: #991B1B; font-weight: 600; font-size: 15px;">
        Your activity level last week was significantly below expectations.
      </p>

      <div style="margin: 20px 0; padding: 16px; background: #FEF2F2; border-radius: 6px; border: 1px solid #FECACA;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Your Activity:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #991B1B; font-weight: 600;">
              ${actualActivities}
              ${activityBreakdown ? `<span style="font-weight: normal; color: #6b7280;">(calls: ${activityBreakdown.calls}, emails: ${activityBreakdown.emails}, meetings: ${activityBreakdown.meetings}, notes: ${activityBreakdown.notes})</span>` : ''}
            </td>
          </tr>
          ${teamAverage ? `
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Team Average:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${teamAverage}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Expected Minimum:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${expectedActivities}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Achievement:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #991B1B; font-weight: 600;">${formatPercentage(percentage)} of expected</td>
          </tr>
        </table>
      </div>

      <p style="color: #374151;">
        This indicates insufficient client engagement. Immediate improvement required.
      </p>
    `;
    actionItems = [
      'Schedule more calls and meetings this week',
      'Log all client interactions in the CRM',
      'Review your weekly schedule and block time for outreach',
    ];
    footerNote = 'This alert has been copied to HR for documentation.';
  } else {
    title = 'Outstanding: High Activity Performance';
    mainContent = `
      <p style="color: #065F46; font-weight: 600; font-size: 15px;">
        Your activity level last week was exceptional!
      </p>

      <div style="margin: 20px 0; padding: 16px; background: #D1FAE5; border-radius: 6px; border: 1px solid #A7F3D0;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Your Activity:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #065F46; font-weight: 600;">
              ${actualActivities}
              ${activityBreakdown ? `<span style="font-weight: normal; color: #6b7280;">(calls: ${activityBreakdown.calls}, emails: ${activityBreakdown.emails}, meetings: ${activityBreakdown.meetings}, notes: ${activityBreakdown.notes})</span>` : ''}
            </td>
          </tr>
          ${teamAverage ? `
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Team Average:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${teamAverage}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Expected Minimum:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${expectedActivities}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Achievement:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #065F46; font-weight: 600;">${formatPercentage(percentage)} of expected</td>
          </tr>
        </table>
      </div>

      <p style="color: #374151;">
        Your dedication to engaging with prospects and clients is commendable. Keep up the great work!
      </p>
    `;
    footerNote = 'This recognition has been copied to HR for your personnel file.';
  }

  return {
    subject: severity === 'RED'
      ? `Performance Alert: Low Activity - ${userName}`
      : `Recognition: Outstanding Activity - ${userName}`,
    html: generateBaseEmailHtml({ userName, severity, title, mainContent, actionItems, footerNote }),
    text: generateBaseEmailText({ userName, severity, title, mainContent: mainContent.replace(/<[^>]*>/g, ''), actionItems, footerNote }),
  };
}
