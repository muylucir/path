import { auth, authConfigured } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public paths that don't require authentication
  const isPublicPath =
    pathname.startsWith("/intro") ||
    pathname.startsWith("/guide") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/auth");

  if (isPublicPath) {
    return NextResponse.next();
  }

  // If auth is not configured (pre-Cognito deployment), allow all requests
  if (!authConfigured) {
    return NextResponse.next();
  }

  // If not authenticated
  if (!req.auth) {
    // API requests get 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    // Page requests redirect to signin (which triggers Cognito Managed Login)
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher:
    "/((?!intro|guide|auth|api/health|api/auth|_next/static|_next/image|favicon\\.ico|.*\\.woff2$).*)",
};
