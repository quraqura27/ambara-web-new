import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { neon } from '@neondatabase/serverless';

// Public Matchers
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/p/(.*)', '/track/(.*)', '/api/webhooks(.*)', '/api/public-stats(.*)', '/api/blog-api(.*)']);

// Role Context Matchers
const isAdminRoute = createRouteMatcher(['/dashboard/admin(.*)']);
const isFinanceRoute = createRouteMatcher(['/dashboard/finance(.*)']);
const isOpsRoute = createRouteMatcher(['/dashboard/shipments(.*)', '/dashboard/ingest(.*)', '/dashboard/labels(.*)', '/dashboard/crm(.*)']);

async function getSovereignRole(userId: string) {
  try {
    if (!process.env.DATABASE_URL) return null;
    const sql = neon(process.env.DATABASE_URL);
    // Deterministic lookup by Clerk ID (The Sub)
    const rows = await sql`SELECT role FROM profiles WHERE clerk_id = ${userId} AND status = 'ACTIVE' LIMIT 1`;
    return rows.length > 0 ? rows[0].role : null;
  } catch (e) {
    console.error('Middleware Sovereign Check Failed:', e);
    return null;
  }
}

export default clerkMiddleware(async (auth, req) => {
  const response = NextResponse.next();
  
  try {
    // 1. Skip check for public routes
    if (isPublicRoute(req)) return response;

    const authObj = await auth();
    const { userId, sessionClaims } = authObj;

    // 2. Auth Requirement
    if (!userId) {
      if (!isPublicRoute(req)) await auth.protect();
      return response;
    }

    // 3. Deterministic Role Identification
    // Primary: Database Lookup (True Sovereignty)
    // Secondary: Session Claims (Cached State)
    let userRole = await getSovereignRole(userId);
    if (!userRole) {
      userRole = sessionClaims?.metadata?.role as string;
    }

    const userEmail = sessionClaims?.email as string;
    const isMasterAdmin = userRole === 'MASTER_ADMIN' || userEmail === 'quraisyabdurrahman@ambaraartha.com';

    // 4. Debugging Headers (Internal Trace)
    response.headers.set('X-Ambara-Trace-UID', userId);
    response.headers.set('X-Ambara-Trace-Role', userRole || 'NONE');
    response.headers.set('X-Ambara-Trace-Master', isMasterAdmin ? 'TRUE' : 'FALSE');

    // 5. RBAC Enforcement
    if (isMasterAdmin) return response;

    if (isFinanceRoute(req) && userRole !== 'FINANCE') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (isOpsRoute(req) && !['OPERATIONS', 'MASTER_ADMIN'].includes(userRole || '')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (isAdminRoute(req) && !isMasterAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return response;
  } catch (err) {
    console.error('Middleware Sentinel Error:', err);
    // Step 1000: Fail-Graceful. If the middleware logic crashes, permit flow but mark the error.
    response.headers.set('X-Ambara-Sentinel-Error', 'FATAL');
    return response; 
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
