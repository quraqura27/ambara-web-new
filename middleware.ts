import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public Matchers (Tracking engine, auth pages, webhooks)
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/p/(.*)', '/api/webhooks(.*)']);

// Role Context Matchers
const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isFinanceRoute = createRouteMatcher(['/dashboard/finance(.*)']);
const isOpsRoute = createRouteMatcher(['/dashboard/shipments(.*)', '/dashboard/ingest(.*)', '/dashboard/labels(.*)', '/dashboard/crm(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Always permit public routes regardless of session
  if (isPublicRoute(req)) return NextResponse.next();

  const authObj = await auth();
  const userRole = authObj?.sessionClaims?.metadata?.role;
  const isMasterAdmin = userRole === 'MASTER_ADMIN';

  // Auth requirement for all remaining routes
  await authObj.protect();

  // Master Admin bypasses all checks
  if (isMasterAdmin) {
    return NextResponse.next(); 
  }

  // Finance Restrictive Matcher
  if (isFinanceRoute(req) && userRole !== 'FINANCE') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Operations Restrictive Matcher
  if (isOpsRoute(req) && userRole !== 'OPERATIONS') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Admin Enforcer
  if (isAdminRoute(req) && !isMasterAdmin) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
