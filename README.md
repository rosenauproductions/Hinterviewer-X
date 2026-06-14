# Hinterviewer X - Video Resume Platform

Next.js + **Supabase** (PostgreSQL). **No fake database** — the app will not build or run until Supabase is configured.

**Deploy:** [DEPLOYMENT.md](./DEPLOYMENT.md) (Netlify + Supabase setup)  
**Config template:** [config/deployment.env.example](./config/deployment.env.example)

## Features (in progress)

- Multi-client deployment via environment variables
- Video recording and upload (planned)
- Applicant and admin dashboards
- Supabase auth + RLS schema in `supabase-schema.sql`

## Quick start (local)

```bash
# 1. Supabase: new project → SQL Editor → run supabase-schema.sql

# 2. Config
cp config/deployment.env.example config/deployment.env
# Edit with your Supabase URL + anon key

cp config/deployment.env .env.local

npm install
npm run dev
```

Open http://localhost:3000 — if env is missing, you are sent to `/setup`.

Verify DB: http://localhost:3000/api/health

## Netlify deploy

1. Create Supabase project + run `supabase-schema.sql`
2. Netlify → **Import** `Rosenau-Productions/Hinterviewer-X`
3. Set env vars from `config/deployment.env.example` **before** deploy
4. See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full checklist

`netlify.toml` sets Node 20 and `@netlify/plugin-nextjs`. **Secrets go in Netlify UI**, not in committed files.

## Scripts

```bash
npm run check-env   # verify Supabase env (runs automatically before build)
npm run dev
npm run build
```

## Tech stack

- Next.js 16, React 19, Supabase, Tailwind 4, shadcn/ui

## License

MIT
