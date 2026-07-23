import { NextResponse, type NextRequest } from "next/server";

/**
 * Gate the app behind login. Onboarding completeness is checked in the page
 * (needs the user file), so middleware only enforces "must be signed in".
 */
const PUBLIC = ["/login", "/_next", "/favicon"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const hasSession = req.cookies.has("jr_session");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
