import { Download, Search } from 'lucide-react'
import Link from 'next/link'
import { changeStatus } from '@/app/actions'
import StatusBadge from '@/components/status-badge'
import { statuses, type Status } from '@/db/schema'
import { MANAGERS, requireRole, STAFF } from '@/lib/auth'
import { fmtDate, fmtTime, money } from '@/lib/format'
import { getOrg, listBookings } from '@/lib/queries'

const PAGE = 12
const actions: Record<Status, { to: Status; label: string }[]> = {
  pending: [{ to: 'confirmed', label: 'Confirm' }, { to: 'cancelled', label: 'Cancel' }],
  confirmed: [{ to: 'completed', label: 'Complete' }, { to: 'cancelled', label: 'Cancel' }],
  completed: [],
  cancelled: [{ to: 'pending', label: 'Restore' }],
}

export default async function Bookings({ searchParams }: PageProps<'/bookings'>) {
  const s = await requireRole(...STAFF)
  const org = await getOrg(s.orgId)
  const sp = await searchParams
  const one = (k: string) => [sp[k]].flat()[0] ?? ''
  const status = (statuses as readonly string[]).includes(one('status')) ? (one('status') as Status) : ''
  const q = one('q').trim().toLowerCase()
  const page = Math.max(1, Number(one('page')) || 1)

  const rows = (await listBookings(s)).filter((b) => (!status || b.status === status) && (!q || `${b.clientName} ${b.clientEmail} ${b.service}`.toLowerCase().includes(q)))
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const shown = rows.slice((page - 1) * PAGE, page * PAGE)
  const href = (o: Record<string, string>) => `/bookings?${new URLSearchParams(Object.entries({ status, q: one('q'), page: '1', ...o }).filter(([, v]) => v))}`

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold tracking-tight">Bookings</h1><p className="text-sm text-muted" data-testid="count">{rows.length} booking{rows.length === 1 ? '' : 's'}</p></div>
        {MANAGERS.includes(s.role) && <a href="/api/export/bookings" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium hover:bg-canvas"><Download className="size-4" /> Export CSV</a>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form className="relative">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={one('q')} placeholder="Search client or service" aria-label="Search" className="w-64 rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand" />
        </form>
        <div className="flex gap-1.5 text-xs">
          {['', ...statuses].map((st) => <Link key={st} href={href({ status: st })} className={`rounded-full border px-3 py-1.5 font-medium capitalize ${status === st ? 'border-brand bg-blue-50 text-brand' : 'border-line bg-white text-muted hover:text-ink'}`}>{st || 'All'}</Link>)}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas text-xs text-muted"><tr>{['Ref', 'Client', 'Service', 'Specialist', 'When', 'Status', 'Price', ''].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {shown.map((b) => (
              <tr key={b.id}>
                <td className="tabular px-4 py-3 text-muted">NX-{String(b.id).padStart(5, '0')}</td>
                <td className="px-4 py-3"><span className="block font-medium">{b.clientName}</span><span className="text-xs text-muted">{b.clientEmail}</span></td>
                <td className="px-4 py-3">{b.service}</td>
                <td className="px-4 py-3 text-muted">{b.staff}</td>
                <td className="tabular whitespace-nowrap px-4 py-3">{fmtDate(b.startAt, org.timezone)} · {fmtTime(b.startAt, org.timezone)}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="tabular px-4 py-3">{money(b.priceCents, org.currency)}</td>
                <td className="px-4 py-3">
                  <form action={changeStatus} className="flex gap-1.5">
                    <input type="hidden" name="id" value={b.id} />
                    {actions[b.status].map((a) => <button key={a.to} name="status" value={a.to} className="rounded-md border border-line px-2 py-1 text-xs font-medium hover:border-brand hover:text-brand">{a.label}</button>)}
                  </form>
                </td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">No bookings match your filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={href({ page: String(page - 1) })} className="rounded-lg border border-line bg-white px-3 py-1.5 hover:bg-canvas">Previous</Link>}
            {page < pages && <Link href={href({ page: String(page + 1) })} className="rounded-lg border border-line bg-white px-3 py-1.5 hover:bg-canvas">Next</Link>}
          </div>
        </div>
      )}
    </>
  )
}
