import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";
import { clerkAppearance } from "@/components/auth/clerk-appearance";
import { clerkEnabled } from "@/src/auth.ts";

export default function SignInPage() {
  // In cookie mode there is no Clerk sign-in; send users to the email login.
  if (!clerkEnabled()) redirect("/login");
  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Entrar</h1>
          <p className="text-sm text-muted-foreground">Bienvenido de nuevo a job-radar.</p>
        </div>
        <SignIn appearance={clerkAppearance} />
      </div>
    </AuthShell>
  );
}
