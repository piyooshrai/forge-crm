import { NextResponse } from 'next/server';

export async function GET() {
  const headers = [
    'Deal/Lead Name',
    'Contact Name',
    'Call Date',
    'Call Time',
    'Duration (min)',
    'Outcome',
    'Notes',
  ];

  const exampleRows = [
    ['Acme Corp', 'John Smith', '2026-01-06', '10:30', '15', 'CONNECTED', 'Discussed pricing, sending proposal'],
    ['TechCorp', 'Sarah Lee', '2026-01-06', '11:00', '5', 'NO_ANSWER', 'Left voicemail'],
    ['GlobalBank', 'Mike Johnson', '2026-01-06', '14:30', '22', 'MEETING_BOOKED', 'Discovery call scheduled for Jan 10'],
  ];

  const outcomeOptions = [
    '',
    '# Valid Outcomes:',
    '# CONNECTED - Spoke with contact',
    '# MEETING_BOOKED - Scheduled a meeting',
    '# LEFT_VOICEMAIL - Left a voicemail',
    '# NO_ANSWER - No answer',
    '# BUSY - Line was busy',
    '# NOT_INTERESTED - Contact not interested',
    '# WRONG_NUMBER - Wrong number',
    '# CALLBACK_REQUESTED - Contact requested callback',
  ];

  const csvContent = [
    headers.join(','),
    ...exampleRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    '',
    '# Instructions:',
    '# 1. Delete the example rows above and add your call data',
    '# 2. Deal/Lead Name must match an existing deal or lead in Forge',
    '# 3. Call Date format: YYYY-MM-DD (e.g., 2026-01-06)',
    '# 4. Call Time format: HH:MM in 24-hour format (e.g., 14:30 for 2:30 PM)',
    '# 5. Duration is in minutes',
    ...outcomeOptions,
  ].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="call-log-template.csv"',
    },
  });
}
