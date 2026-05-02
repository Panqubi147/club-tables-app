import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function makeToken(password: string) {
  return crypto
    .createHmac("sha256", password)
    .update("club-access")
    .digest("hex");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword || password !== appPassword) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.redirect(new URL("/", request.url));

  response.cookies.set("club_access", makeToken(appPassword), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
