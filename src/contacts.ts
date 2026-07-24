import { createHash } from "node:crypto";
import { searchPeopleHits } from "./adapters/people-search.ts";
import { triagePeople, draftNote, type Person } from "./people.ts";
import { loadQueue, log, upsert } from "./store.ts";
import type { QueueItem } from "./types.ts";

/**
 * Company contact discovery. When an application is auto-applied or approved,
 * this looks for managers / hiring / target-role people at that company so the
 * candidate can warm the application with a connection. The resulting people
 * always land as connection items in `pending_review` (notes never auto-send).
 *
 * Two backends, chosen at runtime:
 *  - Real: `searchPeopleHits` (Serper/Tavily) -> `triagePeople` -> `draftNote`.
 *  - Demo: a deterministic generator, so the flow works end-to-end without a
 *    search API key. Same output shape; only the source of the people differs.
 */

const CAP = 3;

export function hasSearchProvider(): boolean {
  return Boolean(process.env.SERPER_API_KEY || process.env.TAVILY_API_KEY);
}

// --- deterministic demo generator ---
const FIRST = ["Lucía", "Martín", "Sofía", "Nicolás", "Valentina", "Diego", "Camila", "Julián", "Florencia", "Tomás"];
const LAST = ["Fernández", "Gómez", "Ramírez", "Suárez", "Torres", "Molina", "Ibáñez", "Rossi", "Acuña", "Ledesma"];
const ROLE_POOL: Record<Person["relevance"], string[]> = {
  leadership: ["Head of Product", "VP of Product", "Engineering Manager", "Group Product Manager"],
  hiring: ["Talent Partner", "Technical Recruiter", "Talent Acquisition Lead"],
  product: ["Senior Product Manager", "Product Lead", "Principal PM"],
};
const RELEVANCE_ORDER: Person["relevance"][] = ["leadership", "hiring", "product"];

function seed(s: string): number {
  return parseInt(createHash("sha1").update(s).digest("hex").slice(0, 8), 16);
}

function hookFor(relevance: Person["relevance"], company: string): string {
  if (relevance === "leadership") return `Liderás producto en ${company}; vengo del lado técnico pivoteando a Product.`;
  if (relevance === "hiring") return `Manejás talento en ${company}; me interesa cómo arman el equipo de producto.`;
  return `Sos PM en ${company}; compartimos el interés en activación y métricas de producto.`;
}

/** Stable, API-free demo contacts for a company: one leadership, one hiring, one product. */
export function demoContactsForCompany(company: string): Person[] {
  const base = seed(company);
  return RELEVANCE_ORDER.map((relevance, i) => {
    const first = FIRST[(base + i * 7) % FIRST.length];
    const last = LAST[(base + i * 13) % LAST.length];
    const roles = ROLE_POOL[relevance];
    const role = roles[(base + i) % roles.length];
    const slug = `${first}-${last}-${((base + i) % 9973).toString(36)}`.toLowerCase();
    return {
      name: `${first} ${last}`,
      role,
      company,
      url: `https://www.linkedin.com/in/${slug}`,
      relevance,
      hook: hookFor(relevance, company),
    };
  });
}

/** Pre-written connection note for demo contacts (no LLM, no em-dashes, < 280). */
export function demoConnectionNote(p: Person): string {
  const first = p.name.split(" ")[0];
  const note = `Hola ${first}, ${p.hook} Me encantaría cruzar ideas sobre lo que hacen en ${p.company}.`;
  return note.length > 280 ? note.slice(0, 277) + "..." : note;
}

function idFor(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 10);
}

/**
 * Find and enqueue contacts for a company. Deduped per company (skips if
 * connection items for it already exist). Best-effort: callers should not let
 * failures here break the application flow.
 */
export async function discoverContactsForCompany(
  company: string,
  why: string,
): Promise<{ created: number; skipped?: string }> {
  const queue = await loadQueue();
  const already = queue.some(
    (i) => i.kind === "connection" && i.person?.company?.toLowerCase() === company.toLowerCase(),
  );
  if (already) return { created: 0, skipped: "already-searched" };
  const existingIds = new Set(queue.map((i) => i.id));

  let people: Person[];
  const notes = new Map<string, string>();
  if (hasSearchProvider()) {
    const hits = await searchPeopleHits(company);
    people = (await triagePeople(company, why, hits))
      .filter((p) => /linkedin\.com\/in\//.test(p.url))
      .slice(0, CAP);
    for (const p of people) notes.set(p.url, await draftNote(p));
  } else {
    people = demoContactsForCompany(company).slice(0, CAP);
    for (const p of people) notes.set(p.url, demoConnectionNote(p));
  }

  let created = 0;
  for (const p of people) {
    const id = idFor(p.url);
    if (existingIds.has(id)) continue;
    const item: QueueItem = {
      id,
      kind: "connection",
      status: "pending_review",
      person: { name: p.name, role: p.role, company: p.company, url: p.url },
      draft: notes.get(p.url) ?? "",
      history: [],
    };
    await upsert(log(item, `contacto en ${company} tras aplicar (${p.relevance})`));
    created += 1;
  }
  return { created };
}
