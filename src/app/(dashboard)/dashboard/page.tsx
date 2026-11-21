import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { PopularChart, RevenueChart } from '@/components/dashboard/charts'
import StatusBadge from '@/components/status-badge'
import { requireRole, STAFF } from '@/lib/auth'
import { fmtDate, fmtTime, money } from '@/lib/format'
import { dashboard } from '@/lib/queries'

const Card = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-line bg-white p-5 ${className}`}><h2 className="mb-3 text-sm font-semibold">{title}</h2>{children}</section>
)

export default async function Overview() {
  const s = await requireRole(...STAFF)
  const d = await dashboard(s)
  const tz = d.org.timezone
  const kpis = [
    { label: 'Revenue (30 days)', value: money(d.revenue, d.org.currency), delta: d.revenueDelta },
    { label: 'Upcoming bookings', value: `${d.upcoming}`, sub: 'confirmed or pending' },
    { label: 'Occupancy', value: `${d.occupancy}%`, sub: 'booked vs. available time' },
    { label: 'Cancellation rate', value: `${d.cancelRate}%`, sub: 'last 30 days' },
  ]
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted">{s.role === 'specialist' ? 'Your appointments and results' : `Performance of ${d.org.name}`}, last 30 days.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-line bg-white p-5">
            <p className="text-xs font-medium text-muted">{k.label}</p>
            <p className="tabular mt-2 text-2xl font-bold" data-testid="kpi">{k.value}</p>
            {k.delta != null ? (
              <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${k.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{k.delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{Math.abs(k.delta)}% vs. previous 30 days</p>
            ) : <p className="mt-1 text-xs text-muted">{k.sub}</p>}
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card title="Revenue, last 30 days"><RevenueChart data={d.series} /></Card>
        <Card title="Most popular services">{d.popular.length ? <PopularChart data={d.popular} /> : <p className="py-16 text-center text-sm text-muted">No bookings yet.</p>}</Card>
      </div>
      <Card title="Recent bookings">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted"><tr><th className="pb-2 font-medium">Client</th><th className="pb-2 font-medium">Service</th><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Status</th></tr></thead>
            <tbody className="divide-y divide-line">
              {d.recent.map((b) => (
                <tr key={b.id}><td className="py-2.5 font-medium">{b.clientName}</td><td>{b.service}</td><td className="tabular text-muted">{fmtDate(b.startAt, tz)} · {fmtTime(b.startAt, tz)}</td><td><StatusBadge status={b.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/bookings" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">View all bookings</Link>
      </Card>
    </>
  )
}
