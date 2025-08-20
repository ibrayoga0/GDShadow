# GDShadow

Admin-only dashboard to convert Google Drive share links into direct/redirect links that autoplay in Discord.

## Tech
- Vite + React + Tailwind CSS
- Supabase (Auth + Postgres)
- Vercel serverless for redirect endpoint

## Quick start

1. Copy env template and fill in Supabase keys.

```bash
cp .env.example .env
```

2. Install deps and run dev.

```bash
npm install
npm run dev
```

3. Create tables in Supabase (SQL below). Add your admin email in `.env`.

4. Deploy to Vercel. Add rewrite for `/d/:fileId` to `/api/d/:fileId` (already in `vercel.json`). Set env `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel if you want click analytics.

## Env
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_ADMIN_EMAILS (comma-separated whitelisted admin emails; leave empty to allow any authenticated Supabase user)
- SUPABASE_URL (serverless; for click logging)
- SUPABASE_SERVICE_ROLE_KEY (serverless; for click logging)

## Supabase schema (SQL)
```sql
create extension if not exists pgcrypto;

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  file_id text not null,
  original_url text not null,
  title text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  clicks bigint default 0,
  last_clicked_at timestamptz
);

create table if not exists public.link_clicks (
  id bigserial primary key,
  link_id uuid not null references public.links(id) on delete cascade,
  clicked_at timestamptz default now(),
  referer text,
  user_agent text,
  ip inet
);

alter table public.links enable row level security;
alter table public.link_clicks enable row level security;

-- Only authenticated users can manage their own rows
drop policy if exists "links_select_own" on public.links;
drop policy if exists "links_insert_own" on public.links;
drop policy if exists "links_update_own" on public.links;
drop policy if exists "links_delete_own" on public.links;

create policy "links_select_own" on public.links
  for select using (created_by = auth.uid());

create policy "links_insert_own" on public.links
  for insert with check (auth.role() = 'authenticated' and created_by = auth.uid());

create policy "links_update_own" on public.links
  for update using (created_by = auth.uid());

create policy "links_delete_own" on public.links
  for delete using (created_by = auth.uid());

-- clicks readable by authenticated
drop policy if exists "clicks_read" on public.link_clicks;
create policy "clicks_read" on public.link_clicks for select using (auth.role() = 'authenticated');
```

## Usage flow
- Admin logs in
- Paste Google Drive share link
- App parses FILE_ID and saves
- Use `https://your-domain/d/FILE_ID` anywhere (Discord will autoplay)

## Notes
- No video stored; redirect only.
- Click analytics optional; won't block redirect if disabled.
- Minimalist, fast, responsive UI.

## Shadow Player
- Default preview engine can be set in Settings → Player.
- Per-link toggle available (Drive vs Shadow).
- Player source via proxy: `/api/stream/:fileId` or set `VITE_PROXY_BASE_URL` for external.
- Database additions:
  - Column `use_shadow boolean default null` on `public.links` (null = follow global default).
  - Table `public.app_settings (key text primary key, value text)` to store `default_preview_engine`.
