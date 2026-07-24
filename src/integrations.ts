import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

/**
 * User-facing integration catalog. This screen is about what the *user* connects
 * to make the agent work for them (job sources, their LinkedIn, their own AI),
 * not the app's own infrastructure. Auth (Clerk) and the database (Supabase) are
 * plumbing the user never wires, so they live in a small system-status line.
 *
 * Connecting is a one-click action (OAuth / open-in-Claude), never a list of
 * setup steps. "connected" is computed from real config/env so it never lies.
 */

export type IntegrationStatus = "connected" | "available" | "soon";
export type IntegrationIcon = "linkedin" | "board" | "search" | "ai";
export type IntegrationAction = "linkedin" | "claude";

export interface Integration {
  key: string;
  name: string;
  category: string;
  /** Benefit-led one-liner: what it does FOR the user. */
  blurb: string;
  status: IntegrationStatus;
  icon: IntegrationIcon;
  /** Shown when connected (e.g. "2 tableros configurados"). */
  detail?: string;
  /** A real one-click connect action, rendered as a button. */
  action?: IntegrationAction;
  /** Ready-to-paste Claude Desktop config for the MCP action. */
  mcpConfig?: string;
  /** Highlighted as a recommended next step. */
  featured?: boolean;
  /** Action label. */
  cta?: string;
}

export const INTEGRATION_CATEGORIES = [
  "Fuentes de vacantes",
  "Perfil y contactos",
  "Tu IA",
] as const;

function has(key: string): boolean {
  return Boolean(process.env[key]);
}

function atsBoardCount(provider: string): number {
  try {
    const cfg = parse(readFileSync(join(process.cwd(), "config", "ats-boards.yaml"), "utf8")) as Record<
      string,
      { token: string }[]
    >;
    return Array.isArray(cfg[provider]) ? cfg[provider].length : 0;
  } catch {
    return 0;
  }
}

function atsSource(name: string, provider: string): Integration {
  const n = atsBoardCount(provider);
  return {
    key: provider,
    name,
    category: "Fuentes de vacantes",
    icon: "board",
    blurb: `Traé vacantes de ${name} y auto-aplicá a las que superan tu umbral de match.`,
    status: n > 0 ? "connected" : "available",
    detail: n > 0 ? `${n} ${n === 1 ? "tablero configurado" : "tableros configurados"}` : undefined,
  };
}

export function getIntegrations(): Integration[] {
  const contactsConnected = has("SERPER_API_KEY") || has("TAVILY_API_KEY");

  return [
    atsSource("Greenhouse", "greenhouse"),
    atsSource("Lever", "lever"),
    atsSource("Ashby", "ashby"),
    {
      key: "workable",
      name: "Workable",
      category: "Fuentes de vacantes",
      icon: "board",
      status: "soon",
      blurb: "Sumá vacantes de las miles de empresas que reclutan con Workable.",
    },
    {
      key: "adzuna",
      name: "Adzuna",
      category: "Fuentes de vacantes",
      icon: "board",
      status: "soon",
      blurb: "Ampliá la búsqueda más allá de los ATS con un agregador de vacantes.",
    },

    {
      key: "linkedin",
      name: "LinkedIn",
      category: "Perfil y contactos",
      icon: "linkedin",
      status: "available",
      action: "linkedin",
      featured: true,
      blurb:
        "Conectá tu LinkedIn con un clic (aunque te registraste con otro método) e importá tu perfil para afinar el match.",
    },
    {
      key: "contacts",
      name: "Buscador de contactos",
      category: "Perfil y contactos",
      icon: "search",
      status: contactsConnected ? "connected" : "available",
      blurb: "El agente encuentra managers y hiring en las empresas donde aplicás para entibiar tu perfil.",
      detail: contactsConnected ? "Proveedor de búsqueda activo" : undefined,
    },

    {
      key: "claude-mcp",
      name: "Conectá tu Claude",
      category: "Tu IA",
      icon: "ai",
      status: "available",
      action: "claude",
      featured: true,
      blurb:
        "Sumá job-radar a tu Claude Desktop como conector MCP: buscá vacantes, revisá y aprobá desde tu propio Claude, sin API keys. Copiá la config, pegala en Claude Desktop y reiniciá.",
      mcpConfig: JSON.stringify(
        {
          mcpServers: {
            "job-radar": { command: "bun", args: ["run", join(process.cwd(), "scripts", "mcp.ts")] },
          },
        },
        null,
        2,
      ),
    },
  ];
}

export interface SystemStatus {
  auth: boolean;
  db: boolean;
  ai: boolean;
}

/** Infra health for the muted footer. Not user-connectable, just honest status. */
export function getSystemStatus(): SystemStatus {
  return {
    auth: has("CLERK_SECRET_KEY"),
    db: Boolean(
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    ai: has("ANTHROPIC_API_KEY"),
  };
}
