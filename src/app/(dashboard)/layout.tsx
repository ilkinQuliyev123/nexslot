import { ExternalLink, LogOut, Plus } from 'lucide-react'
import Link from 'next/link'
import { logout } from '@/app/actions'
import Sidebar from '@/components/dashboard/sidebar'
import { MANAGERS, requireRole, STAFF } from '@/lib/auth'
import { getOrg } from '@/lib/queries'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole(...STAFF)
  const org = await getOrg(s.orgId)
  return (
    <div className="min-h-screen md:grid md:grid-cols-[230px_1fr]">
      <aside className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link href="/" className="text-lg font-bold tracking-tight"><span className="text-brand">Nex</span>Slot</Link>
          <p className="text-xs text-muted md:mt-1">{org.name}</p>
        </div>
        <Sidebar isManager={MANAGERS.includes(s.role)} />
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-6 py-3">
          <Link href={`/${org.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-hover"><Plus className="size-4" /> New booking <ExternalLink className="size-3 opacity-70" /></Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-right leading-tight"><span className="block font-medium">{s.name}</span><span className="text-xs capitalize text-muted">{s.role}</span></span>
            <form action={logout}><button aria-label="Sign out" className="rounded-lg border border-line p-2 text-muted hover:text-ink"><LogOut className="size-4" /></button></form>
          </div>
        </header>
        <main className="mx-auto max-w-6xl space-y-6 p-6">{children}</main>
      </div>
    </div>
  )
}
