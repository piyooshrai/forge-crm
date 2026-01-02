import { generateBaseEmailHtml, generateBaseEmailText } from './base';

export interface TaskAlertParams {
  userName: string;
  severity: 'RED' | 'YELLOW';
  overdueTasks: Array<{ id: string; title: string; dueDate: Date; daysOverdue: number }>;
}

export function generateTaskAlertEmail(params: TaskAlertParams) {
  const { userName, severity, overdueTasks } = params;

  const isRed = severity === 'RED';
  const title = isRed
    ? 'URGENT: Multiple Overdue Tasks'
    : 'Reminder: Overdue Task';

  const mainContent = `
    <p style="color: ${isRed ? '#991B1B' : '#92400E'}; font-weight: 600; font-size: 15px;">
      You have ${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} that ${overdueTasks.length > 1 ? 'are' : 'is'} overdue.
      ${isRed ? ' This level of task neglect is unacceptable and indicates poor time management.' : ''}
    </p>

    <div style="margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: ${isRed ? '#FEF2F2' : '#FEF3C7'};">
            <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Task</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Due Date</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Days Overdue</th>
          </tr>
        </thead>
        <tbody>
          ${overdueTasks.slice(0, 10).map(task => `
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${task.title}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${task.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb; color: ${isRed ? '#991B1B' : '#92400E'}; font-weight: 600;">${task.daysOverdue} day${task.daysOverdue > 1 ? 's' : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${overdueTasks.length > 10 ? `<p style="margin-top: 8px; color: #6b7280; font-size: 13px;">...and ${overdueTasks.length - 10} more</p>` : ''}
    </div>
  `;

  const actionItems = isRed
    ? [
        'Complete these tasks today or reschedule with realistic dates',
        'Update task status in the CRM',
        'Discuss workload with your manager if overwhelmed',
      ]
    : [
        'Complete or reschedule overdue task today',
        'Review upcoming tasks to avoid future delays',
      ];

  const footerNote = isRed
    ? 'This has been copied to HR for documentation.'
    : undefined;

  return {
    subject: isRed
      ? `Performance Alert: ${userName} - ${overdueTasks.length} Tasks Overdue`
      : `Task Reminder: ${overdueTasks[0]?.title || 'Task'} Overdue`,
    html: generateBaseEmailHtml({ userName, severity, title, mainContent, actionItems, footerNote }),
    text: generateBaseEmailText({ userName, severity, title, mainContent: mainContent.replace(/<[^>]*>/g, ''), actionItems, footerNote }),
  };
}
