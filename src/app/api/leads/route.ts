import { NextRequest, NextResponse } from 'next/server';

// Mock data for demo mode
const mockLeads = [
  {
    id: '1',
    companyName: 'Acme Corporation',
    contactName: 'John Doe',
    source: 'Website',
    status: 'Qualified',
    owner: { id: '1', name: 'Demo User', email: 'demo@forge.com' },
    createdAt: new Date('2024-01-15'),
  },
];

export async function GET() {
  // Return mock data for demo - no database needed
  return NextResponse.json(mockLeads);
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

