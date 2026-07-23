/**
 * Auth via Clerk (@clerk/nextjs). Callers depend only on getSession() ->
 * { userId, email } | null.
 */
export interface Session {
  userId: string;
  email: string;
}

export async function getSession(): Promise<Session | null> {
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
