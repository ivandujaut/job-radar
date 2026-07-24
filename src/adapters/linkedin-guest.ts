import { createHash } from "node:crypto";
import type { Job } from "../types.ts";

/**
 * LinkedIn guest job search: public endpoint, no login, read-only.
 * Returns an HTML fragment with <li> job cards. Fragile by nature; the
 * parser is defensive and returns whatever it can extract.
 */
const GUEST_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";

export async function searchGuestJobs(keywords: string, location: string, start = 0): Promise<Job[]> {
  const url = `${GUEST_URL}?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&start=${start}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept-Language": "es-AR,es;q=0.9,en;q=0.5",
    },
  });
  if (!res.ok) throw new Error(`guest search failed: HTTP ${res.status}`);
  const html = await res.text();
  return parseGuestHtml(html);
}

export function parseGuestHtml(html: string): Job[] {
  const jobs: Job[] = [];
  // Each card: <div class="base-card ..."> with title, company, location, link.
  const cards = html.split(/<li>/).slice(1);
  for (const card of cards) {
    const title = extract(card, /base-search-card__title[^>]*>\s*([^<]+)/);
    const company = extract(card, /base-search-card__subtitle[^>]*>\s*<a[^>]*>\s*([^<]+)/) ?? extract(card, /base-search-card__subtitle[^>]*>\s*([^<]+)/);
    const location = extract(card, /job-search-card__location[^>]*>\s*([^<]+)/);
    const url = extract(card, /href="(https:\/\/[a-z]{2,3}\.linkedin\.com\/jobs\/view\/[^"?]+)/);
    const postedAt = extract(card, /datetime="([^"]+)"/);
    if (!title || !url) continue;
    jobs.push({
      id: createHash("sha1").update(url).digest("hex").slice(0, 10),
      source: "linkedin-guest",
      url,
      title: clean(title),
      company: clean(company ?? "?"),
      location: clean(location ?? "?"),
      postedAt,
      discoveredAt: new Date().toISOString(),
    });
  }
  return jobs;
}

/**
 * Fetch the public job view page and extract the description text.
 * Adds a polite delay upstream; returns undefined if the page resists.
 */
export async function fetchGuestDescription(jobUrl: string): Promise<string | undefined> {
  const res = await fetch(jobUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept-Language": "es-AR,es;q=0.9,en;q=0.5",
    },
  });
  if (!res.ok) return undefined;
  const html = await res.text();
  const block = html.match(/show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/)?.[1];
  if (!block) return undefined;
  const text = block
    .replace(/<br[^>]*>/g, "\n")
    .replace(/<\/(p|li|ul|ol|h\d)>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || undefined;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run the public guest job search across every role keyword x location and
 * dedup by job id. Best-effort: a failed query is reported via onNote and
 * skipped, never aborting the batch. A small delay between queries keeps the
 * public endpoint happy.
 */
export async function searchLinkedInRoles(
  keywords: string[],
  locations: string[],
  opts: { delayMs?: number; onNote?: (m: string) => void } = {},
): Promise<Job[]> {
  const delay = opts.delayMs ?? 800;
  const note = opts.onNote ?? (() => {});
  const byId = new Map<string, Job>();
  for (const kw of keywords) {
    for (const loc of locations) {
      try {
        const found = await searchGuestJobs(kw, loc);
        for (const j of found) byId.set(j.id, j);
        note(`linkedin "${kw}" @ ${loc} -> ${found.length} vacantes`);
      } catch (e) {
        note(`linkedin "${kw}" @ ${loc} FALLO: ${(e as Error).message}`);
      }
      await sleep(delay);
    }
  }
  return [...byId.values()];
}

const extract = (s: string, re: RegExp): string | undefined => s.match(re)?.[1];
const clean = (s: string) => s.replace(/\s+/g, " ").trim();
