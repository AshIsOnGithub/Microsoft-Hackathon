import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // Handle profile redirect
  if (req.nextUrl.pathname === '/profile') {
    return NextResponse.redirect(new URL('/dashboard/profile', req.url));
  }
  
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  // Try to refresh the session with a timeout
  try {
    const { data } = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 500)),
    ]);
    
    // If there's session data, use it, otherwise proceed normally
    if (data.session) {
      // You can store session info in headers if needed
    }
  } catch (error) {
    // If there's a timeout, just proceed without the session
    console.log('Auth timeout, proceeding without session refresh');
  }
  
  return response;
}

export const config = {
  matcher: [
    // Apply only to routes that should check auth
    '/dashboard/:path*',
    '/profile',
  ],
}; 