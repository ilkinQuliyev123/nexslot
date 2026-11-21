import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { requireRole, STAFF } from '@/lib/auth'
import { fmtTime } from '@/lib/format'
import { getOrg, listBookings, type BookingRow } from '@/lib/queries'
import { addDays, dateInZone, weekday, zonedToUtc } from '@/lib/slots-engine'

const chip = { confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200', pending: 'bg-amber-50 text-amber-800 border-amber-200', cancelled: 'bg-red-50 text-red-700 border-red-200 line-through opacity-70', completed: 'bg-slate-100 text-slate-600 border-slate-200' } as const
const views = ['day', 'week', 'month'] as const
type View = (typeof views)[number]
const monday = (d: string) => addDays(d, -((weekday(d) + 6) % 7))
const shiftMonth = (d: string, n: number) => { const [y, m] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 10) }

const Chip = ({ b, tz }: { b: BookingRow; tz: string }) => (
  <div className={`truncate rounded-md border px-1.5 py-1 text-xs ${chip[b.status]}`} title={`${b.clientName} · ${b.service} · ${b.staff} · ${b.status}`}>
    <span className="tabular font-medium">{fmtTime(b.startAt, tz)}</span> {b.clientName}
  </div>
)

export default async function CalendarPage({ searchParams }: PageProps<'/calendar'>) {
  const s = await requireRole(...STAFF)
  const org = await getOrg(s.orgId)
  const tz = org.timezone
  const sp = await searchParams
  const one = (k: string) => [sp[k]].flat()[0] ?? ''
  const view: View = (views as readonly string[]).includes(one('view')) ? (one('view') as View) : 'week'
  const today = dateInZone(Date.now(), tz)
  const date = /^\d{4}-\d\d-\d\d$/.test(one('date')) ? one('date') : today

  const start = view === 'day' ? date : view === 'week' ? monday(date) : monday(`${date.slice(0, 8)}01`)
  const days = view === 'day' ? 1 : view === 'week' ? 7 : 42
  const end = addDays(start, days)
  const all = await listBookings(s, { from: new Date(zonedToUtc(start, '00:00', tz)), to: new Date(zonedToUtc(end, '00:00', tz)) })
  const staffFilter = Number(one('staff')) || 0
  const items = all.filter((b) => !staffFilter || b.staffId === staffFilter).sort((a, b) => +a.startAt - +b.startAt)
  const byDay = (d: string) => items.filter((b) => dateInZone(+b.startAt, tz) === d)
  const staff = [...new Map(all.map((b) => [b.staffId, b.staff])).entries()]

  const q = (o: Record<string, string>) => `/calendar?${new URLSearchParams({ view, date, ...(staffFilter ? { staff: String(staffFilter) } : {}), ...o })}`
  const prev = view === 'month' ? shiftMonth(date, -1) : addDays(date, view === 'week' ? -7 : -1)
  const next = view === 'month' ? shiftMonth(date, 1) : addDays(date, view === 'week' ? 7 : 1)
  const title = view === 'month' ? new Date(`${date.slice(0, 7)}-01T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : view === 'week' ? `${start} – ${addDays(start, 6)}` : date
  const label = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="tabular text-sm text-muted" data-testid="cal-title">{title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex rounded-lg border border-line bg-white p-0.5">
            {views.map((v) => <Link key={v} href={q({ view: v })} className={`rounded-md px-3 py-1.5 font-medium capitalize ${v === view ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>{v}</Link>)}
          </div>
          <Link href={q({ date: prev })} aria-label="Previous" className="rounded-lg border border-line bg-white p-2 hover:bg-canvas"><ChevronLeft className="size-4" /></Link>
          <Link href={q({ date: today })} className="rounded-lg border border-line bg-white px-3 py-2 font-medium hover:bg-canvas">Today</Link>
          <Link href={q({ date: next })} aria-label="Next" className="rounded-lg border border-line bg-white p-2 hover:bg-canvas"><ChevronRight className="size-4" /></Link>
        </div>
      </div>

      {s.role !== 'specialist' && staff.length > 1 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href={q({ staff: '' })} className={`rounded-full border px-3 py-1 ${!staffFilter ? 'border-brand text-brand' : 'border-line text-muted'}`}>Everyone</Link>
          {staff.map(([id, name]) => <Link key={id} href={q({ staff: String(id) })} className={`rounded-full border px-3 py-1 ${staffFilter === id ? 'border-brand text-brand' : 'border-line text-muted'}`}>{name}</Link>)}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-muted">
        {(Object.keys(chip) as (keyof typeof chip)[]).map((k) => <span key={k} className="flex items-center gap-1.5"><span className={`size-2.5 rounded-sm border ${chip[k].split(' ').slice(0, 3).join(' ')}`} />{k[0].toUpperCase() + k.slice(1)}</span>)}
      </div>

      {view === 'month' ? (
        <div className="overflow-x-auto"><div className="grid min-w-[640px] grid-cols-7 overflow-hidden rounded-xl border border-line bg-line gap-px">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="bg-white py-2 text-center text-xs font-medium text-muted">{d}</div>)}
          {Array.from({ length: 42 }, (_, i) => addDays(start, i)).map((d) => {
            const list = byDay(d)
            return (
              <div key={d} className={`min-h-24 space-y-1 bg-white p-1.5 ${d.slice(0, 7) !== date.slice(0, 7) ? 'bg-slate-50/70 text-slate-400' : ''}`}>
                <Link href={q({ view: 'day', date: d })} className={`tabular inline-block text-xs ${d === today ? 'rounded-full bg-brand px-1.5 font-semibold text-white' : ''}`}>{Number(d.slice(8))}</Link>
                {list.slice(0, 3).map((b) => <Chip key={b.id} b={b} tz={tz} />)}
                {list.length > 3 && <p className="text-xs text-muted">+{list.length - 3} more</p>}
              </div>
            )
          })}
        </div></div>
      ) : (
        <div className={`grid gap-3 ${view === 'week' ? 'sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7' : ''}`}>
          {Array.from({ length: days }, (_, i) => addDays(start, i)).map((d) => {
            const list = byDay(d)
            return (
              <section key={d} className={`rounded-xl border bg-white p-3 ${d === today ? 'border-brand' : 'border-line'}`}>
                <h2 className="mb-2 text-xs font-semibold text-muted">{label(d)}</h2>
                <div className="space-y-1.5">
                  {list.length ? list.map((b) => view === 'day' ? (
                    <div key={b.id} className={`rounded-lg border px-3 py-2 text-sm ${chip[b.status]}`}><span className="tabular font-semibold">{fmtTime(b.startAt, tz)}–{fmtTime(b.endAt, tz)}</span> · {b.clientName}<span className="block text-xs opacity-80">{b.service} · {b.staff}</span></div>
                  ) : <Chip key={b.id} b={b} tz={tz} />) : <p className="py-2 text-xs text-slate-400">No bookings</p>}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
