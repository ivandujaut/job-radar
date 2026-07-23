import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";
import { clerkEnabled } from "@/src/auth.ts";

export default function SignUpPage() {
  if (!clerkEnabled()) redirect("/login");
  return (
    <AuthShell>
      <SignUp appearance={{ elements: { rootBox: "w-full", card: "shadow-none border border-border" } }} />
    </AuthShell>
  );
}
