import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const CLERK_ENABLED = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

const isPublic = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/login"]);

// Clerk mode: protect everything except sign-in/up. Onboarding completeness is
// still enforced in the page (it needs the user's settings file).
const clerk = clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
});

// Cookie mode: only enforce "must have a session cookie".
const COOKIE_PUBLIC = ["/login", "/_next", "/favicon"];
function cookieMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (COOKIE_PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!req.cookies.has("jr_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export default CLERK_ENABLED ? clerk : cookieMiddleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
