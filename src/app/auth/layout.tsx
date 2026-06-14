// Auth pages need Supabase env at runtime — skip static prerender at build.
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
