# Hinterviewer X - Video Resume Platform

A comprehensive video resume platform built with Next.js 14+, Supabase, and Tailwind CSS.

## Features

- Multi-client deployment support
- Video recording and upload
- Applicant and admin dashboards
- Playlist generation and playback
- Supabase authentication with role-based access
- Responsive design

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Local Development

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your values
3. Run the Supabase schema in your Supabase project SQL editor
4. Install dependencies: `npm install`
5. Start development server: `npm run dev`

## Multi-Client Deployment

This application supports deploying to multiple clients with isolated databases.

### For Each Client:

1. **Create Supabase Project**
   - Go to supabase.com and create a new project
   - Run the SQL from `supabase-schema.sql` in the SQL Editor

2. **Set Up Vercel Project**
   - Create a new Vercel project connected to this GitHub repo
   - Configure environment variables in Vercel dashboard:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     NEXT_PUBLIC_CLIENT_NAME=Client Company Name
     NEXT_PUBLIC_CLIENT_LOGO_URL=/logo.png
     NEXT_PUBLIC_CLIENT_PRIMARY_COLOR=#3b82f6
     NEXT_PUBLIC_CLIENT_SECONDARY_COLOR=#64748b
     NEXT_PUBLIC_CLIENT_ID=client-1
     ```

3. **Deploy**
   - Vercel will automatically deploy on git push
   - Each client gets their own subdomain or custom domain

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_CLIENT_NAME` | Client company name | No |
| `NEXT_PUBLIC_CLIENT_LOGO_URL` | Logo URL path | No |
| `NEXT_PUBLIC_CLIENT_PRIMARY_COLOR` | Primary brand color | No |
| `NEXT_PUBLIC_CLIENT_SECONDARY_COLOR` | Secondary brand color | No |
| `NEXT_PUBLIC_CLIENT_ID` | Unique client identifier | No |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── applicant/         # Applicant-facing pages
│   ├── admin/            # Admin pages
│   ├── auth/             # Authentication pages
│   └── api/              # API routes
├── components/            # Reusable components
├── lib/                  # Utilities and configurations
└── types/                # TypeScript types
```

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** Supabase Auth
- **Deployment:** Vercel
- **Video:** react-media-recorder, video.js

## Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is licensed under the MIT License.
