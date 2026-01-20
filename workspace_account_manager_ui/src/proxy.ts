import { NextRequest, NextResponse } from 'next/server';
import { isServerAuthenticated } from './lib/auth/server-auth';

export function proxy(request: NextRequest) {
  const authenticated = isServerAuthenticated();
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/login', '/login/callback'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!authenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check admin routes
  if (pathname.startsWith('/admin')) {
    // In a real implementation, you'd verify admin role from token
    // For now, just allow if authenticated
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
