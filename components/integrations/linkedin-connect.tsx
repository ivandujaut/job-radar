"use client";

import { useState } from "react";
import { useUser, useReverification } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

/**
 * Connect / disconnect LinkedIn via Clerk account-linking (OAuth). Works even
 * for users who signed up another way: connecting links a LinkedIn identity to
 * the current account and imports the profile; disconnecting unlinks it. No
 * forms, no keys.
 *
 * Requires LinkedIn (OIDC) enabled as a social connection in the Clerk
 * dashboard; if it is not, the connect call fails and we show a soft message.
 *
 * Linking and unlinking an external account are protected actions, so Clerk may
 * require session reverification (step-up) first, returning
 * `session_reverification_required`. We wrap both calls with `useReverification`,
 * which detects that, shows Clerk's reverification UI, and retries once the user
 * verifies.
 */
export function LinkedInConnect() {
  const { user, isLoaded } = useUser();
  const createExternalAccount = useReverification(
    (params: Parameters<NonNullable<typeof user>["createExternalAccount"]>[0]) =>
      user!.createExternalAccount(params),
  );
  const removeAccount = useReverification((account: { destroy: () => Promise<unknown> }) =>
    account.destroy(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) return <span className="text-xs text-muted-foreground">Cargando…</span>;

  const linked = user?.externalAccounts?.find((a) => /linkedin/i.test(a.provider));

  async function connect() {
    if (!user) return;
    setBusy(true);
    setError(null);
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
      setError("No se pudo conectar. Probá de nuevo.");
      setBusy(false);
    } catch {
      // Includes the user cancelling the reverification step.
      setError("No se pudo conectar. Probá de nuevo.");
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!linked) return;
    setBusy(true);
    setError(null);
    try {
      await removeAccount(linked);
      await user?.reload();
    } catch {
      setError("No se pudo desconectar. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  if (linked) {
    const who = linked.firstName ? `${linked.firstName} ${linked.lastName ?? ""}`.trim() : "tu cuenta";
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={2} aria-hidden />
            Conectado con {who}
          </span>
          <Button size="sm" variant="ghost" onClick={disconnect} disabled={busy}>
            {busy ? "Desconectando…" : "Desconectar"}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={connect} disabled={busy}>
        {busy ? "Conectando…" : "Conectar LinkedIn"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
