import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { MobileShell } from './MobileShell'
import { ROLE_LABELS } from '@/lib/utils'
import type { Role } from '@/types'

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, school_id, school:schools(name, logo_url)')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name ?? user.email ?? ''
  const userRoleKey = profile?.role ?? ''
  const userRole = profile?.role ? ROLE_LABELS[profile.role as Role] : ''
  const school = profile?.school as { name?: string; logo_url?: string | null } | null
  const schoolName = school?.name ?? 'Stride'
  const schoolLogoUrl = school?.logo_url ?? null
  const isAdmin = ['admin', 'manager'].includes(userRoleKey)

  return (
    <MobileShell
      sidebar={
        <Sidebar
          userName={userName}
          userRole={userRole}
          userRoleKey={userRoleKey}
          schoolName={schoolName}
          schoolLogoUrl={schoolLogoUrl}
          isAdmin={isAdmin}
        />
      }
    >
      {children}
    </MobileShell>
  )
}
