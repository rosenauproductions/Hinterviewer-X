# Deployment config

Hinterviewer-X **does not run without a real Supabase database**.

## Quick start (local)

```bash
# 1. Supabase: new project → SQL Editor → paste supabase-schema.sql → Run

# 2. Config file (this folder)
cp deployment.env.example deployment.env
# Edit deployment.env with your Project URL + anon key from Supabase → Settings → API

# 3. Load into Next.js
cp deployment.env ../.env.local

# 4. Run
cd ..
npm install
npm run dev
```

## Netlify (production)

Do **not** commit `deployment.env` with secrets.

In **Netlify → Site configuration → Environment variables**, add every key from `deployment.env.example` with real values.

Then connect the site to **GitHub → Rosenau-Productions/Hinterviewer-X** and deploy.

See **[DEPLOYMENT.md](../DEPLOYMENT.md)** for the full checklist.
