import { NextResponse, type NextRequest } from "next/server";

import { isLegacyAdminPath } from "@/lib/security/legacy-admin";

export function proxy(request: NextRequest) {
  if (isLegacyAdminPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin.html", "/en/admin/:path*", "/en/admin.html"],
};
