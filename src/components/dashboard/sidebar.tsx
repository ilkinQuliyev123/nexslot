'use client'
import { BarChart3, CalendarDays, ClipboardList, Contact, Settings, UsersRound, Wrench } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/dashboard', label: 'Overview', icon: BarChart3, all: true },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays, all: true },
  { href: '/bookings', label: 'Bookings', icon: ClipboardList, all: true },
  { href: '/services', label: 'Services', icon: Wrench },
  { href: '/team', label: 'Team (RBAC)', icon: UsersRound },
  { href: '/clients', label: 'Clients', icon: Contact },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ isManager }: { isManager: boolean }) {
  const path = usePathname()
  return (
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible">
      {items.filter((i) => i.all || isManager).map(({ href, label, icon: Icon }) => {
        const active = path === href
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-blue-50 text-brand' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
            <Icon className="size-4" /> {label}
          </Link>
        )
      })}
    </nav>
  )
}
