import { auth } from "./src/server/auth";

export default auth((req) => {
  // If there is no active session on a protected path → redirect to /auth
  if (!req.auth) {
    const url = new URL("/auth", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.href);
    return Response.redirect(url);
  }
});

// Tell Next.js which paths are protected by this middleware
export const config = {
  matcher: [
    "/app/:path*",        // example: future app dashboard
    "/me/:path*",         // example: profile/settings
    "/uploads/:path*",    // example: file uploads
    "/api/private/:path*",// example: private API endpoints
  ],
};
