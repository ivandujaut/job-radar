import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { clerkEnabled } from "@/src/auth.ts";

export default function SignInPage() {
  // In cookie mode there is no Clerk sign-in; send users to the email login.
  if (!clerkEnabled()) redirect("/login");
  return (
    <AuthShell>
      <SignInForm />
    </AuthShell>
  );
}
