import { eq } from 'drizzle-orm'
import { toggleService } from '@/app/actions'
import ServiceDialog from '@/components/dashboard/service-dialog'
import { getDb, schema } from '@/db'
import { MANAGERS, requireRole } from '@/lib/auth'
import { money } from '@/lib/format'
import { getOrg } from '@/lib/queries'

export default async function Services() {
  const s = await requireRole(...MANAGERS)
  const org = await getOrg(s.orgId)
  const rows = await (await getDb()).select().from(schema.services).where(eq(schema.services.orgId, s.orgId)).orderBy(schema.services.id)
  return (
    <>
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Services</h1><p className="text-sm text-muted">What clients can book on your public page.</p></div>
        <ServiceDialog />
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas text-xs text-muted"><tr>{['Service', 'Duration', 'Price', 'Status', ''].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className={r.isActive ? '' : 'text-muted'}>
                <td className="px-4 py-3"><span className="block font-medium">{r.title}</span><span className="text-xs text-muted">{r.description}</span></td>
                <td className="tabular px-4 py-3">{r.durationMin} min</td>
                <td className="tabular px-4 py-3">{money(r.priceCents, org.currency)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${r.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-100 text-slate-500 ring-slate-500/20'}`}>{r.isActive ? 'Active' : 'Hidden'}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <form action={toggleService}><input type="hidden" name="id" value={r.id} /><button className="rounded-md border border-line px-2.5 py-1 text-xs font-medium hover:border-brand hover:text-brand">{r.isActive ? 'Hide' : 'Show'}</button></form>
                    <ServiceDialog service={r} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
