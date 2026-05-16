import { NextRequest, NextResponse } from 'next/server';

// ─── Route protection middleware ──────────────────────────────────────────────
// Runs on the Edge before every request (no Node.js APIs).
// The token is read from localStorage by the client; here we just check
// a lightweight cookie mirror we set on login.
//
// NOTE: localStorage is NOT accessible in middleware (it's browser-only).
// The pattern used here is:
//   1. On login, also set a short-lived cookie: `ias_auth=1` (httpOnly: false
//      so the middleware can read it, or just a regular cookie).
//   2. Middleware checks for that cookie to decide if the user is "logged in".
//   3. The real token validation happens server-side on each API request.

const PUBLIC_ROUTES  = ['/'];          // login page
const ADMIN_ROUTES   = ['/admin'];
const EMPLOYEE_ROUTES = ['/employee'];

export function proxy(req: NextRequest) {
  // ── Dev bypass: skip all auth checks ────────────────────────────────────
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  const role       = req.cookies.get('ias_role')?.value; // 'admin' | 'employee' | undefined
  const hasSession = !!role;

  const isPublic = PUBLIC_ROUTES.some((r)  => pathname === r);
  const isAdmin  = ADMIN_ROUTES.some((r)   => pathname.startsWith(r));
  const isEmp    = EMPLOYEE_ROUTES.some((r) => pathname.startsWith(r));

  // Not logged in → redirect to login
  if (!hasSession && (isAdmin || isEmp)) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Logged in → skip login page
  if (hasSession && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = role === 'admin' ? '/admin' : '/employee';
    return NextResponse.redirect(url);
  }

  // Employee trying to access /admin → bounce to /employee
  if (hasSession && isAdmin && role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/employee';
    return NextResponse.redirect(url);
  }

  // Admin trying to access /employee → bounce to /admin
  if (hasSession && isEmp && role !== 'employee') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
