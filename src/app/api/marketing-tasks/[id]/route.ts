import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
  } = body;

  const updatedTask = await prisma.marketingTask.update({
    where: { id },
    data: {
      ...(type && { type }),
      ...(description && { description }),
      ...(target !== undefined && { target }),
      ...(content !== undefined && { content }),
      ...(taskDate && { taskDate: new Date(taskDate) }),
      ...(status && { status }),
      ...(outcome !== undefined && { outcome }),
      ...(resultNotes !== undefined && { resultNotes }),
      ...(leadGenerated !== undefined && { leadGenerated }),
      ...(generatedLeadId !== undefined && { generatedLeadId }),
      ...(isTemplate !== undefined && { isTemplate }),
      ...(templateName !== undefined && { templateName }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

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
