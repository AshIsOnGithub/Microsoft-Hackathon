import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Handle profile redirect
  if (req.nextUrl.pathname === '/profile') {
    return NextResponse.redirect(new URL('/dashboard/profile', req.url));
  }
  
  const res = NextResponse.next();
  
  // Create the supabase middleware client
  const supabase = createMiddlewareClient({ req, res });
  
  // Refresh session if it exists
  await supabase.auth.getSession();
  
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 