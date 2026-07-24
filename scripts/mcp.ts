/**
 * job-radar MCP server (local, stdio transport).
 *
 * Exposes job-radar as tools so you can run the whole flow from your own Claude
 * (Desktop): search jobs, see the pipeline, approve/reject, and warm contacts.
 * No deploy, no OAuth: Claude Desktop launches this as a local process.
 *
 * Add to ~/Library/Application Support/Claude/claude_desktop_config.json:
 *   { "mcpServers": { "job-radar": {
 *       "command": "bun",
 *       "args": ["run", "<abs>/scripts/mcp.ts"] } } }
 *
 * IMPORTANT: on stdio, stdout is the JSON-RPC channel. Anything the app logs to
 * stdout (the engine uses console.log) would corrupt it, so we redirect
 * console.log to stderr before anything runs.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadQueue, findById, upsert, log } from "../src/store.ts";
import { loadSettings } from "../src/settings.ts";
import { listUserIds } from "../src/users.ts";
import { computeMetrics } from "../src/metrics.ts";
import { discoverContactsForCompany } from "../src/contacts.ts";
import { runEngine } from "../src/engine.ts";

// Keep stdout clean for the protocol; send all app logging to stderr.
console.log = (...args: unknown[]) => console.error(...args);

// Run from the project root and load .env, regardless of the launcher's cwd.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);
const envFile = join(ROOT, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || m[1] in process.env) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const STATUSES = ["pending_rank", "pending_review", "approved", "rejected", "sent", "discarded"] as const;

async function resolveUserId(): Promise<string | null> {
  if (process.env.JOB_RADAR_USER_ID) return process.env.JOB_RADAR_USER_ID;
  const ids = await listUserIds();
  return ids[0] ?? null;
}

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

const server = new McpServer({ name: "job-radar", version: "0.1.0" });

server.registerTool(
  "list_queue",
  {
    title: "Listar la cola",
    description:
      "Lista vacantes y conexiones de job-radar. Filtrá por estado o tipo. Útil para ver qué espera tu revisión.",
    inputSchema: {
      status: z.enum(STATUSES).optional().describe("Filtrar por estado"),
      kind: z.enum(["application", "connection"]).optional().describe("Filtrar por tipo"),
      limit: z.number().int().min(1).max(50).optional().describe("Máximo de items (default 20)"),
    },
  },
  async ({ status, kind, limit }) => {
    let items = await loadQueue();
    if (status) items = items.filter((i) => i.status === status);
    if (kind) items = items.filter((i) => i.kind === kind);
    items = items.slice(0, limit ?? 20);
    if (!items.length) return text("Sin items para ese filtro.");
    const lines = items.map((i) =>
      i.kind === "connection"
        ? `- [${i.id.slice(0, 8)}] conexión: ${i.person?.name} (${i.person?.role} @ ${i.person?.company}) · ${i.status}`
        : `- [${i.id.slice(0, 8)}] ${i.job?.title} @ ${i.job?.company} · match ${i.ranking?.score ?? "?"} · ${i.status}`,
    );
    return text(lines.join("\n"));
  },
);

server.registerTool(
  "pipeline_stats",
  {
    title: "Métricas del pipeline",
    description: "Resumen del pipeline: KPIs, embudo y distribución de match.",
    inputSchema: {},
  },
  async () => {
    const items = await loadQueue();
    const uid = await resolveUserId();
    const settings = uid ? await loadSettings(uid) : null;
    const m = computeMetrics(items, {
      autoApplyThreshold: settings?.autonomy.autoApplyThreshold ?? 80,
      reviewFloor: settings?.autonomy.reviewFloor ?? 55,
    });
    const kpis = m.kpis.map((k) => `${k.label}: ${k.value}`).join(" · ");
    const funnel = m.funnel.map((f) => `${f.label} ${f.count}`).join(" → ");
    const strong = m.distribution.bands.find((b) => b.key === "strong")?.count ?? 0;
    return text(`${kpis}\nEmbudo: ${funnel}\nAuto-aplicables: ${strong} de ${m.distribution.rankedTotal} rankeadas`);
  },
);

server.registerTool(
  "approve_application",
  {
    title: "Aprobar aplicación",
    description:
      "Aprueba una aplicación por id (acepta prefijo). Dispara la búsqueda de contactos (managers/hiring) en esa empresa.",
    inputSchema: { id: z.string().describe("id o prefijo del item") },
  },
  async ({ id }) => {
    const item = await findById(id);
    if (!item) return text(`No encontré el item ${id}.`);
    if (item.kind !== "application") return text("Ese item no es una aplicación (para conexiones, revisá la nota).");
    item.status = "approved";
    await upsert(log(item, "approved via MCP"));
    let extra = "";
    const uid = await resolveUserId();
    const settings = uid ? await loadSettings(uid) : null;
    const contactsEnabled = !settings?.disabledSources.includes("contacts");
    if (item.job && contactsEnabled) {
      try {
        const r = await discoverContactsForCompany(item.job.company, `Aprobaste ${item.job.title} en ${item.job.company}`);
        if (r.created) extra = ` Descubrí ${r.created} contactos en ${item.job.company}.`;
      } catch {
        /* best-effort */
      }
    }
    return text(`Aprobada: ${item.job?.title} @ ${item.job?.company}.${extra}`);
  },
);

server.registerTool(
  "reject_item",
  {
    title: "Rechazar item",
    description: "Rechaza una vacante o conexión por id (acepta prefijo).",
    inputSchema: { id: z.string().describe("id o prefijo del item") },
  },
  async ({ id }) => {
    const item = await findById(id);
    if (!item) return text(`No encontré el item ${id}.`);
    item.status = "rejected";
    await upsert(log(item, "rejected via MCP"));
    const what = item.kind === "connection" ? item.person?.name : `${item.job?.title} @ ${item.job?.company}`;
    return text(`Rechazada: ${what}.`);
  },
);

server.registerTool(
  "run_engine",
  {
    title: "Correr el motor",
    description:
      "Escanea los boards ATS configurados, rankea las vacantes nuevas con IA y las rutea. Por defecto en dry-run (no envía aplicaciones reales).",
    inputSchema: {
      live: z.boolean().optional().describe("true para enviar de verdad (default false = dry-run)"),
      maxPerRun: z.number().int().min(1).max(20).optional().describe("Máximo a procesar por corrida (default 8)"),
    },
  },
  async ({ live, maxPerRun }) => {
    const uid = await resolveUserId();
    if (!uid) return text("No hay usuario configurado. Completá el onboarding en la app o seteá JOB_RADAR_USER_ID.");
    const r = await runEngine(uid, { live: live ?? false, maxPerRun: maxPerRun ?? 8 });
    return text(
      `Corrida: ${r.scanned} escaneadas, ${r.ranked} rankeadas, ${r.autoApplied} auto-apply${live ? "" : " (dry-run)"}, ${r.queued} a revisión, ${r.discarded} descartadas.`,
    );
  },
);

await server.connect(new StdioServerTransport());
console.error("job-radar MCP server listo (stdio).");
