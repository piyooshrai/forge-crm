import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MarketingTaskType, MarketingTaskStatus, MarketingTaskOutcome } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as MarketingTaskType | null;
  const status = searchParams.get('status') as MarketingTaskStatus | null;
  const outcome = searchParams.get('outcome') as MarketingTaskOutcome | null;
  const templates = searchParams.get('templates') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const where: any = {};

  // MARKETING_REP sees only own tasks, SUPER_ADMIN sees all
  if (user.role !== 'SUPER_ADMIN') {
    where.userId = user.id;
  }

  if (type) where.type = type;
  if (status) where.status = status;
  if (outcome) where.outcome = outcome;
  if (templates) where.isTemplate = true;

  const tasks = await prisma.marketingTask.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      template: { select: { id: true, templateName: true } },
    },
    orderBy: { taskDate: 'desc' },
    take: limit,
    skip: offset,
  });

  const total = await prisma.marketingTask.count({ where });

  return NextResponse.json({ tasks, total });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as MarketingTaskType | null;
  const status = searchParams.get('status') as MarketingTaskStatus | null;
  const outcome = searchParams.get('outcome') as MarketingTaskOutcome | null;

  const where: any = {
    isTemplate: false, // Never delete templates
  };

  // MARKETING_REP can only delete own tasks
  if (user.role !== 'SUPER_ADMIN') {
    where.userId = user.id;
  }

  if (type) where.type = type;
  if (status) where.status = status;
  if (outcome) where.outcome = outcome;

  const result = await prisma.marketingTask.deleteMany({ where });

  return NextResponse.json({ deleted: result.count });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Only MARKETING_REP and SUPER_ADMIN can create
  if (user.role !== 'MARKETING_REP' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { type, description, target, content, taskDate, templateId, userId: targetUserId } = body;

  if (!type || !description) {
    return NextResponse.json({ error: 'Type and description required' }, { status: 400 });
  }

  // SUPER_ADMIN can create on behalf of others
  const createForUserId = user.role === 'SUPER_ADMIN' && targetUserId ? targetUserId : user.id;

  const task = await prisma.marketingTask.create({
    data: {
      type,
      description,
      target,
      content,
      taskDate: taskDate ? new Date(taskDate) : new Date(),
      status: 'IN_PROGRESS',
      templateId,
      userId: createForUserId,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
