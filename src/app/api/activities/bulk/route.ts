import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ActivityOutcome, UserRole, LeadStatus } from '@prisma/client';

const VALID_OUTCOMES: ActivityOutcome[] = [
  'CONNECTED',
  'MEETING_BOOKED',
  'LEFT_VOICEMAIL',
  'NO_ANSWER',
  'BUSY',
  'NOT_INTERESTED',
  'WRONG_NUMBER',
  'CALLBACK_REQUESTED',
];

const OUTCOME_TO_LEAD_STATUS: Partial<Record<ActivityOutcome, LeadStatus>> = {
  MEETING_BOOKED: 'QUALIFIED',
  CONNECTED: 'CONTACTED',
  NOT_INTERESTED: 'UNQUALIFIED',
};

interface ParsedCall {
  rowNumber: number;
  dealLeadName: string;
  contactName: string;
  callDate: string;
  callTime: string;
  duration: number | null;
  outcome: ActivityOutcome | null;
  notes: string;
  matchedDealId: string | null;
  matchedLeadId: string | null;
  matchedName: string | null;
  matchType: 'deal' | 'lead' | null;
  error: string | null;
}

function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    if (line.trim().startsWith('#') || line.trim() === '') continue;

    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

function validateDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function validateTime(timeStr: string): boolean {
  const regex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeStr);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role as UserRole;
  if (userRole !== 'SALES_REP' && userRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const mode = formData.get('mode') as string || 'preview';

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const content = await file.text();
  const rows = parseCSV(content);

  if (rows.length < 2) {
    return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
  }

  const headerRow = rows[0].map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
  const expectedHeaders = ['dealleadname', 'contactname', 'calldate', 'calltime', 'durationmin', 'outcome', 'notes'];

  const headerValid = expectedHeaders.every((h, i) => headerRow[i]?.includes(h.replace(/[^a-z]/g, '').substring(0, 6)));
  if (!headerValid) {
    return NextResponse.json({
      error: 'Invalid CSV headers. Please use the template.',
      expected: ['Deal/Lead Name', 'Contact Name', 'Call Date', 'Call Time', 'Duration (min)', 'Outcome', 'Notes'],
      received: rows[0],
    }, { status: 400 });
  }

  const [deals, leads] = await Promise.all([
    prisma.deal.findMany({ select: { id: true, name: true, company: true } }),
    prisma.lead.findMany({ select: { id: true, name: true, company: true } }),
  ]);

  const parsedCalls: ParsedCall[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 1 || row.every((cell) => !cell.trim())) continue;

    const [dealLeadName, contactName, callDate, callTime, durationStr, outcomeStr, notes] = row;

    const parsed: ParsedCall = {
      rowNumber: i + 1,
      dealLeadName: dealLeadName?.trim() || '',
      contactName: contactName?.trim() || '',
      callDate: callDate?.trim() || '',
      callTime: callTime?.trim() || '',
      duration: durationStr ? parseInt(durationStr, 10) : null,
      outcome: null,
      notes: notes?.trim() || '',
      matchedDealId: null,
      matchedLeadId: null,
      matchedName: null,
      matchType: null,
      error: null,
    };

    if (!parsed.dealLeadName) {
      parsed.error = 'Deal/Lead Name is required';
      parsedCalls.push(parsed);
      continue;
    }

    if (!parsed.callDate) {
      parsed.error = 'Call Date is required';
      parsedCalls.push(parsed);
      continue;
    }

    if (!validateDate(parsed.callDate)) {
      parsed.error = 'Invalid date format. Use YYYY-MM-DD';
      parsedCalls.push(parsed);
      continue;
    }

    if (parsed.callTime && !validateTime(parsed.callTime)) {
      parsed.error = 'Invalid time format. Use HH:MM (24-hour)';
      parsedCalls.push(parsed);
      continue;
    }

    if (parsed.duration !== null && (isNaN(parsed.duration) || parsed.duration < 0)) {
      parsed.error = 'Duration must be a positive number';
      parsedCalls.push(parsed);
      continue;
    }

    if (outcomeStr) {
      const upperOutcome = outcomeStr.trim().toUpperCase().replace(/\s+/g, '_') as ActivityOutcome;
      if (VALID_OUTCOMES.includes(upperOutcome)) {
        parsed.outcome = upperOutcome;
      } else {
        parsed.error = `Invalid outcome: ${outcomeStr}. Valid: ${VALID_OUTCOMES.join(', ')}`;
        parsedCalls.push(parsed);
        continue;
      }
    }

    const searchName = parsed.dealLeadName.toLowerCase();
    const matchedDeal = deals.find(
      (d) =>
        d.name.toLowerCase() === searchName ||
        d.company?.toLowerCase() === searchName ||
        d.name.toLowerCase().includes(searchName) ||
        searchName.includes(d.name.toLowerCase())
    );

    const matchedLead = leads.find(
      (l) =>
        l.name.toLowerCase() === searchName ||
        l.company?.toLowerCase() === searchName ||
        l.name.toLowerCase().includes(searchName) ||
        searchName.includes(l.name.toLowerCase())
    );

    if (matchedDeal) {
      parsed.matchedDealId = matchedDeal.id;
      parsed.matchedName = matchedDeal.name;
      parsed.matchType = 'deal';
    } else if (matchedLead) {
      parsed.matchedLeadId = matchedLead.id;
      parsed.matchedName = matchedLead.name;
      parsed.matchType = 'lead';
    } else {
      parsed.error = `No matching deal or lead found for: ${parsed.dealLeadName}`;
      parsedCalls.push(parsed);
      continue;
    }

    parsedCalls.push(parsed);
  }

  const validCalls = parsedCalls.filter((c) => !c.error);
  const invalidCalls = parsedCalls.filter((c) => c.error);

  if (mode === 'preview') {
    return NextResponse.json({
      totalRows: parsedCalls.length,
      validCount: validCalls.length,
      invalidCount: invalidCalls.length,
      validCalls: validCalls.map((c) => ({
        rowNumber: c.rowNumber,
        dealLeadName: c.dealLeadName,
        matchedName: c.matchedName,
        matchType: c.matchType,
        contactName: c.contactName,
        callDate: c.callDate,
        callTime: c.callTime,
        duration: c.duration,
        outcome: c.outcome,
      })),
      invalidCalls: invalidCalls.map((c) => ({
        rowNumber: c.rowNumber,
        dealLeadName: c.dealLeadName,
        error: c.error,
      })),
    });
  }

  if (validCalls.length === 0) {
    return NextResponse.json({ error: 'No valid calls to import' }, { status: 400 });
  }

  const activities = await prisma.$transaction(
    validCalls.map((call) =>
      prisma.activity.create({
        data: {
          type: 'CALL',
          subject: `Call${call.contactName ? ` with ${call.contactName}` : ''}`,
          description: call.notes || null,
          duration: call.duration,
          outcome: call.outcome,
          contactName: call.contactName || null,
          callTime: call.callTime || null,
          leadId: call.matchedLeadId,
          dealId: call.matchedDealId,
          userId: session.user.id,
          createdAt: new Date(call.callDate),
        },
      })
    )
  );

  const leadUpdates: { leadId: string; newStatus: LeadStatus }[] = [];
  for (const call of validCalls) {
    if (call.matchedLeadId && call.outcome) {
      const newStatus = OUTCOME_TO_LEAD_STATUS[call.outcome];
      if (newStatus) {
        leadUpdates.push({ leadId: call.matchedLeadId, newStatus });
      }
    }
  }

  if (leadUpdates.length > 0) {
    const uniqueUpdates = new Map<string, LeadStatus>();
    for (const update of leadUpdates) {
      const existing = uniqueUpdates.get(update.leadId);
      if (!existing || update.newStatus === 'QUALIFIED') {
        uniqueUpdates.set(update.leadId, update.newStatus);
      }
    }

    await Promise.all(
      Array.from(uniqueUpdates.entries()).map(([leadId, status]) =>
        prisma.lead.update({
          where: { id: leadId },
          data: { status },
        })
      )
    );
  }

  return NextResponse.json({
    success: true,
    imported: activities.length,
    leadsUpdated: leadUpdates.length,
    skipped: invalidCalls.length,
  });
}
