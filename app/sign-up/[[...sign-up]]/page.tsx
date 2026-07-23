import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";
import { clerkAppearance } from "@/components/auth/clerk-appearance";
import { clerkEnabled } from "@/src/auth.ts";

export default function SignUpPage() {
  if (!clerkEnabled()) redirect("/login");
  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">
            Empezá a delegar tu búsqueda a tus agentes.
          </p>
        </div>
        <SignUp appearance={clerkAppearance} />
      </div>
    </AuthShell>
  );
}
