import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canEditDeal } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canEditDeal(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { dealId, name, quantity, unitPrice, discount, isRecurring, productId } = body;

  const lineItem = await prisma.dealLineItem.create({
    data: {
      dealId,
      productId: productId || null,
      name,
      quantity,
      unitPrice,
      discount: discount || 0,
      isRecurring: isRecurring || false,
      createdById: session.user.id,
    },
    include: {
      product: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(lineItem);
}
