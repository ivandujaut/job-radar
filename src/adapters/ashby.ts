import { createHash } from "node:crypto";
import type { Job } from "../types.ts";

/**
 * Ashby public job board API. Part of the legitimate 24/7 auto-apply path.
 *
 * board token = the org name in jobs.ashbyhq.com/<token> (case-sensitive,
 * e.g. jobs.ashbyhq.com/Ashby -> "Ashby"). The endpoint is a GET; a POST
 * returns 401.
 */
const API = "https://api.ashbyhq.com/posting-api/job-board";

interface AshbyJob {
  id: string;
  title: string;
  location?: string;
  jobUrl: string;
  applyUrl?: string;
  publishedAt?: string;
  descriptionPlain?: string;
  isListed?: boolean;
}

export async function fetchAshbyJobs(boardToken: string): Promise<Job[]> {
  const res = await fetch(`${API}/${boardToken}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`ashby ${boardToken}: HTTP ${res.status}`);
  const data = (await res.json()) as { jobs?: AshbyJob[] };
  return (data.jobs ?? [])
    .filter((j) => j.isListed !== false)
    .map((j) => ({
      id: createHash("sha1").update(j.jobUrl).digest("hex").slice(0, 10),
      source: "ashby" as const,
      url: j.jobUrl,
      title: j.title,
      company: boardToken,
      location: j.location ?? "?",
      postedAt: j.publishedAt,
      description: j.descriptionPlain?.replace(/\s+/g, " ").trim() || undefined,
      discoveredAt: new Date().toISOString(),
      externalId: j.id,
      boardToken,
    }));
}
