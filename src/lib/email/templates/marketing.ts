import { generateBaseEmailHtml, generateBaseEmailText } from './base';
import { formatPercentage } from '../helpers';

export interface MarketingAlertParams {
  userName: string;
  severity: 'RED' | 'GREEN' | 'YELLOW';
  totalTasks: number;
  successTasks: number;
  failedTasks: number;
  successRate: number;
  leadsGenerated: number;
  teamAverage?: number;
  byType?: Array<{
    type: string;
    count: number;
    successRate: number;
  }>;
}

export interface MarketingMonthlyParams {
  userName: string;
  monthName: string;
  totalTasks: number;
  successTasks: number;
  failedTasks: number;
  successRate: number;
  leadsGenerated: number;
  byType: Array<{
    type: string;
    count: number;
    successRate: number;
    leadsGenerated: number;
  }>;
  bestPerforming?: string;
  needsImprovement?: string;
  teamRank?: number;
  teamTotal?: number;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  LINKEDIN_OUTREACH: 'LinkedIn Outreach',
  COLD_EMAIL: 'Cold Email',
  SOCIAL_POST: 'Social Post',
  BLOG_POST: 'Blog Post',
  EMAIL_CAMPAIGN: 'Email Campaign',
  EVENT: 'Event',
  WEBINAR: 'Webinar',
  CONTENT_CREATION: 'Content Creation',
  OTHER: 'Other',
};

