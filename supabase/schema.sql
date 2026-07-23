-- job-radar schema. Corre esto en Supabase (SQL Editor) una vez.
-- Guarda los objetos completos como JSONB, con algunas columnas promovidas
-- para filtrar. Acceso solo server-side con la service_role key, asi que
-- RLS queda deshabilitado (la app nunca expone estas tablas al cliente).

create table if not exists queue_items (
  id          text primary key,
  kind        text not null,           -- 'application' | 'connection'
  status      text not null,           -- pending_rank | pending_review | ...
  item        jsonb not null,          -- QueueItem completo
  updated_at  timestamptz not null default now()
);

create index if not exists queue_items_status_idx on queue_items (status);
create index if not exists queue_items_kind_idx   on queue_items (kind);

create table if not exists user_settings (
  user_id     text primary key,
  settings    jsonb not null,          -- UserSettings completo
  updated_at  timestamptz not null default now()
);
