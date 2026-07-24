"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

/**
 * Connects job-radar to Claude Desktop via a local MCP server. There is no
 * cross-app OAuth for this: the connection lives in Claude's config. So the
 * best one-click UX is to hand the user the exact config, ready to paste.
 */
export function ClaudeConnect({ config }: { config: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(config);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; user can still read the config in the app logs */
    }
  }

  return (
    <Button size="sm" onClick={copy}>
      {copied ? (
        <>
          Copiado
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={2} aria-hidden />
        </>
      ) : (
        <>
          Copiar config de Claude
          <HugeiconsIcon icon={Copy01Icon} size={14} strokeWidth={2} aria-hidden />
        </>
      )}
    </Button>
  );
}
