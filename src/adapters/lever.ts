import { createHash } from "node:crypto";
import type { Job } from "../types.ts";

/**
 * Lever public postings API. Like Greenhouse, these boards are meant to be read
 * programmatically and are part of the legitimate 24/7 auto-apply path.
 *
 * board token = the company slug in jobs.lever.co/<token>
 * (e.g. jobs.lever.co/spotify -> "spotify").
 */
const API = "https://api.lever.co/v0/postings";

interface LeverPosting {
  id: string;
  text: string; // title
  categories?: { location?: string; department?: string; team?: string; commitment?: string };
  hostedUrl: string;
  applyUrl?: string;
  createdAt?: number;
  descriptionPlain?: string;
}

export async function fetchLeverJobs(boardToken: string): Promise<Job[]> {
  const res = await fetch(`${API}/${boardToken}?mode=json`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`lever ${boardToken}: HTTP ${res.status}`);
  const postings = (await res.json()) as LeverPosting[];
  return postings.map((p) => ({
    id: createHash("sha1").update(p.hostedUrl).digest("hex").slice(0, 10),
    source: "lever" as const,
    url: p.hostedUrl,
    title: p.text,
    company: boardToken,
    location: p.categories?.location ?? "?",
    postedAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    description: p.descriptionPlain?.replace(/\s+/g, " ").trim() || undefined,
    discoveredAt: new Date().toISOString(),
    externalId: p.id,
    boardToken,
  }));
}