export function generateMarketingAlertEmail(params: MarketingAlertParams) {
  const { userName, severity, totalTasks, successTasks, failedTasks, successRate, leadsGenerated, teamAverage, byType } = params;

  let title: string;
  let mainContent: string;
  let actionItems: string[] = [];
  let footerNote: string | undefined;

  if (severity === 'RED') {
    title = 'URGENT: Marketing Performance Alert';
    mainContent = `
      <p style="color: #991B1B; font-weight: 600; font-size: 15px;">
        Your marketing task performance is below expectations.
      </p>

      <div style="margin: 20px 0; padding: 16px; background: #FEF2F2; border-radius: 6px; border: 1px solid #FECACA;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Total Tasks:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${totalTasks}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Successful:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #065F46;">${successTasks}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Failed:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #991B1B; font-weight: 600;">${failedTasks}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Success Rate:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #991B1B; font-weight: 600;">${formatPercentage(successRate)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Leads Generated:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #0891b2;">${leadsGenerated}</td>
          </tr>
          ${teamAverage ? `
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Team Avg Success:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${formatPercentage(teamAverage)}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="color: #374151;">
        Your success rate is significantly below the 25% threshold. Please review your marketing approach.
      </p>
    `;
    actionItems = [
      'Review failed tasks and identify patterns',
      'Consider using proven templates for outreach',
      'Focus on higher-quality targets over volume',
      'Schedule a review with your manager',
    ];
    footerNote = 'This alert has been copied to HR for documentation.';
  } else if (severity === 'YELLOW') {
    title = 'Marketing Performance Warning';
    mainContent = `
      <p style="color: #92400E; font-weight: 600; font-size: 15px;">
        Your marketing task performance needs attention.
      </p>

      <div style="margin: 20px 0; padding: 16px; background: #FEF3C7; border-radius: 6px; border: 1px solid #FCD34D;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Total Tasks:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${totalTasks}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Success Rate:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #92400E; font-weight: 600;">${formatPercentage(successRate)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Leads Generated:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #0891b2;">${leadsGenerated}</td>
          </tr>
        </table>
      </div>

      <p style="color: #374151;">
        While not critical, there's room for improvement in your marketing performance.
      </p>
    `;
    actionItems = [
      'Review your recent task outcomes',
      'Identify which task types are working best',
      'Consider adjusting your approach',
    ];
    footerNote = 'This alert has been copied to your manager for awareness.';
  } else {
    title = 'Outstanding: Marketing Performance';
    mainContent = `
      <p style="color: #065F46; font-weight: 600; font-size: 15px;">
        Your marketing task performance has been exceptional!
      </p>

      <div style="margin: 20px 0; padding: 16px; background: #D1FAE5; border-radius: 6px; border: 1px solid #A7F3D0;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Total Tasks:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #374151;">${totalTasks}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Successful:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #065F46; font-weight: 600;">${successTasks}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Success Rate:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #065F46; font-weight: 600;">${formatPercentage(successRate)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;"><strong>Leads Generated:</strong></td>
            <td style="padding: 6px 0; text-align: right; color: #0891b2; font-weight: 600;">${leadsGenerated}</td>
          </tr>
        </table>
      </div>

      <p style="color: #374151;">
        Keep up the great work! Your marketing efforts are driving real results.
      </p>
    `;
    footerNote = 'This recognition has been copied to HR for your personnel file.';
  }

  return {
    subject: severity === 'RED'
      ? `Performance Alert: Marketing Below Threshold - ${userName}`
      : severity === 'YELLOW'
      ? `Performance Warning: Marketing Needs Attention - ${userName}`
      : `Recognition: Outstanding Marketing Performance - ${userName}`,
    html: generateBaseEmailHtml({ userName, severity, title, mainContent, actionItems, footerNote }),
    text: generateBaseEmailText({ userName, severity, title, mainContent: mainContent.replace(/<[^>]*>/g, ''), actionItems, footerNote }),
  };
}

export function generateMarketingMonthlyEmail(params: MarketingMonthlyParams) {
  const { userName, monthName, totalTasks, successTasks, failedTasks, successRate, leadsGenerated, byType, bestPerforming, needsImprovement, teamRank, teamTotal } = params;

  const severity: 'RED' | 'YELLOW' | 'GREEN' = successRate < 15 ? 'RED' : successRate >= 40 ? 'GREEN' : 'YELLOW';

  const title = `Marketing Performance Review: ${monthName}`;

  const typeRows = byType
    .filter(t => t.count > 0)
    .map(t => `
      <tr>
        <td style="padding: 6px 0; color: #374151;">${TASK_TYPE_LABELS[t.type] || t.type}</td>
        <td style="padding: 6px 0; text-align: center; color: #374151;">${t.count}</td>
        <td style="padding: 6px 0; text-align: center; color: ${t.successRate >= 25 ? '#065F46' : '#991B1B'};">${formatPercentage(t.successRate)}</td>
        <td style="padding: 6px 0; text-align: right; color: #0891b2;">${t.leadsGenerated}</td>
      </tr>
    `)
    .join('');

  const mainContent = `
    <p style="color: #374151; font-size: 15px;">
      Here is your marketing performance summary for <strong>${monthName}</strong>.
    </p>

    <div style="margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 14px; text-transform: uppercase;">Summary</h3>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #374151;"><strong>Total Tasks:</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #374151;">${totalTasks}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #374151;"><strong>Successful:</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #065F46;">${successTasks}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #374151;"><strong>Failed:</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #991B1B;">${failedTasks}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #374151;"><strong>Overall Success Rate:</strong></td>
          <td style="padding: 6px 0; text-align: right; color: ${successRate >= 25 ? '#065F46' : '#991B1B'}; font-weight: 600;">${formatPercentage(successRate)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #374151;"><strong>Leads Generated:</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #0891b2; font-weight: 600;">${leadsGenerated}</td>
        </tr>
        ${teamRank && teamTotal ? `
        <tr>
          <td style="padding: 6px 0; color: #374151;"><strong>Team Ranking:</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #374151;">${teamRank} of ${teamTotal}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${typeRows ? `
    <div style="margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 14px; text-transform: uppercase;">Performance by Type</h3>
      <table style="width: 100%; font-size: 13px;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <th style="text-align: left; padding: 6px 0; color: #6b7280;">Type</th>
          <th style="text-align: center; padding: 6px 0; color: #6b7280;">Tasks</th>
          <th style="text-align: center; padding: 6px 0; color: #6b7280;">Success</th>
          <th style="text-align: right; padding: 6px 0; color: #6b7280;">Leads</th>
        </tr>
        ${typeRows}
      </table>
    </div>
    ` : ''}

    ${bestPerforming || needsImprovement ? `
    <div style="margin: 20px 0;">
      ${bestPerforming ? `
      <p style="color: #065F46; margin: 0 0 8px;">
        <strong>Best Performing:</strong> ${bestPerforming}
      </p>
      ` : ''}
      ${needsImprovement ? `
      <p style="color: #991B1B; margin: 0;">
        <strong>Needs Improvement:</strong> ${needsImprovement}
      </p>
      ` : ''}
    </div>
    ` : ''}
  `;

  return {
    subject: `Monthly Marketing Review: ${monthName} - ${userName}`,
    html: generateBaseEmailHtml({ userName, severity, title, mainContent, footerNote: 'This monthly review has been archived.' }),
    text: generateBaseEmailText({ userName, severity, title, mainContent: mainContent.replace(/<[^>]*>/g, ''), footerNote: 'This monthly review has been archived.' }),
  };
}
