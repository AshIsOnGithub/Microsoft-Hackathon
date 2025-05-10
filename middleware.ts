import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Handle profile redirect only
  if (req.nextUrl.pathname === '/profile') {
    return NextResponse.redirect(new URL('/dashboard/profile', req.url));
  }
  
  // For all other routes, just proceed without Supabase auth check
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only apply middleware to the profile path to avoid timeouts elsewhere
    '/profile'
  ],
}; 