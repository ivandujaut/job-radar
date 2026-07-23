import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { QueueItem } from "./types.ts";

const DATA_FILE = join(import.meta.dirname, "..", "data", "queue.jsonl");

export function loadQueue(): QueueItem[] {
  if (!existsSync(DATA_FILE)) return [];
  return readFileSync(DATA_FILE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as QueueItem);
}

export function saveQueue(items: QueueItem[]): void {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, items.map((i) => JSON.stringify(i)).join("\n") + "\n");
}

export function upsert(item: QueueItem): void {
  const items = loadQueue();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  saveQueue(items);
}

export function findById(id: string): QueueItem | undefined {
  return loadQueue().find((i) => i.id === id || i.id.startsWith(id));
}

export function log(item: QueueItem, event: string): QueueItem {
  item.history.push({ at: new Date().toISOString(), event });
  return item;
}
