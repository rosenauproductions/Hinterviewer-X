export type ProfileRole = 'applicant' | 'low_admin' | 'super_admin'

export function isAdminRole(role?: string | null): role is 'low_admin' | 'super_admin' {
  return role === 'low_admin' || role === 'super_admin'
}

/** Where to send a user after login based on profiles.role */
export function homePathForRole(role?: string | null): string {
  if (isAdminRole(role)) return '/admin/dashboard'
  if (role === 'applicant') return '/applicant/dashboard'
  return '/qa?issue=missing_profile'
}
