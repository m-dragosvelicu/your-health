import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./src/shared/server/auth";

// Security headers to add to all responses
const securityHeaders = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// Wrap the auth middleware to add security headers
export default auth((req) => {
  // Create response - either redirect for unauthenticated or continue
  let response: Response;

  // Check if this is a protected path that needs auth
  const isProtectedPath =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/api/private");

  if (isProtectedPath && !req.auth) {
    const url = new URL("/auth", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.href);
    response = Response.redirect(url);
  } else {
    response = NextResponse.next();
  }

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
});

// Apply middleware to all routes for security headers
// Auth checks only apply to protected paths (handled in the function above)
export const config = {
  matcher: [
    // Match all paths except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
