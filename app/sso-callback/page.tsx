"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/** Lands the OAuth redirect (Google / LinkedIn) and completes the Clerk flow. */
export default function SSOCallback() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <p className="text-sm text-muted-foreground">Completando el ingreso...</p>
      <AuthenticateWithRedirectCallback />
    </main>
  );
}
