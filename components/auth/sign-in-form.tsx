"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { useSignIn } from "@clerk/nextjs/legacy";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/auth/spinner";

/**
 * Custom sign-in on Clerk's legacy hooks. The hooks are mounted only inside
 * <ClerkLoaded>, so useSignIn never renders during Clerk's not-loaded state —
 * that transition is what triggered the React hook-order error before.
 */
export function SignInForm() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-muted-foreground">Bienvenido de nuevo a job-radar.</p>
      </div>
      <ClerkLoading>
        <Spinner />
      </ClerkLoading>
      <ClerkLoaded>
        <SignInFields />
      </ClerkLoaded>
    </div>
  );
}

function SignInFields() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const res = await signIn.create({ identifier: email, password });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.push("/");
      } else {
        setError("No se pudo completar el ingreso.");
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setLoading(false);
    }
  }

  const oauth = (strategy: "oauth_google" | "oauth_linkedin_oidc") =>
    signIn?.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/",
    });

  return (
    <div className="space-y-6">
      <SocialButtons authenticate={oauth} />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        ¿No tenés cuenta?{" "}
        <Link href="/sign-up" className="font-medium text-foreground underline underline-offset-4">
          Creá una
        </Link>
      </p>
    </div>
  );
}

function clerkError(err: unknown): string {
  const e = err as { errors?: { message?: string }[] };
  return e?.errors?.[0]?.message ?? "Credenciales inválidas.";
}
