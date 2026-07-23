import { cookies } from "next/headers";

/**
 * Auth in two modes:
 *  - Clerk mode (when CLERK keys are set): real auth via @clerk/nextjs.
 *  - Cookie mode (fallback): a minimal cookie session so the app runs in dev
 *    before Clerk keys are provisioned.
 *
 * Callers only depend on getSession() -> { userId, email }. When you paste the
 * Clerk keys into .env, everything switches over with no code changes.
 */
const COOKIE = "jr_session";

export interface Session {
  userId: string;
  email: string;
}

export function clerkEnabled(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export async function getSession(): Promise<Session | null> {
  if (clerkEnabled()) {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return null;
    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress ??
      "";
    return { userId, email };
  }

  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as Session;
  } catch {
    return null;
  }
}

// --- Cookie-mode only helpers (no-ops under Clerk, which owns sign in/out) ---

export async function signIn(email: string): Promise<Session> {
  const session: Session = {
    userId: email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase() || "me",
    email,
  };
  const store = await cookies();
  store.set(COOKIE, Buffer.from(JSON.stringify(session)).toString("base64"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return session;
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
