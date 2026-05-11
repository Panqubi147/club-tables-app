import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword || password !== appPassword) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);

  response.cookies.set("club_access", "ok", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
