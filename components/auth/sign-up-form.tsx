"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { useSignUp } from "@clerk/nextjs/legacy";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/auth/spinner";

/**
 * Custom sign-up on Clerk's legacy hooks, gated behind <ClerkLoaded> to avoid
 * the hook-order error. Two steps: details -> email OTP.
 */
export function SignUpForm() {
  return (
    <div className="space-y-6">
      <ClerkLoading>
        <Spinner />
      </ClerkLoading>
      <ClerkLoaded>
        <SignUpFields />
      </ClerkLoaded>
    </div>
  );
}

function SignUpFields() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("otp");
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setLoading(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.push("/onboarding");
      } else {
        setError("Código incorrecto o incompleto.");
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setLoading(false);
    }
  }

  const oauth = (strategy: "oauth_google" | "oauth_linkedin_oidc") =>
    signUp?.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/onboarding",
    });

  if (step === "otp") {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Verificá tu email</h1>
          <p className="text-sm text-muted-foreground">
            Te enviamos un código de un solo uso a {email}.
          </p>
        </div>
        <form onSubmit={onVerify} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Código</Label>
            <Input id="code" inputMode="numeric" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verificando..." : "Crear cuenta"}
          </Button>
          <button type="button" onClick={() => setStep("details")} className="text-sm text-muted-foreground underline underline-offset-4">
            Volver
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">Empezá a delegar tu búsqueda a tus agentes.</p>
      </div>
      <SocialButtons authenticate={oauth} />
      <form onSubmit={onDetails} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
        </div>
        {/* Clerk bot protection mounts here when enabled. */}
        <div id="clerk-captcha" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enviando código..." : "Continuar"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4">
          Entrá
        </Link>
      </p>
    </div>
  );
}

function clerkError(err: unknown): string {
  const e = err as { errors?: { message?: string }[] };
  return e?.errors?.[0]?.message ?? "Algo salió mal. Revisá los datos.";
}
