import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const typedPassword = String(formData.get("password") || "").trim();
  const correctPassword = String(process.env.APP_PASSWORD || "").trim();

  if (!correctPassword || typedPassword !== correctPassword) {
    return new NextResponse(
      `
      <html>
        <body>
          <p>Złe hasło. Wracam do logowania...</p>
          <script>
            setTimeout(() => {
              window.location.href = "/login";
            }, 500);
          </script>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }

  const response = new NextResponse(
    `
    <html>
      <body>
        <p>Logowanie poprawne...</p>
        <script>
          window.location.href = "/";
        </script>
      </body>
    </html>
    `,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    }
  );

  response.cookies.set("club_access", "ok", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
