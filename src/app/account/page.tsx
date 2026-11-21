import { CalendarPlus, LogOut } from 'lucide-react'
import Link from 'next/link'
import { and, desc, eq } from 'drizzle-orm'
import { logout } from '@/app/actions'
import StatusBadge from '@/components/status-badge'
import { getDb, schema } from '@/db'
import { requireRole } from '@/lib/auth'
import { fmtDate, fmtTime, money } from '@/lib/format'
import { getOrg } from '@/lib/queries'

export default async function Account() {
  const s = await requireRole('client')
  const org = await getOrg(s.orgId)
  const rows = await (await getDb())
    .select({ id: schema.bookings.id, start: schema.bookings.startAt, status: schema.bookings.status, price: schema.bookings.priceCents, title: schema.services.title, staff: schema.users.fullName })
    .from(schema.bookings)
    .innerJoin(schema.services, eq(schema.services.id, schema.bookings.serviceId))
    .innerJoin(schema.users, eq(schema.users.id, schema.bookings.staffId))
    .where(and(eq(schema.bookings.orgId, s.orgId), eq(schema.bookings.clientEmail, s.email)))
    .orderBy(desc(schema.bookings.startAt))
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div><Link href="/" className="text-lg font-bold tracking-tight"><span className="text-brand">Nex</span>Slot</Link><h1 className="mt-4 text-2xl font-bold tracking-tight">My bookings</h1><p className="text-sm text-muted">{s.name} · {s.email}</p></div>
        <form action={logout}><button aria-label="Sign out" className="rounded-lg border border-line bg-white p-2 text-muted hover:text-ink"><LogOut className="size-4" /></button></form>
      </div>
      <div className="mt-6 space-y-3">
        {rows.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4">
            <div><p className="font-semibold">{b.title}</p><p className="tabular text-sm text-muted">{fmtDate(b.start, org.timezone, { dateStyle: 'medium' })} · {fmtTime(b.start, org.timezone)} · {b.staff}</p></div>
            <div className="flex items-center gap-3"><span className="tabular text-sm font-medium">{money(b.price, org.currency)}</span><StatusBadge status={b.status} />{b.status !== 'cancelled' && <a href={`/api/ics/${b.id}`} aria-label="Add to calendar" className="rounded-md border border-line p-1.5 text-muted hover:text-brand"><CalendarPlus className="size-4" /></a>}</div>
          </div>
        ))}
        {!rows.length && <p className="rounded-xl border border-dashed border-line py-12 text-center text-sm text-muted">No bookings yet.</p>}
      </div>
      <Link href={`/${org.slug}`} className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">Book an appointment</Link>
    </main>
  )
}
