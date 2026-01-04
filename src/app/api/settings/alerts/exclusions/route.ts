import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Only SUPER_ADMIN can manage exclusions
async function checkSuperAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return { authorized: false, error: 'Forbidden', status: 403 };
  }

  return { authorized: true, session };
}

// POST - Create a new user alert exclusion
export async function POST(req: NextRequest) {
  const authCheck = await checkSuperAdmin();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await req.json();
    const { userId, startDate, endDate, reason } = body;

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'userId, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create exclusion
    const exclusion = await prisma.userAlertExclusion.create({
      data: {
        userId,
        startDate: start,
        endDate: end,
        reason: reason || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(exclusion, { status: 201 });
  } catch (error) {
    console.error('Error creating exclusion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a user alert exclusion
export async function DELETE(req: NextRequest) {
  const authCheck = await checkSuperAdmin();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Exclusion ID required' }, { status: 400 });
    }

    await prisma.userAlertExclusion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exclusion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a user alert exclusion
export async function PATCH(req: NextRequest) {
  const authCheck = await checkSuperAdmin();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await req.json();
    const { id, startDate, endDate, reason } = body;

    if (!id) {
      return NextResponse.json({ error: 'Exclusion ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (reason !== undefined) updateData.reason = reason || null;

    const exclusion = await prisma.userAlertExclusion.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(exclusion);
  } catch (error) {
    console.error('Error updating exclusion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
