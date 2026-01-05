import { MarketingTaskType, MarketingTaskOutcome, ResponseType } from '@prisma/client';

export interface TaskMetrics {
  type: MarketingTaskType;
  // Engagement metrics
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  views?: number | null;
  opens?: number | null;
  sent?: number | null;
  replies?: number | null;
  attendees?: number | null;
  meetingsBooked?: number | null;
  // ICP engagement
  icpEngagement: boolean;
  // Lead attribution
  leadsGeneratedCount: number;
  // Response tracking
  responseType?: ResponseType | null;
  connectionAccepted?: boolean | null;
}

export interface OutcomeCheckResult {
  passed: boolean;
  label: string;
  value: string | number | boolean;
  threshold?: string;
}

export interface CalculatedOutcome {
  outcome: MarketingTaskOutcome;
  checks: OutcomeCheckResult[];
}

export function calculateOutcome(metrics: TaskMetrics): CalculatedOutcome {
  switch (metrics.type) {
    case 'SOCIAL_POST':
      return calculateSocialPostOutcome(metrics);
    case 'LINKEDIN_OUTREACH':
      return calculateLinkedInOutcome(metrics);
    case 'BLOG_POST':
      return calculateBlogOutcome(metrics);
    case 'EMAIL_CAMPAIGN':
    case 'COLD_EMAIL':
      return calculateEmailOutcome(metrics);
    case 'EVENT':
    case 'WEBINAR':
      return calculateEventOutcome(metrics);
    default:
      return calculateDefaultOutcome(metrics);
  }
}

function calculateSocialPostOutcome(metrics: TaskMetrics): CalculatedOutcome {
  const { likes = 0, comments = 0, icpEngagement, leadsGeneratedCount } = metrics;
  const likesVal = likes || 0;
  const commentsVal = comments || 0;

  const checks: OutcomeCheckResult[] = [
    {
      passed: likesVal >= 10,
      label: 'Likes >= 10',
      value: likesVal,
      threshold: '10',
    },
    {
      passed: commentsVal >= 5,
      label: 'Comments >= 5',
      value: commentsVal,
      threshold: '5',
    },
    {
      passed: icpEngagement,
      label: 'ICP Engagement',
      value: icpEngagement,
    },
    {
      passed: leadsGeneratedCount >= 1,
      label: 'Leads Generated',
      value: leadsGeneratedCount,
      threshold: '1',
    },
  ];

  let outcome: MarketingTaskOutcome;

  // SUCCESS if generated leads OR high ICP engagement
  if (leadsGeneratedCount >= 1) {
    outcome = 'SUCCESS';
  } else if (likesVal >= 10 && commentsVal >= 5 && icpEngagement) {
    outcome = 'SUCCESS';
  } else if ((likesVal >= 5 && likesVal < 10) || (commentsVal >= 2 && commentsVal < 5)) {
    outcome = 'PARTIAL';
  } else {
    outcome = 'FAILED';
  }

  return { outcome, checks };
}

function calculateLinkedInOutcome(metrics: TaskMetrics): CalculatedOutcome {
  const { responseType, connectionAccepted, leadsGeneratedCount } = metrics;

  const checks: OutcomeCheckResult[] = [
    {
      passed: responseType === 'INTERESTED',
      label: 'Interested Response',
      value: responseType || 'None',
    },
    {
      passed: connectionAccepted === true,
      label: 'Connection Accepted',
      value: connectionAccepted ?? false,
    },
    {
      passed: leadsGeneratedCount >= 1,
      label: 'Lead Generated',
      value: leadsGeneratedCount,
      threshold: '1',
    },
  ];

  let outcome: MarketingTaskOutcome;

  // SUCCESS if interested response or generated lead
  if (responseType === 'INTERESTED' || leadsGeneratedCount >= 1) {
    outcome = 'SUCCESS';
  } else if (connectionAccepted || responseType === 'NOT_INTERESTED') {
    // PARTIAL if connection accepted or polite decline
    outcome = 'PARTIAL';
  } else {
    // FAILED if no response
    outcome = 'FAILED';
  }

  return { outcome, checks };
}

function calculateBlogOutcome(metrics: TaskMetrics): CalculatedOutcome {
  const { views = 0, icpEngagement, leadsGeneratedCount } = metrics;
  const viewsVal = views || 0;

  const checks: OutcomeCheckResult[] = [
    {
      passed: viewsVal >= 100,
      label: 'Views >= 100',
      value: viewsVal,
      threshold: '100',
    },
    {
      passed: icpEngagement,
      label: 'ICP Traffic',
      value: icpEngagement,
    },
    {
      passed: leadsGeneratedCount >= 1,
      label: 'Leads Generated',
      value: leadsGeneratedCount,
      threshold: '1',
    },
  ];

  let outcome: MarketingTaskOutcome;

  // SUCCESS if generated leads or high ICP traffic
  if (leadsGeneratedCount >= 1) {
    outcome = 'SUCCESS';
  } else if (viewsVal >= 100 && icpEngagement) {
    outcome = 'SUCCESS';
  } else if (viewsVal >= 50 && viewsVal < 100) {
    // PARTIAL if moderate views
    outcome = 'PARTIAL';
  } else {
    outcome = 'FAILED';
  }

  return { outcome, checks };
}

