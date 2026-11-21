'use client'
import { Check } from 'lucide-react'
import { useState } from 'react'

const plans = [
  { name: 'Starter', price: 19, blurb: 'For solo professionals', features: ['1 specialist', 'Online booking page', 'Email reminders', 'Basic analytics'] },
  { name: 'Pro', price: 49, blurb: 'For growing teams', features: ['Up to 10 specialists', 'Payments & deposits', 'Roles & permissions', 'Revenue analytics', 'CSV export'], featured: true },
  { name: 'Enterprise', price: 129, blurb: 'For multi-location businesses', features: ['Unlimited specialists', 'Multiple locations', 'API access', 'Priority support', 'Custom branding'] },
]

export default function Pricing() {
  const [yearly, setYearly] = useState(false)
  return (
    <div>
      <div className="mx-auto mb-8 flex w-fit items-center gap-1 rounded-full border border-line bg-white p-1 text-sm" role="group" aria-label="Billing period">
        {([['Monthly', false], ['Yearly · save 20%', true]] as const).map(([label, y]) => (
          <button key={label} aria-pressed={yearly === y} onClick={() => setYearly(y)} className={`rounded-full px-4 py-1.5 font-medium transition ${yearly === y ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-2xl border bg-white p-6 ${p.featured ? 'border-brand ring-1 ring-brand' : 'border-line'}`}>
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-muted">{p.blurb}</p>
            <p className="mt-4">
              <span className="tabular text-4xl font-bold" data-testid={`price-${p.name}`}>${yearly ? Math.round(p.price * 0.8) : p.price}</span>
              <span className="text-sm text-muted"> / month{yearly && ', billed yearly'}</span>
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="size-4 text-brand" />{f}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
