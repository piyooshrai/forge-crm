import { NextRequest, NextResponse } from 'next/server';
import { Pipeline, DealStage } from '@prisma/client';

// Mock data for demo
const mockDeals = [
  {
    id: '1',
    name: 'Acme Corporation - Q4 Project',
    pipeline: Pipeline.IT_SERVICES,
    stage: DealStage.PROPOSAL,
    probability: 75,
    amountTotal: 2400000,
    hourlyRate: null,
    expectedHours: null,
    amountType: 'FIXED',
    closeDate: new Date('2024-02-15'),
    owner: { id: '1', name: 'Demo User', email: 'demo@forge.com' },
    createdAt: new Date('2024-01-10'),
  },
];

export async function GET(req: NextRequest) {
  // Return mock data for demo
  return NextResponse.json(mockDeals);
}

export async function POST(req: NextRequest) {
  // Demo mode - return mock response
  const body = await req.json();
  return NextResponse.json({
    id: 'new-' + Date.now(),
    ...body,
    owner: { id: '1', name: 'Demo User', email: 'demo@forge.com' },
    createdAt: new Date(),
  });
}

