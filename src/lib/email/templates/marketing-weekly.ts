import { DASHBOARD_URL } from '../ses-client';

export interface TaskTypeStats {
  type: string;
  displayName: string;
  tasksCompleted: number;
  successRate: number;
  leadsGenerated: number;
}

export interface TemplateStats {
  templateName: string;
  successRate: number;
  leadsGenerated: number;
}

export interface MarketingWeeklyParams {
  userName: string;
  severity: 'RED' | 'YELLOW' | 'GREEN';
  tasksCompleted: number;
  successRate: number;
  leadsGenerated: number;
  tasksByType: TaskTypeStats[];
  topPerformers: TemplateStats[];
  bottomPerformers: TemplateStats[];
  tasksWithNoOutcome: number;
  issues: string[];
}

const severityColors = {
  RED: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', headerBg: '#DC2626' },
  YELLOW: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', headerBg: '#D97706' },
  GREEN: { bg: '#D1FAE5', border: '#10B981', text: '#065F46', headerBg: '#059669' },
};

export function generateMarketingWeeklyEmail(params: MarketingWeeklyParams) {
  const colors = severityColors[params.severity];

  const subjectPrefix = {
    RED: 'Marketing Performance: Below Expectations',
    YELLOW: 'Marketing Performance: On Track',
    GREEN: 'Marketing Performance: Excellent',
  };

  const subject = `${subjectPrefix[params.severity]} - ${params.userName}`;

  // Generate type breakdown rows
  const typeBreakdownRows = params.tasksByType
    .filter(t => t.tasksCompleted > 0)
    .map(t => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${t.displayName}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${t.tasksCompleted}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: ${t.successRate >= 70 ? '#059669' : t.successRate >= 30 ? '#D97706' : '#DC2626'}; font-weight: 600;">${Math.round(t.successRate)}%</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${t.leadsGenerated}</td>
      </tr>
    `).join('');

  // Generate top performers section
  const topPerformersHtml = params.topPerformers.length > 0 ? `
    <div style="margin: 20px 0; padding: 16px; background: #D1FAE5; border-radius: 6px; border: 1px solid #A7F3D0;">
      <h3 style="margin: 0 0 12px; color: #065F46; font-size: 14px;">TOP PERFORMERS:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        ${params.topPerformers.map(t => `<li style="margin-bottom: 4px;"><strong>${t.templateName}</strong>: ${Math.round(t.successRate)}% success, ${t.leadsGenerated} leads</li>`).join('')}
      </ul>
    </div>
  ` : '';

  // Generate bottom performers section
  const bottomPerformersHtml = params.bottomPerformers.length > 0 ? `
    <div style="margin: 20px 0; padding: 16px; background: #FEE2E2; border-radius: 6px; border: 1px solid #FECACA;">
      <h3 style="margin: 0 0 12px; color: #991B1B; font-size: 14px;">BOTTOM PERFORMERS:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        ${params.bottomPerformers.map(t => `<li style="margin-bottom: 4px;"><strong>${t.templateName}</strong>: ${Math.round(t.successRate)}% success - <span style="color: #DC2626;">RECOMMEND STOPPING</span></li>`).join('')}
      </ul>
    </div>
  ` : '';

  // Generate issues section (only for RED)
  const issuesHtml = params.severity === 'RED' && params.issues.length > 0 ? `
    <div style="margin: 20px 0; padding: 16px; background: #FEF2F2; border-radius: 6px; border: 2px solid #EF4444;">
      <h3 style="margin: 0 0 12px; color: #991B1B; font-size: 14px;">ISSUES IDENTIFIED:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #991B1B;">
        ${params.issues.map(issue => `<li style="margin-bottom: 4px;">${issue}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Marketing Performance</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 650px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: ${colors.headerBg}; padding: 20px;">
      <h1 style="margin: 0; color: white; font-size: 20px;">Weekly Marketing Performance</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Last 7 Days Summary</p>
    </div>

    <!-- Content -->
    <div style="padding: 24px;">
      <p style="margin: 0 0 20px; color: #374151; font-size: 15px;">${params.userName},</p>

      <p style="margin: 0 0 20px; color: #374151;">Your weekly marketing performance (Last 7 Days):</p>

      <!-- Task Performance Summary -->
      <div style="margin: 20px 0; padding: 16px; background: ${colors.bg}; border-radius: 6px; border: 1px solid ${colors.border};">
        <h3 style="margin: 0 0 12px; color: ${colors.text}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Task Performance</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #374151;">Tasks Completed:</td>
            <td style="padding: 6px 0; text-align: right; color: #1f2937; font-weight: 600;">${params.tasksCompleted}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;">Success Rate:</td>
            <td style="padding: 6px 0; text-align: right; color: ${params.successRate >= 70 ? '#059669' : params.successRate >= 30 ? '#D97706' : '#DC2626'}; font-weight: 600;">${Math.round(params.successRate)}% <span style="font-weight: normal; color: #6b7280;">(target: 30%+)</span></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #374151;">Leads Generated:</td>
            <td style="padding: 6px 0; text-align: right; color: ${params.leadsGenerated >= 5 ? '#059669' : params.leadsGenerated >= 3 ? '#D97706' : '#DC2626'}; font-weight: 600;">${params.leadsGenerated} <span style="font-weight: normal; color: #6b7280;">(target: 5/week)</span></td>
          </tr>
          ${params.tasksWithNoOutcome > 0 ? `
          <tr>
            <td style="padding: 6px 0; color: #374151;">Tasks Pending Outcome:</td>
            <td style="padding: 6px 0; text-align: right; color: #DC2626; font-weight: 600;">${params.tasksWithNoOutcome}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- By Type Breakdown -->
      ${params.tasksByType.filter(t => t.tasksCompleted > 0).length > 0 ? `
      <div style="margin: 24px 0;">
        <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">By Type</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse; background: #f9fafb; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background: #e5e7eb;">
              <th style="padding: 10px 12px; text-align: left; color: #374151; font-weight: 600;">Type</th>
              <th style="padding: 10px 12px; text-align: center; color: #374151; font-weight: 600;">Tasks</th>
              <th style="padding: 10px 12px; text-align: center; color: #374151; font-weight: 600;">Success</th>
              <th style="padding: 10px 12px; text-align: center; color: #374151; font-weight: 600;">Leads</th>
            </tr>
          </thead>
          <tbody>
            ${typeBreakdownRows}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${topPerformersHtml}
      ${bottomPerformersHtml}
      ${issuesHtml}

      <a href="${DASHBOARD_URL}/marketing" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #0891b2; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Dashboard
      </a>

      ${params.severity === 'RED' ? `
      <p style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #991B1B; font-size: 13px; font-weight: 500;">
        This performance alert has been copied to HR for record-keeping.
      </p>
      ` : params.severity === 'GREEN' ? `
      <p style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #065F46; font-size: 13px; font-weight: 500;">
        This excellent performance has been noted and copied to HR.
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

  // Generate text version
  const text = generateMarketingWeeklyText(params);

  return { subject, html, text };
}

function generateMarketingWeeklyText(params: MarketingWeeklyParams): string {
  let text = `Weekly Marketing Performance - Last 7 Days\n\n`;
  text += `${params.userName},\n\n`;
  text += `Your weekly marketing performance (Last 7 Days):\n\n`;

  text += `TASK PERFORMANCE:\n`;
  text += `${'─'.repeat(40)}\n`;
  text += `Tasks Completed: ${params.tasksCompleted}\n`;
  text += `Success Rate: ${Math.round(params.successRate)}% (target: 30%+)\n`;
  text += `Leads Generated: ${params.leadsGenerated} (target: 5/week)\n`;
  if (params.tasksWithNoOutcome > 0) {
    text += `Tasks Pending Outcome: ${params.tasksWithNoOutcome}\n`;
  }
  text += `\n`;

  const activeTypes = params.tasksByType.filter(t => t.tasksCompleted > 0);
  if (activeTypes.length > 0) {
    text += `BY TYPE:\n`;
    text += `${'─'.repeat(40)}\n`;
    activeTypes.forEach(t => {
      text += `${t.displayName}: ${t.tasksCompleted} tasks, ${Math.round(t.successRate)}% success, ${t.leadsGenerated} leads\n`;
    });
    text += `\n`;
  }

  if (params.topPerformers.length > 0) {
    text += `TOP PERFORMERS:\n`;
    params.topPerformers.forEach(t => {
      text += `- ${t.templateName}: ${Math.round(t.successRate)}% success, ${t.leadsGenerated} leads\n`;
    });
    text += `\n`;
  }

  if (params.bottomPerformers.length > 0) {
    text += `BOTTOM PERFORMERS:\n`;
    params.bottomPerformers.forEach(t => {
      text += `- ${t.templateName}: ${Math.round(t.successRate)}% success - RECOMMEND STOPPING\n`;
    });
    text += `\n`;
  }

  if (params.severity === 'RED' && params.issues.length > 0) {
    text += `ISSUES IDENTIFIED:\n`;
    params.issues.forEach(issue => {
      text += `- ${issue}\n`;
    });
    text += `\n`;
  }

  text += `View your dashboard: ${DASHBOARD_URL}/marketing\n\n`;

  if (params.severity === 'RED') {
    text += `This performance alert has been copied to HR for record-keeping.\n\n`;
  } else if (params.severity === 'GREEN') {
    text += `This excellent performance has been noted and copied to HR.\n\n`;
  }

  text += `---\nThis is an automated notification from The Algorithm's Forge CRM.`;

  return text;
}
