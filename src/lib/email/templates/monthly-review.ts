import { generateBaseEmailHtml, generateBaseEmailText } from './base';
import { formatCurrency, formatPercentage } from '../helpers';

export interface MonthlyReviewParams {
  userName: string;
  severity: 'RED' | 'YELLOW' | 'GREEN';
  month: string;
  quotaTarget: number;
  quotaActual: number;
  totalDealsWon: number;
  totalDealsClosed: number;
  totalActivities: number;
  winRate: number;
  averageDealSize: number;
  rank?: number;
  teamSize?: number;
  staleDealCount?: number;
  taskCompletionRate?: number;
}

export function generateMonthlyReviewEmail(params: MonthlyReviewParams) {
  const {
    userName,
    severity,
    month,
    quotaTarget,
    quotaActual,
    totalDealsWon,
    totalDealsClosed,
    totalActivities,
    winRate,
    averageDealSize,
    rank,
    teamSize,
    staleDealCount,
    taskCompletionRate,
  } = params;

  const percentage = (quotaActual / quotaTarget) * 100;

  let title: string;
  let introText: string;
  let footerNote: string;

  if (severity === 'RED') {
    title = `${month} Performance: Below Expectations`;
    introText = `Your ${month} performance requires immediate attention.`;
    footerNote = 'This performance review has been shared with HR and the CEO. Your continued employment is contingent on immediate and sustained improvement.';
  } else if (severity === 'GREEN') {
    title = `${month} Performance: Excellent`;
    introText = `Outstanding ${month} performance! Congratulations on exceeding your quota.`;
    footerNote = 'This recognition has been copied to HR for your personnel file. Keep up the excellent work!';
  } else {
    title = `${month} Performance: On Target`;
    introText = `You met your quota this ${month}. Solid performance.`;
    footerNote = 'Keep pushing to exceed expectations next month.';
  }

  const severityBg = severity === 'RED' ? '#FEF2F2' : severity === 'GREEN' ? '#D1FAE5' : '#FEF3C7';
  const severityBorder = severity === 'RED' ? '#FECACA' : severity === 'GREEN' ? '#A7F3D0' : '#FDE68A';
  const severityText = severity === 'RED' ? '#991B1B' : severity === 'GREEN' ? '#065F46' : '#92400E';

  const mainContent = `
    <p style="color: ${severityText}; font-weight: 600; font-size: 15px;">${introText}</p>

    <div style="margin: 24px 0; padding: 20px; background: ${severityBg}; border-radius: 8px; border: 1px solid ${severityBorder};">
      <h3 style="margin: 0 0 4px; color: #1f2937; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Quota Attainment</h3>
      <p style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: ${severityText};">
        ${formatPercentage(percentage)}
        <span style="font-size: 16px; font-weight: normal; color: #6b7280;">(${formatCurrency(quotaActual)} / ${formatCurrency(quotaTarget)})</span>
      </p>
      ${rank && teamSize ? `<p style="margin: 0; font-size: 13px; color: #6b7280;">Rank: ${rank} of ${teamSize} (Sales Team)</p>` : ''}
    </div>

    <div style="margin: 24px 0;">
      <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 14px; text-transform: uppercase;">Performance Metrics</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tbody>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #374151;">Deals Closed</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600;">${totalDealsWon} won / ${totalDealsClosed} total</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #374151;">Win Rate</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: ${winRate >= 40 ? '#065F46' : winRate >= 25 ? '#92400E' : '#991B1B'};">${formatPercentage(winRate)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #374151;">Average Deal Size</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600;">${formatCurrency(averageDealSize)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #374151;">Total Activities</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600;">${totalActivities}</td>
          </tr>
          ${staleDealCount !== undefined ? `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #374151;">Stale Deals</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: ${staleDealCount === 0 ? '#065F46' : staleDealCount <= 2 ? '#92400E' : '#991B1B'};">${staleDealCount}${staleDealCount === 0 ? ' (perfect)' : staleDealCount > 3 ? ' (unacceptable)' : ''}</td>
          </tr>
          ` : ''}
          ${taskCompletionRate !== undefined ? `
          <tr>
            <td style="padding: 12px 0; color: #374151;">Task Completion</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: ${taskCompletionRate >= 90 ? '#065F46' : taskCompletionRate >= 70 ? '#92400E' : '#991B1B'};">${formatPercentage(taskCompletionRate)}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    </div>
  `;

  const actionItems = severity === 'RED'
    ? [
        'Performance improvement plan meeting with manager (this week)',
        'Increase activity to 20/week minimum',
        'Clean stale deals within 3 days',
        'Improve qualification process',
      ]
    : severity === 'GREEN'
    ? [
        'Share your best practices with the team',
        'Set ambitious goals for next month',
      ]
    : [
        'Review pipeline for opportunities to exceed quota',
        'Continue consistent activity levels',
      ];

  return {
    subject: severity === 'RED'
      ? `${month} Performance: Below Expectations - ${userName}`
      : severity === 'GREEN'
      ? `${month} Performance: Excellent - ${userName}`
      : `${month} Performance: On Target - ${userName}`,
    html: generateBaseEmailHtml({ userName, severity, title, mainContent, actionItems, footerNote }),
    text: generateBaseEmailText({ userName, severity, title, mainContent: mainContent.replace(/<[^>]*>/g, ''), actionItems, footerNote }),
  };
}
