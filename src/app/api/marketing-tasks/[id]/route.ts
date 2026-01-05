import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateOutcome } from '@/lib/marketing-outcome';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const task = await prisma.marketingTask.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      template: { select: { id: true, templateName: true, description: true, content: true } },
      tasksFromTemplate: {
        select: { id: true, outcome: true },
      },
      generatedLeads: {
        select: { id: true, name: true, company: true, email: true },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Check access
  if (user.role !== 'SUPER_ADMIN' && task.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Calculate template success rate if it's a template
  let templateSuccessRate = null;
  if (task.isTemplate && task.tasksFromTemplate.length > 0) {
    const withOutcome = task.tasksFromTemplate.filter(t => t.outcome);
    const successes = withOutcome.filter(t => t.outcome === 'SUCCESS').length;
    templateSuccessRate = withOutcome.length > 0 ? Math.round((successes / withOutcome.length) * 100) : 0;
  }

  return NextResponse.json({ ...task, templateSuccessRate });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const task = await prisma.marketingTask.findUnique({
    where: { id },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Check access
  if (user.role !== 'SUPER_ADMIN' && task.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const {
    type,
    description,
    target,
    content,
    taskDate,
    status,
    outcome,
    resultNotes,
    leadGenerated,
    generatedLeadId,
    isTemplate,
    templateName,
    // New engagement metrics
    likes,
    comments,
    shares,
    views,
    opens,
    sent,
    replies,
    attendees,
    meetingsBooked,
    // ICP engagement
    icpEngagement,
    // Lead attribution
    leadsGeneratedCount,
    linkedLeadIds,
    // Response tracking
    responseType,
    connectionAccepted,
    // Outcome override
    outcomeOverride,
    overrideReason,
  } = body;

  // Build update data
  const updateData: any = {
    ...(type && { type }),
    ...(description && { description }),
    ...(target !== undefined && { target }),
    ...(content !== undefined && { content }),
    ...(taskDate && { taskDate: new Date(taskDate) }),
    ...(status && { status }),
    ...(resultNotes !== undefined && { resultNotes }),
    ...(leadGenerated !== undefined && { leadGenerated }),
    ...(generatedLeadId !== undefined && { generatedLeadId }),
    ...(isTemplate !== undefined && { isTemplate }),
    ...(templateName !== undefined && { templateName }),
    // New engagement metrics
    ...(likes !== undefined && { likes }),
    ...(comments !== undefined && { comments }),
    ...(shares !== undefined && { shares }),
    ...(views !== undefined && { views }),
    ...(opens !== undefined && { opens }),
    ...(sent !== undefined && { sent }),
    ...(replies !== undefined && { replies }),
    ...(attendees !== undefined && { attendees }),
    ...(meetingsBooked !== undefined && { meetingsBooked }),
    // ICP engagement
    ...(icpEngagement !== undefined && { icpEngagement }),
    // Lead attribution
    ...(leadsGeneratedCount !== undefined && { leadsGeneratedCount }),
    // Response tracking
    ...(responseType !== undefined && { responseType }),
    ...(connectionAccepted !== undefined && { connectionAccepted }),
    // Outcome override
    ...(outcomeOverride !== undefined && { outcomeOverride }),
    ...(overrideReason !== undefined && { overrideReason }),
  };

  // Calculate outcome if not overridden and metrics provided
  if (status === 'COMPLETED' && !outcomeOverride) {
    const taskType = type || task.type;
    const metrics = {
      type: taskType,
      likes: likes ?? task.likes,
      comments: comments ?? task.comments,
      shares: shares ?? task.shares,
      views: views ?? task.views,
      opens: opens ?? task.opens,
      sent: sent ?? task.sent,
      replies: replies ?? task.replies,
      attendees: attendees ?? task.attendees,
      meetingsBooked: meetingsBooked ?? task.meetingsBooked,
      icpEngagement: icpEngagement ?? task.icpEngagement ?? false,
      leadsGeneratedCount: leadsGeneratedCount ?? task.leadsGeneratedCount ?? 0,
      responseType: responseType ?? task.responseType,
      connectionAccepted: connectionAccepted ?? task.connectionAccepted,
    };
    const { outcome: calculatedOutcome } = calculateOutcome(metrics);
    updateData.outcome = calculatedOutcome;
  } else if (outcome !== undefined) {
    // Allow manual outcome if overriding
    updateData.outcome = outcome;
  }

  const updatedTask = await prisma.marketingTask.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, email: true } },
      generatedLeads: { select: { id: true, name: true, company: true } },
    },
  });

  // Link leads to this task if provided
  if (linkedLeadIds && Array.isArray(linkedLeadIds) && linkedLeadIds.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: linkedLeadIds } },
      data: { generatedFromTaskId: id },
    });
  }

  return NextResponse.json(updatedTask);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const task = await prisma.marketingTask.findUnique({
    where: { id },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Check access
  if (user.role !== 'SUPER_ADMIN' && task.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Templates cannot be deleted, only archived
  if (task.isTemplate) {
    return NextResponse.json({ error: 'Templates cannot be deleted' }, { status: 400 });
  }

  await prisma.marketingTask.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
