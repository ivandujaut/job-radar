/**
 * One-time schema setup + data migration for Supabase.
 *
 *   bun run scripts/migrate.ts
 *
 * Requires DATABASE_URL in the environment. Creates the tables from
 * supabase/schema.sql, then copies any existing file-based data
 * (data/queue.jsonl and data/users/*.json) into Postgres. Idempotent: safe to
 * run more than once (uses IF NOT EXISTS + upsert).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL en el entorno.");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

async function main() {
  // 1. Create schema.
  const schema = readFileSync(join(process.cwd(), "supabase", "schema.sql"), "utf8");
  await sql.unsafe(schema);
  console.log("✓ esquema aplicado (queue_items, user_settings)");

  // 2. Migrate queue items from the file store, if any.
  const queueFile = join(process.cwd(), "data", "queue.jsonl");
  if (existsSync(queueFile)) {
    const items = readFileSync(queueFile, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    for (const item of items) {
      await sql`
        insert into queue_items (id, kind, status, item)
        values (${item.id}, ${item.kind}, ${item.status}, ${sql.json(item)})
        on conflict (id) do update set kind = excluded.kind, status = excluded.status, item = excluded.item, updated_at = now()
      `;
    }
    console.log(`✓ ${items.length} items de cola migrados`);
  } else {
    console.log("· sin data/queue.jsonl, nada que migrar");
  }

  // 3. Migrate user settings.
  const usersDir = join(process.cwd(), "data", "users");
  if (existsSync(usersDir)) {
    const files = readdirSync(usersDir).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      const s = JSON.parse(readFileSync(join(usersDir, f), "utf8"));
      await sql`
        insert into user_settings (user_id, settings)
        values (${s.userId}, ${sql.json(s)})
        on conflict (user_id) do update set settings = excluded.settings, updated_at = now()
      `;
    }
    console.log(`✓ ${files.length} usuarios migrados`);
  } else {
    console.log("· sin data/users, nada que migrar");
  }

  // 4. Report final counts straight from the DB.
  const [{ count: q }] = await sql`select count(*)::int as count from queue_items`;
  const [{ count: u }] = await sql`select count(*)::int as count from user_settings`;
  console.log(`\nEn Postgres ahora: ${q} items de cola, ${u} usuarios.`);
}

main()
  .then(() => sql.end())
  .catch(async (e) => {
    console.error("migracion fallo:", e.message);
    await sql.end();
    process.exit(1);
  });
