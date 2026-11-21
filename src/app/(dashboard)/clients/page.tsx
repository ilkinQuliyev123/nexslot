import { Download } from 'lucide-react'
import NoteForm from '@/components/dashboard/note-form'
import { MANAGERS, requireRole } from '@/lib/auth'
import { fmtDate, money } from '@/lib/format'
import { getOrg, listClients } from '@/lib/queries'

export default async function Clients() {
  const s = await requireRole(...MANAGERS)
  const [org, clients] = await Promise.all([getOrg(s.orgId), listClients(s.orgId)])
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold tracking-tight">Clients</h1><p className="text-sm text-muted" data-testid="count">{clients.length} clients, sorted by total spend</p></div>
        <a href="/api/export/clients" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium hover:bg-canvas"><Download className="size-4" /> Export CSV</a>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {clients.map((c) => (
          <section key={c.email} className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold">{c.name}</p><p className="text-xs text-muted">{c.email}</p></div>
              <p className="tabular text-right text-sm font-semibold">{money(c.spent, org.currency)}</p>
            </div>
            <p className="mt-2 text-xs text-muted">{c.visits} visit{c.visits === 1 ? '' : 's'} · last {fmtDate(c.last, org.timezone, { dateStyle: 'medium' })}</p>
            {c.notes.length > 0 && <ul className="mt-2 space-y-1 text-xs">{c.notes.map((n, i) => <li key={i} className="rounded-md bg-amber-50 px-2 py-1 text-amber-900">{n}</li>)}</ul>}
            <NoteForm email={c.email} />
          </section>
        ))}
      </div>
    </>
  )
}
