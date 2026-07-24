import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

/**
 * Integration catalog with live status. "connected" is computed from real
 * config/env so the screen never lies about what is actually wired:
 *  - ATS sources: connected when config/ats-boards.yaml has boards for them.
 *  - Providers (Anthropic, Clerk, Supabase, Serper, Tavily): connected when
 *    their env keys are present.
 *  - LinkedIn / Workable / Adzuna: on the roadmap ("soon").
 */

export type IntegrationStatus = "connected" | "available" | "soon";
export type IntegrationIcon = "linkedin" | "board" | "search" | "ai" | "db" | "auth";

export interface Integration {
  key: string;
  name: string;
  category: string;
  description: string;
  status: IntegrationStatus;
  icon: IntegrationIcon;
  /** Shown when connected (e.g. "2 tableros configurados"). */
  detail?: string;
  /** Shown behind a "Conectar" toggle when available or on the roadmap. */
  steps?: string[];
}

export const INTEGRATION_CATEGORIES = [
  "Fuentes de vacantes",
  "Identidad y perfil",
  "Búsqueda de contactos",
  "IA y datos",
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
    description: `Importá y auto-aplicá en tableros de ${name}.`,
    status: n > 0 ? "connected" : "available",
    detail: n > 0 ? `${n} ${n === 1 ? "tablero configurado" : "tableros configurados"}` : undefined,
    steps:
      n > 0
        ? undefined
        : [`Agregá tokens de ${name} en config/ats-boards.yaml`, "Corré el motor para importar vacantes"],
  };
}

export function getIntegrations(): Integration[] {
  const supabase = Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

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
      description: "API pública de vacantes de empresas que reclutan con Workable.",
    },
    {
      key: "adzuna",
      name: "Adzuna",
      category: "Fuentes de vacantes",
      icon: "board",
      status: "soon",
      description: "Agregador de vacantes con API para ampliar la búsqueda más allá de los ATS.",
    },
    {
      key: "linkedin",
      name: "LinkedIn",
      category: "Identidad y perfil",
      icon: "linkedin",
      status: "soon",
      description:
        "LinkedIn no expone API pública para buscar vacantes o gente ni enviar invitaciones. Lo viable: importar tu perfil y enviar invitaciones con revisión humana.",
      steps: [
        "Sign in with LinkedIn (OAuth) para traer tu headline y datos al perfil",
        "Extensión de navegador para enviar invitaciones con vos en el loop",
        "El agente de contactos ya descubre perfiles vía buscadores públicos (compliant)",
      ],
    },
    {
      key: "clerk",
      name: "Clerk",
      category: "Identidad y perfil",
      icon: "auth",
      status: has("CLERK_SECRET_KEY") ? "connected" : "available",
      description: "Autenticación de usuarios y manejo de sesión.",
      detail: has("CLERK_SECRET_KEY") ? "Autenticación activa" : undefined,
      steps: has("CLERK_SECRET_KEY")
        ? undefined
        : ["Creá una app en clerk.com", "Agregá las claves de Clerk en .env"],
    },
    {
      key: "serper",
      name: "Serper",
      category: "Búsqueda de contactos",
      icon: "search",
      status: has("SERPER_API_KEY") ? "connected" : "available",
      description: "Búsqueda de perfiles públicos de LinkedIn que alimenta al agente de contactos.",
      steps: has("SERPER_API_KEY")
        ? undefined
        : ["Creá una cuenta en serper.dev", "Copiá tu API key", "Agregá SERPER_API_KEY en .env", "Reiniciá el server"],
    },
    {
      key: "tavily",
      name: "Tavily",
      category: "Búsqueda de contactos",
      icon: "search",
      status: has("TAVILY_API_KEY") ? "connected" : "available",
      description: "Alternativa de búsqueda web para descubrir contactos en una empresa.",
      steps: has("TAVILY_API_KEY")
        ? undefined
        : ["Creá una cuenta en tavily.com", "Copiá tu API key", "Agregá TAVILY_API_KEY en .env", "Reiniciá el server"],
    },
    {
      key: "anthropic",
      name: "Anthropic (Claude)",
      category: "IA y datos",
      icon: "ai",
      status: has("ANTHROPIC_API_KEY") ? "connected" : "available",
      description: "Rankea el match de cada vacante y redacta las notas de conexión.",
      detail: has("ANTHROPIC_API_KEY") ? "Claude Sonnet activo" : undefined,
      steps: has("ANTHROPIC_API_KEY")
        ? undefined
        : ["Obtené una API key en console.anthropic.com", "Agregá ANTHROPIC_API_KEY en .env"],
    },
    {
      key: "supabase",
      name: "Supabase",
      category: "IA y datos",
      icon: "db",
      status: supabase ? "connected" : "available",
      description: "Base de datos del pipeline: vacantes, conexiones y decisiones.",
      detail: supabase ? "Postgres conectado" : undefined,
      steps: supabase
        ? undefined
        : ["Creá un proyecto en supabase.com", "Agregá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env"],
    },
  ];
}
