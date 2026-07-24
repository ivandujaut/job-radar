/**
 * Seed the local queue with realistic demo data so the dashboard and review
 * queue look populated for screenshots. This writes DEMO data: it is a dev
 * convenience, not real applications. The existing queue file is backed up to
 * `data/queue.jsonl.bak` first.
 *
 * Run: bun run seed        (aborts if the queue already has data)
 *      bun run seed --force (overwrites after backing up)
 *
 * Data is generated from a fixed seed, so re-running yields the same set.
 */
import { existsSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { clearQueue, saveQueue } from "../src/store.ts";
import { demoContactsForCompany, demoConnectionNote } from "../src/contacts.ts";
import type { JobSource, QueueItem, QueueStatus } from "../src/types.ts";

// --- deterministic PRNG (mulberry32) ---
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260723);
const pick = <T>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];
const between = (lo: number, hi: number) => Math.floor(rand() * (hi - lo + 1)) + lo;

const COMPANIES: { name: string; source: JobSource }[] = [
  { name: "Mercado Libre", source: "greenhouse" },
  { name: "Ualá", source: "lever" },
  { name: "Nubank", source: "greenhouse" },
  { name: "dLocal", source: "ashby" },
  { name: "Pomelo", source: "lever" },
  { name: "Satellogic", source: "greenhouse" },
  { name: "Cashea", source: "ashby" },
  { name: "Belo", source: "lever" },
  { name: "Cromodata", source: "greenhouse" },
  { name: "NotCo", source: "greenhouse" },
  { name: "Rappi", source: "greenhouse" },
  { name: "Kavak", source: "lever" },
  { name: "Tiendanube", source: "ashby" },
  { name: "Bitso", source: "greenhouse" },
  { name: "Lemon", source: "lever" },
];

const ROLES = [
  "Product Manager",
  "Associate Product Manager",
  "Growth PM",
  "Technical Product Manager",
  "Product Analyst",
  "Senior PM, Payments",
  "PM, Onboarding",
  "Product Operations Manager",
];

const LOCATIONS = [
  "Remoto, LATAM",
  "Buenos Aires, Argentina",
  "Remoto, Argentina",
  "Montevideo, Uruguay",
  "São Paulo, Brasil (remoto)",
  "Ciudad de México (remoto)",
];

const REASONS = [
  "Match fuerte de seniority y dominio del rubro.",
  "El candidato lista este rol como target explícito.",
  "Background de bioingeniería aporta criterio de producto técnico.",
  "Experiencia previa construyendo bots de venta asistida.",
  "Foco en activación y métricas de retención temprana.",
  "SQL y análisis estadístico sólidos para product analytics.",
  "Conocimiento de flujos de pago y ATS.",
];
const WARNINGS = [
  "La vacante menciona inglés fluido; el candidato tiene A2.",
  "Seniority en el límite superior del rango.",
  "Posible requisito de portugués.",
];

const now = Date.now();
const DAY = 86_400_000;

function iso(offsetDaysAgo: number, hour: number): string {
  const d = new Date(now - offsetDaysAgo * DAY);
  d.setHours(hour, between(0, 59), 0, 0);
  return d.toISOString();
}

function scoreFor(status: QueueStatus): number {
  switch (status) {
    case "sent":
      return between(80, 95);
    case "approved":
      return between(78, 92);
    case "pending_review":
      return between(56, 88);
    case "rejected":
      return between(42, 70);
    case "discarded":
      return between(25, 54);
    default:
      return 0;
  }
}

function makeApplication(i: number, status: QueueStatus): QueueItem {
  const { name: company, source } = pick(COMPANIES);
  const title = pick(ROLES);
  const location = pick(LOCATIONS);
  const discoveredDaysAgo = between(1, 29);
  const discoveredAt = iso(discoveredDaysAgo, between(8, 19));
  const id = `seed-app-${i}-${Math.floor(rand() * 1e6).toString(36)}`;

  const history: QueueItem["history"] = [{ at: discoveredAt, event: `discovered via ${source}` }];
  const ranked = status !== "pending_rank";
  const score = ranked ? scoreFor(status) : 0;
  if (ranked) {
    history.push({ at: iso(discoveredDaysAgo, between(19, 22)), event: `ranked ${score}` });
  }
  if (["approved", "sent", "rejected", "discarded"].includes(status)) {
    const decideDaysAgo = Math.max(0, discoveredDaysAgo - between(1, 6));
    history.push({ at: iso(decideDaysAgo, between(9, 20)), event: status });
  }

  const reasons = [pick(REASONS)];
  if (rand() > 0.5) reasons.push(pick(REASONS.filter((r) => r !== reasons[0])));
  const warnings = score > 0 && score < 80 && rand() > 0.5 ? [pick(WARNINGS)] : [];

  return {
    id,
    kind: "application",
    status,
    job: {
      id,
      source,
      url: "https://example.com/job",
      title,
      company,
      location,
      discoveredAt,
      description: "Rol de producto en una empresa de tecnología de LATAM.",
    },
    ranking: ranked ? { score, reasons, warnings } : undefined,
    history,
  };
}

/**
 * Contacts discovered because we applied to a company. Mirrors the real
 * discoverContactsForCompany() output so the seeded state shows the link
 * between an approved/sent application and the contacts it warms.
 */
function contactsForCompany(company: string, perCompany: number): QueueItem[] {
  return demoContactsForCompany(company)
    .slice(0, perCompany)
    .map((p) => {
      const id = createHash("sha1").update(p.url).digest("hex").slice(0, 10);
      const daysAgo = between(1, 18);
      const at = iso(daysAgo, between(9, 18));
      return {
        id,
        kind: "connection",
        status: "pending_review",
        person: { name: p.name, role: p.role, company: p.company, url: p.url },
        draft: demoConnectionNote(p),
        history: [{ at, event: `contacto en ${company} tras aplicar (${p.relevance})` }],
      };
    });
}

// Status mix, tuned so the review queue and every widget have content.
const MIX: QueueStatus[] = [
  ...Array(8).fill("sent"),
  ...Array(7).fill("approved"),
  ...Array(9).fill("pending_review"),
  ...Array(3).fill("pending_rank"),
  ...Array(9).fill("discarded"),
  ...Array(5).fill("rejected"),
];

const items: QueueItem[] = MIX.map((status, i) => makeApplication(i, status as QueueStatus));

// Warm contacts for the companies we applied to (approved or sent), deduped by
// company, so the connection queue reflects the "apply -> find contacts" flow.
const warmCompanies = [
  ...new Set(
    items
      .filter((i) => i.kind === "application" && ["approved", "sent"].includes(i.status) && i.job)
      .map((i) => i.job!.company),
  ),
].slice(0, 3);
const seen = new Set(items.map((i) => i.id));
for (const company of warmCompanies) {
  for (const conn of contactsForCompany(company, 2)) {
    if (seen.has(conn.id)) continue;
    seen.add(conn.id);
    items.push(conn);
  }
}

async function main() {
  const force = process.argv.includes("--force");
  const file = join(process.cwd(), "data", "queue.jsonl");
  if (existsSync(file) && !force) {
    console.error("data/queue.jsonl already exists. Re-run with --force to overwrite (a .bak is kept).");
    process.exit(1);
  }
  if (existsSync(file)) {
    copyFileSync(file, `${file}.bak`);
    console.log(`Backed up existing queue to ${file}.bak`);
  }
  await clearQueue();
  await saveQueue(items);
  console.log(`Seeded ${items.length} demo items (queue cleared first).`);
}

main();
