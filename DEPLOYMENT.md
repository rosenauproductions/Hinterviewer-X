# Hinterviewer-X — deploy with real Supabase (Netlify)

The app **refuses to build or serve** without valid Supabase credentials. There is no fake or in-memory database.

## 1. Create the database (Supabase)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Open **SQL Editor** → **New query**
3. Paste the full contents of **`supabase-schema.sql`** from this repo → **Run**
4. Confirm tables exist: **Table Editor** → `profiles`, `questions`, `video_answers`, etc.
5. Copy from **Project Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret; server-only)

## 2. Config file (reference)

All keys are documented in:

```
config/deployment.env.example
```

**Local:** copy to `config/deployment.env`, fill in real values, then:

```bash
cp config/deployment.env .env.local
```

**Netlify:** add the same keys in **Site configuration → Environment variables** (see section 3).

## Multi-client (one git, many sites)

See **[clients/README.md](./clients/README.md)** and **`clients/registry.json`**.

| Layer | What |
|-------|------|
| **Git** | `clients/registry.json` — client id, name, branding, `supabaseProjectRef` |
| **Netlify per site** | `NEXT_PUBLIC_CLIENT_ID` + Supabase **keys** (secrets) |

**New site setup:**

1. Add client to `registry.json` (or pick existing `msc1`, `msc-dev`, …)
2. Create that client’s Supabase project + run `supabase-schema.sql`
3. Put `supabaseProjectRef` in registry (from project URL)
4. New Netlify site → import same repo → set:
   - `NEXT_PUBLIC_CLIENT_ID=msc1`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=…`
   - `SUPABASE_SERVICE_ROLE_KEY=…`
5. Deploy — `/api/health` shows `clientId` + `database: ok`

Push **`main`** once → all linked Netlify sites update.

---

## 3. New Netlify site

1. [app.netlify.com](https://app.netlify.com) → **Add new project** → **Import from Git**
2. Choose **Rosenau-Productions/Hinterviewer-X**
3. Build settings (also in `netlify.toml`):
   - Build command: `npm run build`
   - Node: **20**
4. **Before first deploy**, set environment variables:

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Recommended | Supabase → API → service_role |
| `NEXT_PUBLIC_CLIENT_NAME` | No | e.g. `Hinterviewer X` |

5. **Deploy site**
6. After deploy, open your site URL:
   - If env is wrong → **`/setup`** explains what’s missing
   - If env is OK → **`/api/health`** should return `{"database":"ok",...}`

## 4. Verify

```bash
curl -s https://YOUR-SITE.netlify.app/api/health
```

Expected when configured:

```json
{"status":"ok","database":"ok","configured":true}
```

## 5. Auth note

Supabase **Authentication → URL configuration**: add your Netlify site URL to **Site URL** and **Redirect URLs** (e.g. `https://your-site.netlify.app/**`).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails immediately | Env vars missing in Netlify — add before deploy |
| Site shows **Setup required** | Open `/setup`; fix URL/key format (`https://….supabase.co`, JWT anon key) |
| Login works but empty questions | Re-run `supabase-schema.sql` (seed questions at bottom) |
| Build worked locally, failed on Netlify | Netlify env vars are separate from `.env.local` |

## Multi-client (later)

One Netlify site per client, each with its **own Supabase project** and env vars. See `clients/example-client.env` for naming conventions.
