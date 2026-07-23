import { createHash } from "node:crypto";
import type { Job } from "../types.ts";

/**
 * Greenhouse public job boards. Unlike LinkedIn, these are meant to be read
 * and applied to programmatically: every company on Greenhouse exposes a
 * public JSON board at boards-api.greenhouse.io, and the application endpoint
 * accepts POSTs. This is the legitimate 24/7 auto-apply path (Arquitectura C)
 * that never touches a LinkedIn account.
 *
 * board token = the company slug in its careers URL
 * (e.g. boards.greenhouse.io/stripe -> "stripe").
 */
const API = "https://boards-api.greenhouse.io/v1/boards";

interface GhJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at: string;
  location: { name: string };
  content?: string;
}

export async function fetchGreenhouseJobs(boardToken: string): Promise<Job[]> {
  const res = await fetch(`${API}/${boardToken}/jobs?content=true`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`greenhouse ${boardToken}: HTTP ${res.status}`);
  const data = (await res.json()) as { jobs: GhJob[] };
  return data.jobs.map((j) => ({
    id: createHash("sha1").update(j.absolute_url).digest("hex").slice(0, 10),
    source: "greenhouse" as const,
    url: j.absolute_url,
    title: j.title,
    company: boardToken,
    location: j.location?.name ?? "?",
    postedAt: j.updated_at,
    description: j.content ? decodeHtml(j.content) : undefined,
    discoveredAt: new Date().toISOString(),
    // boardToken + numeric id are what the apply endpoint needs later
    externalId: String(j.id),
    boardToken,
  }));
}

/** Greenhouse job content arrives HTML-entity-encoded; decode entities FIRST,
 * then strip the tags they expand into. */
function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
