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

const extract = (s: string, re: RegExp): string | undefined => s.match(re)?.[1];
const clean = (s: string) => s.replace(/\s+/g, " ").trim();
