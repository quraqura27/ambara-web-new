import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/p/(.*)', '/track/(.*)', '/api/webhooks(.*)']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl.pathname;

  // 1. Static & Internal Bypass (Highest Priority)
  if (
    url.startsWith('/_next') || 
    url.includes('/api/auth') || 
    url.includes('favicon.ico') ||
    url.endsWith('.png') ||
    url.endsWith('.svg') ||
    url.endsWith('.css')
  ) {
    return NextResponse.next();
  }

  // 2. Public Route Logic
  if (isPublicRoute(req)) return NextResponse.next();

  // 3. Auth Requirement
  const authObj = await auth();
  const { userId, sessionClaims } = authObj;

  if (!userId) {
    if (isProtectedRoute(req)) {
      // Redirect to sign-in if accessing dashboard
      return await auth.protect();
    }
    return NextResponse.next();
  }

  // 4. Protected Route Optimization
  // We return NextResponse.next() immediately to allow Next.js to handle RSC delivery.
  // No blocking database calls here to ensure zero-latency routing.
  if (isProtectedRoute(req)) {
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
