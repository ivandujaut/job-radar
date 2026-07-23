import { readFileSync } from "node:fs";

export interface RawHit {
  title: string;
  url: string;
  snippet: string;
}

/**
 * People discovery runs on public search-engine indexes of LinkedIn profiles,
 * never on LinkedIn itself. Free engines captcha-wall automation, so this
 * adapter uses a search API provider chosen by env:
 *   SERPER_API_KEY  -> serper.dev (Google results, free tier)
 *   TAVILY_API_KEY  -> tavily.com (free tier)
 * A hits file (--hits-file) bypasses providers for manual curation/testing.
 */
export async function searchPeopleHits(company: string, extraTerms: string[] = []): Promise<RawHit[]> {
  const query = `site:linkedin.com/in "${company}" ${extraTerms.join(" ")}`.trim();
  if (process.env.SERPER_API_KEY) return serper(query);
  if (process.env.TAVILY_API_KEY) return tavily(query);
  throw new Error(
    "sin proveedor de busqueda: configura SERPER_API_KEY o TAVILY_API_KEY en .env, o usa --hits-file"
  );
}

async function serper(q: string): Promise<RawHit[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": process.env.SERPER_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ q, num: 20 }),
  });
  if (!res.ok) throw new Error(`serper: HTTP ${res.status}`);
  const data = (await res.json()) as { organic?: { title: string; link: string; snippet?: string }[] };
  return (data.organic ?? []).map((o) => ({ title: o.title, url: o.link, snippet: o.snippet ?? "" }));
}

async function tavily(q: string): Promise<RawHit[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query: q, max_results: 20 }),
  });
  if (!res.ok) throw new Error(`tavily: HTTP ${res.status}`);
  const data = (await res.json()) as { results?: { title: string; url: string; content?: string }[] };
  return (data.results ?? []).map((r) => ({ title: r.title, url: r.url, snippet: r.content ?? "" }));
}

export function loadHitsFile(path: string): RawHit[] {
  return JSON.parse(readFileSync(path, "utf8")) as RawHit[];
}
