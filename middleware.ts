import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { neon } from '@neondatabase/serverless';

// Public Matchers (Tracking engine, auth pages, webhooks, root site)
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/p/(.*)', '/track/(.*)', '/api/webhooks(.*)', '/api/public-stats(.*)', '/api/blog-api(.*)']);

// Role Context Matchers
const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isFinanceRoute = createRouteMatcher(['/dashboard/finance(.*)']);
const isOpsRoute = createRouteMatcher(['/dashboard/shipments(.*)', '/dashboard/ingest(.*)', '/dashboard/labels(.*)', '/dashboard/crm(.*)']);

// Database Sovereign check
async function getUserRole(email: string) {
  if (!process.env.DATABASE_URL) return null;
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT role FROM profiles WHERE email = ${email} AND status = 'ACTIVE' LIMIT 1`;
  return rows.length > 0 ? rows[0].role : null;
}

export default clerkMiddleware(async (auth, req) => {
  // Always permit public routes regardless of session
  if (isPublicRoute(req)) return NextResponse.next();

  const authObj = await auth();
  const email = authObj?.sessionClaims?.email as string;
  
  // Auth requirement for all remaining routes
  await auth.protect();

  // Deterministic Role Resolution
  // 1. Direct fetch from Sovereign Database (Neon)
  let userRole = await getUserRole(email);
  
  // 2. Fallback to Session Claims (Clerk) if DB check fails or is pending sync
  if (!userRole) {
    userRole = authObj?.sessionClaims?.metadata?.role as string;
  }

  const isMasterAdmin = userRole === 'MASTER_ADMIN' || email === 'quraisyabdurrahman@ambaraartha.com';

  const response = NextResponse.next();
  
  // Debug Headers for Traceability
  response.headers.set('X-Ambara-Auth-Email', email || 'none');
  response.headers.set('X-Ambara-Auth-Role', userRole || 'none');
  response.headers.set('X-Ambara-Auth-Master', isMasterAdmin ? 'true' : 'false');

  // Master Admin bypasses all checks
  if (isMasterAdmin) {
    return response; 
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

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
