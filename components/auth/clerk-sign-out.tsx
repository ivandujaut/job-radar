"use client";

import { useClerk } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";

export function ClerkSignOut() {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      title="Salir"
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <HugeiconsIcon icon={Logout01Icon} size={20} strokeWidth={1.8} aria-hidden />
      <span>Salir</span>
    </button>
  );
}
