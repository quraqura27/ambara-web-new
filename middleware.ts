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
    let rows = await sql`SELECT role, email FROM profiles WHERE clerk_id = ${userId} AND status = 'ACTIVE' LIMIT 1`;
    if (rows.length > 0) return rows[0].role;

    // 2. Heavy Fallback: Check if this userId belongs to the Master Admin record via email
    // even if email wasn't passed in (we'll fetch from claims or just scan the owner account)
    const targetEmail = email || 'quraisyabdurrahman@ambaraartha.com';
    const ownerRows = await sql`SELECT role FROM profiles WHERE email = ${targetEmail} AND role = 'MASTER_ADMIN' LIMIT 1`;
    
    if (ownerRows.length > 0) {
      // Auto-Adopt Identity
      await sql`UPDATE profiles SET clerk_id = ${userId}, status = 'ACTIVE' WHERE email = ${targetEmail}`;
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
    
    // Sovereign Role check (with self-healing auto-adopt)
    let userRole = await getSovereignRole(userId, email || undefined);
    
    // Metadata fallback
    if (!userRole) {
      userRole = sessionClaims?.metadata?.role as string;
    }

    const isMasterAdmin = (email === 'quraisyabdurrahman@ambaraartha.com') || (userRole === 'MASTER_ADMIN');

    // Debugging Trace (Edge Headers)
    response.headers.set('X-Ambara-Auth-UID', userId);
    response.headers.set('X-Ambara-Auth-Role', userRole || 'GUEST');
    response.headers.set('X-Ambara-Auth-Root', isMasterAdmin ? 'YES' : 'NO');

    // MASTER BYPASS
    if (isMasterAdmin) return response;

    // RBAC Enforcement
    if (isFinanceRoute(req) && !['FINANCE', 'MASTER_ADMIN'].includes(userRole || '')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (isOpsRoute(req) && !['OPERATIONS', 'FINANCE', 'MASTER_ADMIN'].includes(userRole || '')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (isAdminRoute(req)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return response;
  } catch (err) {
    console.error('Middleware Critical Sentinel Error:', err);
    response.headers.set('X-Ambara-Sentinel-Panic', 'TRUE');
    return response; 
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
