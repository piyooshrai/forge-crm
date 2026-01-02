import { NextRequest, NextResponse } from 'next/server';

// Mock data for demo
const mockProducts = [
  {
    id: '1',
    name: 'Cloud Infrastructure Setup',
    description: 'Complete cloud migration and setup service',
    sku: 'CLOUD-001',
    price: 50000,
    isRecurring: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export async function GET() {
  // Return mock data for demo
  return NextResponse.json(mockProducts);
}

export async function POST(req: NextRequest) {
  // Demo mode - return mock response
  const body = await req.json();
  return NextResponse.json({
    id: 'new-' + Date.now(),
    ...body,
    price: parseFloat(body.price) || 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

