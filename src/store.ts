import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { dbEnabled, getDb, isSchemaMissing, markDbUnavailable } from "./db.ts";
import type { QueueItem } from "./types.ts";

/**
 * Queue store, dual-mode: Supabase Postgres when configured, local JSONL file
 * otherwise. All functions are async so callers do not care which backend runs.
 */
const DATA_FILE = join(process.cwd(), "data", "queue.jsonl");
const TABLE = "queue_items";

// --- file backend ---
function fileLoad(): QueueItem[] {
  if (!existsSync(DATA_FILE)) return [];
  return readFileSync(DATA_FILE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as QueueItem);
}

function fileSave(items: QueueItem[]): void {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, items.map((i) => JSON.stringify(i)).join("\n") + "\n");
}

// --- public API ---
function fileFallback<T>(error: { message?: string; code?: string } | null, run: () => T): T | undefined {
  if (isSchemaMissing(error)) {
    markDbUnavailable(error?.message ?? "tabla ausente");
    return run();
  }
  return undefined;
}

export async function loadQueue(): Promise<QueueItem[]> {
  if (!dbEnabled()) return fileLoad();
  const { data, error } = await getDb().from(TABLE).select("item");
  if (error) {
    const fb = fileFallback(error, fileLoad);
    if (fb !== undefined) return fb;
    throw new Error(`loadQueue: ${error.message}`);
  }
  return (data ?? []).map((r) => r.item as QueueItem);
}

export async function saveQueue(items: QueueItem[]): Promise<void> {
  if (!dbEnabled()) return fileSave(items);
  const rows = items.map((i) => ({ id: i.id, kind: i.kind, status: i.status, item: i }));
  const { error } = await getDb().from(TABLE).upsert(rows);
  if (error) {
    if (fileFallback(error, () => fileSave(items)) !== undefined) return;
    throw new Error(`saveQueue: ${error.message}`);
  }
}

export async function upsert(item: QueueItem): Promise<void> {
  const fileUpsert = () => {
    const items = fileLoad();
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    fileSave(items);
  };
  if (!dbEnabled()) return fileUpsert();
  const { error } = await getDb()
    .from(TABLE)
    .upsert({ id: item.id, kind: item.kind, status: item.status, item });
  if (error) {
    if (fileFallback(error, fileUpsert) !== undefined) return;
    throw new Error(`upsert: ${error.message}`);
  }
}

export async function findById(id: string): Promise<QueueItem | undefined> {
  const fileFind = () => fileLoad().find((i) => i.id === id || i.id.startsWith(id));
  if (!dbEnabled()) return fileFind();
  const db = getDb();
  const exact = await db.from(TABLE).select("item").eq("id", id).maybeSingle();
  if (exact.error) {
    const fb = fileFallback(exact.error, fileFind);
    if (fb !== undefined) return fb;
  }
  if (exact.data) return exact.data.item as QueueItem;
  const pref = await db.from(TABLE).select("item").like("id", `${id}%`).limit(1);
  return pref.data?.[0]?.item as QueueItem | undefined;
}

/** Append a history event. Pure and synchronous; persist with upsert(). */
export function log(item: QueueItem, event: string): QueueItem {
  item.history.push({ at: new Date().toISOString(), event });
  return item;
}
