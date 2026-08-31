import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth/jwt';
import type { UserRole } from '@/types';

const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin' as UserRole];

// Define protected routes and their required roles
// If a route prefix is not here, it just requires authentication
const ROLE_PROTECTED_ROUTES = [
  // Admin only routes
  { path: '/dashboard/users', allowed: ADMIN_ROLES },
  { path: '/dashboard/audit', allowed: ADMIN_ROLES },
  { path: '/dashboard/settings', allowed: ADMIN_ROLES },
  { path: '/dashboard/logs', allowed: ADMIN_ROLES },
  { path: '/dashboard/metrics', allowed: ADMIN_ROLES },
  
  // Non-Admin (Engineering) only routes
  // (Assuming we strictly enforce that admins cannot access engineering tools)
  { path: '/dashboard/code', blocked: ADMIN_ROLES },
  { path: '/dashboard/qa', blocked: ADMIN_ROLES },
  { path: '/dashboard/security', blocked: ADMIN_ROLES },
  { path: '/dashboard/performance', blocked: ADMIN_ROLES },
  { path: '/dashboard/runtime', blocked: ADMIN_ROLES },
  { path: '/dashboard/certification', blocked: ADMIN_ROLES },
  { path: '/dashboard/workspace', blocked: ADMIN_ROLES },
  { path: '/dashboard/chat', blocked: ADMIN_ROLES },
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

  for (const route of ROLE_PROTECTED_ROUTES) {
    if (pathname.startsWith(route.path)) {
      // Check if user role is explicitly allowed
      if (route.allowed && !route.allowed.includes(userRole)) {
        // Redirect to a safe dashboard page if unauthorized
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Check if user role is explicitly blocked
      if (route.blocked && route.blocked.includes(userRole)) {
        // Redirect to a safe dashboard page if unauthorized
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
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