function calculateEmailOutcome(metrics: TaskMetrics): CalculatedOutcome {
  const { opens = 0, sent = 0, replies = 0, leadsGeneratedCount } = metrics;
  const opensVal = opens || 0;
  const sentVal = sent || 1; // avoid division by zero
  const repliesVal = replies || 0;

  const openRate = sentVal > 0 ? Math.round((opensVal / sentVal) * 100) : 0;
  const replyRate = sentVal > 0 ? Math.round((repliesVal / sentVal) * 100) : 0;

  const checks: OutcomeCheckResult[] = [
    {
      passed: openRate >= 20,
      label: 'Open Rate >= 20%',
      value: `${openRate}%`,
      threshold: '20%',
    },
    {
      passed: replyRate >= 5,
      label: 'Reply Rate >= 5%',
      value: `${replyRate}%`,
      threshold: '5%',
    },
    {
      passed: leadsGeneratedCount >= 1,
      label: 'Leads Generated',
      value: leadsGeneratedCount,
      threshold: '1',
    },
  ];

  let outcome: MarketingTaskOutcome;

  // SUCCESS if good reply rate or generated leads
  if (replyRate >= 5 || leadsGeneratedCount >= 1) {
    outcome = 'SUCCESS';
  } else if (openRate >= 20) {
    // PARTIAL if good open rate but no replies
    outcome = 'PARTIAL';
  } else {
    outcome = 'FAILED';
  }

  return { outcome, checks };
}

function calculateEventOutcome(metrics: TaskMetrics): CalculatedOutcome {
  const { attendees = 0, meetingsBooked = 0, leadsGeneratedCount } = metrics;
  const attendeesVal = attendees || 0;
  const meetingsVal = meetingsBooked || 0;

  const checks: OutcomeCheckResult[] = [
    {
      passed: attendeesVal >= 10,
      label: 'Attendees >= 10',
      value: attendeesVal,
      threshold: '10',
    },
    {
      passed: meetingsVal >= 1,
      label: 'Meetings Booked',
      value: meetingsVal,
      threshold: '1',
    },
    {
      passed: leadsGeneratedCount >= 1,
      label: 'Leads Generated',
      value: leadsGeneratedCount,
      threshold: '1',
    },
  ];

  let outcome: MarketingTaskOutcome;

  // SUCCESS if generated leads or booked meetings
  if (leadsGeneratedCount >= 1 || meetingsVal >= 1) {
    outcome = 'SUCCESS';
  } else if (attendeesVal >= 10) {
    // PARTIAL if good attendance but no conversions
    outcome = 'PARTIAL';
  } else {
    outcome = 'FAILED';
  }

  return { outcome, checks };
}

function calculateDefaultOutcome(metrics: TaskMetrics): CalculatedOutcome {
  const { leadsGeneratedCount, icpEngagement } = metrics;

  const checks: OutcomeCheckResult[] = [
    {
      passed: icpEngagement,
      label: 'ICP Engagement',
      value: icpEngagement,
    },
    {
      passed: leadsGeneratedCount >= 1,
      label: 'Leads Generated',
      value: leadsGeneratedCount,
      threshold: '1',
    },
  ];

  let outcome: MarketingTaskOutcome;

  if (leadsGeneratedCount >= 1) {
    outcome = 'SUCCESS';
  } else if (icpEngagement) {
    outcome = 'PARTIAL';
  } else {
    outcome = 'PARTIAL'; // Default for other types
  }

  return { outcome, checks };
}

// Get fields required for a specific task type
export function getRequiredFieldsForType(type: MarketingTaskType): string[] {
  switch (type) {
    case 'SOCIAL_POST':
      return ['likes', 'comments', 'shares', 'icpEngagement'];
    case 'LINKEDIN_OUTREACH':
      return ['responseType', 'connectionAccepted'];
    case 'BLOG_POST':
      return ['views', 'icpEngagement'];
    case 'EMAIL_CAMPAIGN':
    case 'COLD_EMAIL':
      return ['sent', 'opens', 'replies'];
    case 'EVENT':
    case 'WEBINAR':
      return ['attendees', 'meetingsBooked'];
    default:
      return ['icpEngagement'];
  }
}

// Get optional fields for a specific task type
export function getOptionalFieldsForType(type: MarketingTaskType): string[] {
  const allFields = ['likes', 'comments', 'shares', 'views', 'opens', 'sent', 'replies', 'attendees', 'meetingsBooked', 'responseType', 'connectionAccepted'];
  const required = getRequiredFieldsForType(type);
  return allFields.filter(f => !required.includes(f));
}
