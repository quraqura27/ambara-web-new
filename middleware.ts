import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/customers", "/shipments"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.redirect(new URL("/admin.html", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/customers/:path*", "/shipments/:path*"],
};
