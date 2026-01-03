import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Generate random password
function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function verifyAdmin(session: any) {
  if (!session?.user) return null;

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return null;
  return currentUser;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const admin = await verifyAdmin(session);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      monthlyQuota: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const admin = await verifyAdmin(session);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, email, role, monthlyQuota, isActive } = body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check email uniqueness if changing
  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(monthlyQuota !== undefined && { monthlyQuota }),
      ...(isActive !== undefined && { isActive }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      monthlyQuota: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const admin = await verifyAdmin(session);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  // Prevent self-deactivation
  if (id === admin.id) {
    return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 });
  }

  // Soft delete - just deactivate
  const user = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      monthlyQuota: true,
    },
  });

  return NextResponse.json(user);
}

// Reset password endpoint
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const admin = await verifyAdmin(session);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  if (action === 'reset-password') {
    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      newPassword,
      message: 'Password has been reset. Share this with the user securely.'
    });
  }

  if (action === 'reactivate') {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        monthlyQuota: true,
      },
    });

    return NextResponse.json(user);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
