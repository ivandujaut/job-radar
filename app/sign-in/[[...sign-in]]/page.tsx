import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";
import { clerkEnabled } from "@/src/auth.ts";

export default function SignInPage() {
  // In cookie mode there is no Clerk sign-in; send users to the email login.
  if (!clerkEnabled()) redirect("/login");
  return (
    <AuthShell>
      <SignIn appearance={{ elements: { rootBox: "w-full", card: "shadow-none border border-border" } }} />
    </AuthShell>
  );
}
