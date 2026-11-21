import { CreditCard, Link2 } from 'lucide-react'
import { MANAGERS, requireRole } from '@/lib/auth'
import { getOrg } from '@/lib/queries'

export default async function Settings() {
  const s = await requireRole(...MANAGERS)
  const org = await getOrg(s.orgId)
  const rows = [['Business name', org.name], ['Public link', `/${org.slug}`], ['Time zone', org.timezone], ['Currency', org.currency], ['Plan', org.planTier]]
  return (
    <>
      <div><h1 className="text-2xl font-bold tracking-tight">Settings</h1><p className="text-sm text-muted">Business profile and integrations.</p></div>
      <section className="rounded-xl border border-line bg-white">
        <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">Business profile</h2>
        <dl className="divide-y divide-line text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-5 py-3"><dt className="text-muted">{k}</dt><dd className="font-medium capitalize">{v}</dd></div>)}</dl>
      </section>
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold"><CreditCard className="size-4 text-brand" /> Payments</h2>
        <p className="text-sm text-muted">Demo mode: card payments are simulated. In production this connects to Stripe Checkout and confirms bookings through a webhook.</p>
        <span className="mt-3 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Demo payments active</span>
      </section>
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Link2 className="size-4 text-brand" /> Your booking page</h2>
        <a href={`/${org.slug}`} target="_blank" className="tabular text-sm text-brand hover:underline">/{org.slug}</a>
      </section>
    </>
  )
}
