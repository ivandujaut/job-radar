"use client";

import { useState } from "react";
import { useUser, useReverification } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

/**
 * One-click LinkedIn connect via Clerk account-linking (OAuth). Works even for
 * users who signed up another way: this links a LinkedIn identity to the
 * current account and imports the profile. No forms, no keys.
 *
 * Requires LinkedIn (OIDC) enabled as a social connection in the Clerk
 * dashboard; if it is not, the connect call fails and we show a soft message.
 *
 * Linking an external account is a protected action, so Clerk may require
 * session reverification (step-up) first, returning `session_reverification_required`.
 * We wrap the call with `useReverification`, which detects that, shows Clerk's
 * reverification UI, and retries the call once the user verifies.
 */
export function LinkedInConnect() {
  const { user, isLoaded } = useUser();
  const createExternalAccount = useReverification(
    (params: Parameters<NonNullable<typeof user>["createExternalAccount"]>[0]) =>
      user!.createExternalAccount(params),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (!isLoaded) return <span className="text-xs text-muted-foreground">Cargando…</span>;

  const linked = user?.externalAccounts?.find((a) => /linkedin/i.test(a.provider));
  if (linked) {
    const who = linked.firstName ? `${linked.firstName} ${linked.lastName ?? ""}`.trim() : "tu cuenta";
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={2} aria-hidden />
        Conectado con {who}
      </span>
    );
  }

  async function connect() {
    if (!user) return;
    setBusy(true);
    setError(false);
    try {
      const account = await createExternalAccount({
        strategy: "oauth_linkedin_oidc",
        redirectUrl: window.location.href,
      });
      const url = account.verification?.externalVerificationRedirectURL;
      if (url) {
        window.location.href = url.toString();
        return;
      }
      setError(true);
      setBusy(false);
    } catch {
      // Includes the user cancelling the reverification step.
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={connect} disabled={busy}>
        {busy ? "Conectando…" : "Conectar LinkedIn"}
      </Button>
      {error && <p className="text-xs text-destructive">No se pudo conectar. Probá de nuevo.</p>}
    </div>
  );
}
