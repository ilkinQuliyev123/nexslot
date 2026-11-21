import { CalendarPlus, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { fmtDate, fmtTime, money } from '@/lib/format'

export default async function Booked({ params }: PageProps<'/[orgSlug]/booked/[id]'>) {
  const { orgSlug, id } = await params
  const db = await getDb()
  const [b] = await db
    .select({ id: schema.bookings.id, name: schema.bookings.clientName, email: schema.bookings.clientEmail, start: schema.bookings.startAt, price: schema.bookings.priceCents, title: schema.services.title, staff: schema.users.fullName, org: schema.organizations.name, tz: schema.organizations.timezone, cur: schema.organizations.currency, slug: schema.organizations.slug })
    .from(schema.bookings)
    .innerJoin(schema.services, eq(schema.services.id, schema.bookings.serviceId))
    .innerJoin(schema.users, eq(schema.users.id, schema.bookings.staffId))
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.bookings.orgId))
    .where(eq(schema.bookings.id, Number(id)))
  if (!b || b.slug !== orgSlug) notFound()

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto size-12 text-emerald-500" strokeWidth={1.5} />
      <h1 className="mt-4 text-2xl font-bold tracking-tight">You're booked, {b.name.split(' ')[0]}!</h1>
      <p className="mt-1 text-sm text-muted">A confirmation was sent to {b.email} (demo: no email is actually sent).</p>
      <dl className="mt-6 divide-y divide-line rounded-xl border border-line bg-white text-left text-sm">
        {[['Service', b.title], ['With', b.staff], ['When', `${fmtDate(b.start, b.tz, { dateStyle: 'full' })}, ${fmtTime(b.start, b.tz)} (${b.tz})`], ['Paid', money(b.price, b.cur)], ['Reference', `NX-${String(b.id).padStart(5, '0')}`]].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">{k}</dt><dd className="tabular text-right font-medium">{v}</dd></div>
        ))}
      </dl>
      <a href={`/api/ics/${b.id}`} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"><CalendarPlus className="size-4" /> Add to calendar (.ics)</a>
      <p className="mt-4 text-sm"><Link href={`/${b.slug}`} className="text-brand hover:underline">Book another appointment</Link></p>
    </main>
  )
}
