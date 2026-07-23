import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { clerkEnabled } from "@/src/auth.ts";

export default function SignUpPage() {
  if (!clerkEnabled()) redirect("/login");
  return (
    <AuthShell>
      <SignUpForm />
    </AuthShell>
  );
}
