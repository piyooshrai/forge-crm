import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Demo mode - return mock response
  const body = await req.json();
  return NextResponse.json({
    id: 'new-' + Date.now(),
    ...body,
    completed: false,
    user: { id: '1', name: 'Demo User', email: 'demo@forge.com' },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

