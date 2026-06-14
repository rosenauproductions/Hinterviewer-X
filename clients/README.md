# Client registry (one git, many deploys)

All tenants are listed in **`registry.json`**. Code and schema are shared; each Netlify site picks **one** client.

## Half git, half Netlify

| In git (`registry.json`) | In Netlify (per site, secret) |
|--------------------------|-------------------------------|
| `id` (e.g. `msc1`) | `NEXT_PUBLIC_CLIENT_ID=msc1` |
| `name`, colors, logo | *(optional overrides via env)* |
| `supabaseProjectRef` (public) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `netlifySiteHint` (docs only) | `SUPABASE_SERVICE_ROLE_KEY` |

If `supabaseProjectRef` is set in the registry, you **don’t need** `NEXT_PUBLIC_SUPABASE_URL` in Netlify — URL is built as `https://{ref}.supabase.co`.

**Never** put anon or service_role keys in git.

## New client checklist

1. Add entry to **`registry.json`**
2. Create **Supabase project** → run **`supabase-schema.sql`**
3. Fill **`supabaseProjectRef`** in registry (from Supabase URL subdomain)
4. **New Netlify site** → same GitHub repo `main`
5. Netlify env:
   ```
   NEXT_PUBLIC_CLIENT_ID=msc1
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
6. Deploy → verify `/api/health`

## Update all clients

Push to **`main`** once. Every Netlify site linked to this repo rebuilds with the same code; each keeps its own `CLIENT_ID` + DB keys.
