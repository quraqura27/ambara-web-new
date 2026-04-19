import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { neon } from '@neondatabase/serverless';

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/p/(.*)', '/track/(.*)', '/api/webhooks(.*)']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

async function syncMasterAdmin(userId: string, email?: string) {
  try {
    if (!sql || !email || email !== 'quraisyabdurrahman@ambaraartha.com') return;
    await sql`UPDATE profiles SET clerk_id = ${userId}, status = 'ACTIVE' WHERE email = ${email}`;
  } catch (e) {
    console.error('Master Sync Failed:', e);
  }
}

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl.pathname;

  // Bypasses for Assets & Internal Next.js requests
  if (url.startsWith('/_next') || url.includes('/api/auth') || url.includes('favicon.ico')) {
    return NextResponse.next();
  }

  if (isPublicRoute(req)) return NextResponse.next();

  const authObj = await auth();
  const { userId, sessionClaims } = authObj;

  if (!userId) {
    if (isProtectedRoute(req)) await auth.protect();
    return NextResponse.next();
  }

  const email = sessionClaims?.email as string;
  const isOwner = email === 'quraisyabdurrahman@ambaraartha.com';

  // Self-healing synchronization for the Owner
  if (isOwner) {
    await syncMasterAdmin(userId, email);
    return NextResponse.next();
  }

  // Basic Protection for all other dashboard routes
  if (isProtectedRoute(req)) {
    // We let the pages handle specific RBAC via server components for stability
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
