import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Handle profile redirect
  if (req.nextUrl.pathname === '/profile') {
    return NextResponse.redirect(new URL('/dashboard/profile', req.url));
  }
  
  const res = NextResponse.next();
  
  try {
    // Create the supabase middleware client
    const supabase = createMiddlewareClient({ req, res });
    
    // Set a timeout for the Supabase call
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth session timeout')), 2000)
    );
    
    // Refresh session if it exists with timeout
    await Promise.race([
      supabase.auth.getSession(),
      timeoutPromise
    ]);
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue even if session refresh fails
  }
  
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
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}; 