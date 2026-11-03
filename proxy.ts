import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic, cookie-only gate. Real authorization happens server-side in
 * `requireUser` / `requireAdmin` and again in every API route, so this proxy
 * only avoids flashing a protected shell for signed-out visitors.
 */
export function proxy(request: NextRequest) {
  const hasSession = Boolean(
    request.cookies.get("authjs.session-token")?.value ??
      request.cookies.get("__Secure-authjs.session-token")?.value
  );

  if (hasSession) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/chat/:path*", "/dashboard/:path*", "/admin/:path*"],
};
