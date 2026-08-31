import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth/jwt';

// Define protected routes and their required roles
const ADMIN_ONLY_ROUTES = [
  '/dashboard/users',
  '/dashboard/audit',
  '/dashboard/logs',
  '/dashboard/metrics',
];

// Routes that admin/organizer should NOT access
const NON_ADMIN_ROUTES = [
  '/dashboard/code',
  '/dashboard/qa',
  '/dashboard/security',
  '/dashboard/performance',
  '/dashboard/runtime',
  '/dashboard/certification',
  '/dashboard/workspace',
  '/dashboard/chat',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Only protect /dashboard routes for now
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // 2. Check for token in cookies
  const token = request.cookies.get('nexora_session')?.value;

  if (!token) {
    // Redirect to login if no token
    // (We will create a login page in the next step, for now redirect to root)
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Verify token
  const payload = await verifySessionToken(token);
  if (!payload) {
    // Invalid token, clear it and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('nexora_session');
    return response;
  }

  // 4. RBAC Authorization Checks
  const userRole = payload.role;
  const userIsAdmin = userRole === 'admin' || userRole === 'super_admin';

  // Admin-only routes
  for (const route of ADMIN_ONLY_ROUTES) {
    if (pathname.startsWith(route) && !userIsAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Non-admin routes (blocked for admin/organizer)
  for (const route of NON_ADMIN_ROUTES) {
    if (pathname.startsWith(route) && userIsAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Client can only access: /dashboard, /dashboard/qa, /dashboard/settings, /dashboard/ai-keys
  if (userRole === 'client') {
    const clientAllowed = ['/dashboard/qa', '/dashboard/settings', '/dashboard/ai-keys'];
    const isAllowed = pathname === '/dashboard' || clientAllowed.some(r => pathname.startsWith(r));
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Organizer can only access: /dashboard, /dashboard/projects, /dashboard/settings
  if (userRole === 'organizer') {
    const orgAllowed = ['/dashboard/projects', '/dashboard/settings'];
    const isAllowed = pathname === '/dashboard' || orgAllowed.some(r => pathname.startsWith(r));
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 5. Add user info to headers for downstream use if needed
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-user-role', payload.role);
  
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
