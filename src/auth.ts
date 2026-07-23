import { cookies } from "next/headers";

/**
 * Minimal cookie session. This is a deliberate placeholder for a real provider
 * (NextAuth + Google) so the onboarding and dashboard flows can be built and
 * tested now. Swap `getSession`/`signIn` for NextAuth without touching callers:
 * they only depend on { userId, email }.
 */
const COOKIE = "jr_session";

export interface Session {
  userId: string;
  email: string;
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as Session;
  } catch {
    return null;
  }
}

export async function signIn(email: string): Promise<Session> {
  const session: Session = {
    // Deterministic id from email until real auth: keeps one user file stable.
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
