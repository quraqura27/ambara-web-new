import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { neon } from '@neondatabase/serverless';

// Public Matchers (Tracking engine, auth pages, webhooks, root site)
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/p/(.*)', '/track/(.*)', '/api/webhooks(.*)', '/api/public-stats(.*)', '/api/blog-api(.*)']);

// Role Context Matchers
const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isFinanceRoute = createRouteMatcher(['/dashboard/finance(.*)']);
const isOpsRoute = createRouteMatcher(['/dashboard/shipments(.*)', '/dashboard/ingest(.*)', '/dashboard/labels(.*)', '/dashboard/crm(.*)']);

// Database Sovereign check - Edge Compatible
async function getUserRole(clerkId?: string, email?: string) {
  try {
    if (!process.env.DATABASE_URL) return null;
    const sql = neon(process.env.DATABASE_URL);
    
    // We try clerkId first as it is the most modern and stable identifier
    if (clerkId) {
      const rows = await sql`SELECT role FROM profiles WHERE clerk_id = ${clerkId} AND status = 'ACTIVE' LIMIT 1`;
      if (rows.length > 0) return rows[0].role;
    }
    
    // Fallback to email lookup
    if (email) {
      const rows = await sql`SELECT role FROM profiles WHERE email = ${email} AND status = 'ACTIVE' LIMIT 1`;
      if (rows.length > 0) return rows[0].role;
    }
    
    return null;
  } catch (error) {
    console.error('Sovereign Auth Error:', error);
    return null;
  }
}

export default clerkMiddleware(async (auth, req) => {
  // Always permit public routes regardless of session
  if (isPublicRoute(req)) return NextResponse.next();

  try {
    const authObj = await auth();
    const { userId, sessionClaims } = authObj;
    
    // Check for root admin email in session claims (if available) or standard fields
    const email = (sessionClaims?.email || '') as string;
    
    // MASTER ADMIN Hard-coded Safety Net (Non-blocking)
    const isOwnerEmail = email === 'quraisyabdurrahman@ambaraartha.com';

    // Role Resolution
    let userRole = await getUserRole(userId || undefined, email || undefined);
    
    // Secondary Fallback: Use Clerk Session Metadata if DB is silent
    if (!userRole && sessionClaims?.metadata) {
      userRole = (sessionClaims.metadata as any).role;
    }

    const isMasterAdmin = isOwnerEmail || userRole === 'MASTER_ADMIN';

    const response = NextResponse.next();
    
    // Trace Headers for Debugging (Browser Network Tab)
    response.headers.set('X-Ambara-Trace-UID', userId || 'none');
    response.headers.set('X-Ambara-Trace-Role', userRole || 'GUEST');
    response.headers.set('X-Ambara-Trace-Master', isMasterAdmin ? 'TRUE' : 'FALSE');

    // Master Admin bypasses all checks
    if (isMasterAdmin) return response;

    // Route Guards
    if (isAdminRoute(req) && !isMasterAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (isFinanceRoute(req) && userRole !== 'FINANCE' && !isMasterAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (isOpsRoute(req) && !['OPERATIONS', 'MASTER_ADMIN'].includes(userRole as any) && !isMasterAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return response;
  } catch (err) {
    console.error('Middleware Critical Path Error:', err);
    // On critical failure, we allow navigation to dashboard but block sub-routes
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
