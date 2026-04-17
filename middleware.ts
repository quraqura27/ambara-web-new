import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Simplified middleware for production stability.
 * Clerk auth is handled at the page/layout level instead.
 * This middleware only handles public route pass-through.
 */
export default function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
