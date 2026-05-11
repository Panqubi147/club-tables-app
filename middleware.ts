import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const password = process.env.APP_PASSWORD;

  if (!password) {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/login") ||
    path.startsWith("/api/login") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const access = request.cookies.get("club_access")?.value;

  if (access === "ok") {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
