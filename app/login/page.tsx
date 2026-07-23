import { redirect } from "next/navigation";
import { loginAction } from "@/app/auth-actions";
import { clerkEnabled } from "@/src/auth.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // When Clerk is configured, it owns the sign-in UI.
  if (clerkEnabled()) redirect("/sign-in");

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Entrar a job-radar</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tus agentes buscan y aplican en segundo plano. Vos solo aprobás notas.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" disabled>
            Continuar con Google
            <span className="ml-2 text-xs text-muted-foreground">(pronto)</span>
          </Button>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">o</span>
            <Separator className="flex-1" />
          </div>
          <form action={loginAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="vos@email.com" required />
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
          <ErrorNote searchParams={searchParams} />
        </CardContent>
      </Card>
    </main>
  );
}

async function ErrorNote({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) return null;
  return <p className="text-sm text-destructive">Ingresá un email válido.</p>;
}
