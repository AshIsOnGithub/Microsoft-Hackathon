import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Handle profile redirect
  if (req.nextUrl.pathname === '/profile') {
    return NextResponse.redirect(new URL('/dashboard/profile', req.url));
  }
  
  // Return next response for all other paths
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply only to the profile redirect path
    '/profile',
  ],
}; 