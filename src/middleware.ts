import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  // Skip auth for demo - allow all routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/deals/:path*',
    '/products/:path*',
    '/settings/:path*',
  ],
};

