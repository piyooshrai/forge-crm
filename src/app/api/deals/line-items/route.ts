import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canEditDeal } from '@/lib/auth-helpers';
import { UserRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canEditDeal(session.user.role as UserRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { dealId, productId, productName, quantity, unitPrice, discount, type } = body;

  // Calculate total
  const total = quantity * unitPrice * (1 - (discount || 0));

  const lineItem = await prisma.dealLineItem.create({
    data: {
      dealId,
      productId: productId || null,
      productName,
      quantity,
      unitPrice,
      discount: discount || 0,
      type: type || 'ONE_TIME',
      total,
      createdById: session.user.id,
    },
    include: {
      product: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Update deal total amount
  const lineItems = await prisma.dealLineItem.findMany({
    where: { dealId },
  });
  const newTotal = lineItems.reduce((sum, item) => sum + item.total, 0);

  await prisma.deal.update({
    where: { id: dealId },
    data: { amountTotal: newTotal },
  });

  return NextResponse.json(lineItem);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canEditDeal(session.user.role as UserRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const lineItemId = searchParams.get('id');

  if (!lineItemId) {
    return NextResponse.json({ error: 'Line item ID required' }, { status: 400 });
  }

  const lineItem = await prisma.dealLineItem.findUnique({
    where: { id: lineItemId },
  });

  if (!lineItem) {
    return NextResponse.json({ error: 'Line item not found' }, { status: 404 });
  }

  await prisma.dealLineItem.delete({
    where: { id: lineItemId },
  });

  // Update deal total amount
  const lineItems = await prisma.dealLineItem.findMany({
    where: { dealId: lineItem.dealId },
  });
  const newTotal = lineItems.reduce((sum, item) => sum + item.total, 0);

  await prisma.deal.update({
    where: { id: lineItem.dealId },
    data: { amountTotal: newTotal },
  });

  return NextResponse.json({ success: true });
}

