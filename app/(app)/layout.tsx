import { redirect } from "next/navigation";
import { ClerkSignOut } from "@/components/auth/clerk-sign-out";
import { CookieSignOut } from "@/components/auth/cookie-sign-out";
import { Sidebar } from "@/components/sidebar/sidebar";
import { clerkEnabled, getSession } from "@/src/auth.ts";
import { loadSettings, onboardingComplete } from "@/src/settings.ts";
import { loadQueue } from "@/src/store.ts";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const settings = await loadSettings(session.userId);
  if (!onboardingComplete(settings)) redirect("/onboarding");

  const items = await loadQueue();
  const reviewCount = items.filter((i) => i.status === "pending_review").length;

  return (
    <div className="flex min-h-screen">
      <Sidebar reviewCount={reviewCount} onSignOut={clerkEnabled() ? <ClerkSignOut /> : <CookieSignOut />} />
      {children}
    </div>
  );
}
