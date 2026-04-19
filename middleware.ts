import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { neon } from '@neondatabase/serverless';

// Public Matchers (Tracking engine, auth pages, webhooks, root site)
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/p/(.*)', '/track/(.*)', '/api/webhooks(.*)', '/api/public-stats(.*)', '/api/blog-api(.*)']);

// Role Context Matchers
const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isFinanceRoute = createRouteMatcher(['/dashboard/finance(.*)']);
const isOpsRoute = createRouteMatcher(['/dashboard/shipments(.*)', '/dashboard/ingest(.*)', '/dashboard/labels(.*)', '/dashboard/crm(.*)']);

// Step 1000: Module-level initialization for Edge pooling
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

async function getSovereignRole(userId: string, email?: string) {
  try {
    if (!sql) return null;
    
    // 1. Primary Lookup: Clerk ID (Deterministic)
    let rows = await sql`SELECT role FROM profiles WHERE clerk_id = ${userId} AND status = 'ACTIVE' LIMIT 1`;
    if (rows.length > 0) return rows[0].role;

    // 2. Self-Healing Fallback: Primary Owner Check
    if (email === 'quraisyabdurrahman@ambaraartha.com') {
      // Auto-Adopt: Update the record to link this Clerk ID to the Master Admin email
      await sql`UPDATE profiles SET clerk_id = ${userId}, status = 'ACTIVE' WHERE email = ${email}`;
      return 'MASTER_ADMIN';
    }

    return null;
  } catch (e) {
    console.error('Middleware Sovereign Check Failed:', e);
    return null;
  }
}

export default clerkMiddleware(async (auth, req) => {
  const response = NextResponse.next();
  
  try {
    if (isPublicRoute(req)) return response;

    const authObj = await auth();
    const { userId, sessionClaims } = authObj;

    if (!userId) {
      if (!isPublicRoute(req)) await auth.protect();
      return response;
    }

    const email = sessionClaims?.email as string;
    
    // Deterministic Role Identification with Auto-Healing
    let userRole = await getSovereignRole(userId, email);
    
    // Secondary: Clerk Metadata Fallback
    if (!userRole) {
      userRole = sessionClaims?.metadata?.role as string;
    }

    const isMasterAdmin = userRole === 'MASTER_ADMIN' || email === 'quraisyabdurrahman@ambaraartha.com';

    // Debugging Trace (Edge Headers)
    response.headers.set('X-Ambara-Auth-Email', email || 'NONE');
    response.headers.set('X-Ambara-Auth-UID', userId);
    response.headers.set('X-Ambara-Auth-Role', userRole || 'GUEST');
    response.headers.set('X-Ambara-Auth-Status', isMasterAdmin ? 'SOVEREIGN' : 'RESTRICTED');

    // Master Admin bypasses all checks
    if (isMasterAdmin) return response;

    const currentUrl = req.nextUrl.pathname;

    // RBAC Enforcement
    if (isFinanceRoute(req) && userRole !== 'FINANCE') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (isOpsRoute(req) && !['OPERATIONS', 'MASTER_ADMIN', 'FINANCE'].includes(userRole || '')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (isAdminRoute(req)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return response;
  } catch (err) {
    console.error('Middleware Fatal Exception:', err);
    response.headers.set('X-Ambara-Sentinel-Panic', 'TRUE');
    return response; // Fail Open to Dashboard Overview
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
