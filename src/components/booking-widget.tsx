'use client'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, Lock, MapPin, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { confirmBookingAction, holdSlotAction } from '@/app/actions'
import { money } from '@/lib/format'
import { dateInZone } from '@/lib/slots-engine'

type Service = { id: number; title: string; description: string; durationMin: number; priceCents: number }
type Props = { org: { slug: string; name: string; tagline: string; timezone: string; currency: string }; services: Service[]; staff: { id: number; fullName: string }[] }
type Slot = { start: number; staffIds: number[] }
type Hold = { holdId: string; expiresAt: number; staffId: number; start: number }

const input = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'
const shiftMonth = (m: string, d: number) => { const [y, mo] = m.split('-').map(Number); const dt = new Date(Date.UTC(y, mo - 1 + d, 1)); return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}` }

export default function BookingWidget({ org, services, staff }: Props) {
  const router = useRouter()
  const today = dateInZone(Date.now(), org.timezone)
  const [step, setStep] = useState<1 | 2 | 3>(1) // mobile stepper; on desktop all columns are visible
  const [serviceId, setServiceId] = useState(services[0]?.id ?? 0)
  const [staffId, setStaffId] = useState(0)
  const [month, setMonth] = useState(today.slice(0, 7))
  const [days, setDays] = useState<Record<string, number>>({})
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [hold, setHold] = useState<Hold | null>(null)
  const [left, setLeft] = useState(0)
  const [notice, setNotice] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()
  const service = services.find((s) => s.id === serviceId)

  const qs = useCallback((extra: string) => `/api/slots?org=${org.slug}&service=${serviceId}${staffId ? `&staff=${staffId}` : ''}&${extra}`, [org.slug, serviceId, staffId])

  useEffect(() => {
    let live = true
    setDays({})
    fetch(qs(`month=${month}`)).then((r) => r.json()).then((d) => live && setDays(d.days ?? {}))
    return () => { live = false }
  }, [qs, month])

  const loadSlots = useCallback((d: string) => {
    setSlots(null)
    fetch(qs(`date=${d}`)).then((r) => r.json()).then((j) => setSlots(j.slots ?? []))
  }, [qs])

  useEffect(() => { setDate(''); setSlots(null); setHold(null) }, [serviceId, staffId])

  useEffect(() => {
    if (!hold) return
    const tick = () => {
      const s = Math.max(0, Math.round((hold.expiresAt - Date.now()) / 1000))
      setLeft(s)
      if (!s) { setHold(null); setNotice('Your reservation timed out. Please choose a time again.'); setStep(2); if (date) loadSlots(date) }
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [hold, date, loadSlots])

  const pickDate = (d: string) => { setDate(d); setNotice(''); loadSlots(d) }
  const pickSlot = (s: Slot) => start(async () => {
    setNotice('')
    const r = await holdSlotAction({ orgSlug: org.slug, serviceId, start: s.start, staffId: staffId || undefined })
    if (!r.ok) { setNotice('Sorry, that time was just taken. Please pick another.'); loadSlots(date); return }
    setHold({ holdId: r.holdId, expiresAt: r.expiresAt, staffId: r.staffId, start: s.start }); setStep(3)
  })

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!hold) return
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    start(async () => {
      const r = await confirmBookingAction({ holdId: hold.holdId, name: f.name, email: f.email, card: f.card, expiry: f.expiry, cvc: f.cvc })
      if (r.ok) return router.push(`/${org.slug}/booked/${r.bookingId}`)
      setErrors(r.errors ?? {})
      if (r.message) setNotice(r.message)
      if (r.error === 'HOLD_EXPIRED') { setHold(null); setStep(2); if (date) loadSlots(date) }
    })
  }

  const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const time = (ms: number) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(ms)
  const [y, mo] = month.split('-').map(Number)
  const lead = (new Date(Date.UTC(y, mo - 1, 1)).getUTCDay() + 6) % 7
  const total = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  const col = (n: number) => `${step === n ? 'block' : 'hidden'} md:block`
  const Err = ({ k }: { k: string }) => (errors[k] ? <p role="alert" className="mt-1 text-xs text-red-600">{errors[k]}</p> : null)

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white" data-testid="booking-widget">
      <div className="flex gap-1 border-b border-line px-4 py-2 text-xs font-medium text-muted md:hidden">
        {['Service', 'Date & time', 'Details'].map((l, i) => (
          <button key={l} onClick={() => (i + 1 < 3 || hold) && setStep((i + 1) as 1 | 2 | 3)} className={`flex-1 rounded-md py-1.5 ${step === i + 1 ? 'bg-brand text-white' : 'bg-canvas'}`}>{i + 1}. {l}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-[260px_1fr_240px] md:divide-x md:divide-line">
        <section className={`${col(1)} space-y-4 p-5`}>
          <div>
            <p className="text-lg font-semibold">{org.name}</p>
            <p className="text-sm text-muted">{org.tagline}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><MapPin className="size-3.5" /> {org.timezone.replace('_', ' ')}</p>
          </div>
          <div className="space-y-2" role="radiogroup" aria-label="Service">
            {services.map((s) => (
              <button key={s.id} role="radio" aria-checked={s.id === serviceId} onClick={() => { setServiceId(s.id); setStep(2) }} className={`w-full rounded-xl border p-3 text-left text-sm transition ${s.id === serviceId ? 'border-brand bg-blue-50/50 ring-1 ring-brand' : 'border-line hover:border-slate-300'}`}>
                <span className="block font-medium">{s.title}</span>
                <span className="mt-0.5 flex justify-between text-xs text-muted"><span className="flex items-center gap-1"><Clock className="size-3" />{s.durationMin} min</span><span className="tabular">{money(s.priceCents, org.currency)}</span></span>
              </button>
            ))}
          </div>
          <label className="block text-xs font-medium text-muted">
            <span className="mb-1 flex items-center gap-1"><UserRound className="size-3.5" /> Specialist</span>
            <select value={staffId} onChange={(e) => setStaffId(Number(e.target.value))} className={input}>
              <option value={0}>Anyone available</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
          </label>
        </section>

        <section className={`${col(2)} p-5`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 font-semibold"><CalendarDays className="size-4 text-brand" />{new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</p>
            <div className="flex gap-1">
              <button aria-label="Previous month" disabled={month <= today.slice(0, 7)} onClick={() => setMonth(shiftMonth(month, -1))} className="rounded-lg border border-line p-1.5 enabled:hover:bg-canvas disabled:opacity-40"><ChevronLeft className="size-4" /></button>
              <button aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))} className="rounded-lg border border-line p-1.5 hover:bg-canvas"><ChevronRight className="size-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <span key={d} className="py-1">{d}</span>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
            {Array.from({ length: total }, (_, i) => {
              const d = `${month}-${String(i + 1).padStart(2, '0')}`
              const free = days[d] ?? 0
              const on = free > 0
              return (
                <button key={d} disabled={!on} onClick={() => pickDate(d)} aria-label={`${d}${on ? `, ${free} slots` : ', unavailable'}`} aria-pressed={d === date}
                  className={`aspect-square rounded-lg text-sm transition ${d === date ? 'bg-brand font-semibold text-white' : on ? 'font-medium hover:bg-blue-50' : 'text-slate-300'} ${d === today ? 'ring-1 ring-brand/40' : ''}`}>
                  {i + 1}
                </button>
              )
            })}
          </div>
          {!Object.keys(days).length && <p className="mt-3 flex items-center gap-2 text-xs text-muted"><Loader2 className="size-3 animate-spin" /> Checking availability…</p>}
          <p className="mt-4 text-xs text-muted">Days are in {org.name}'s timezone; times are shown in yours ({clientTz}).</p>
        </section>

        <section className={`${col(2)} p-5 md:max-h-[520px] md:overflow-y-auto`}>
          <p className="mb-3 text-sm font-semibold">{date ? new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) : 'Available times'}</p>
          {notice && <p role="status" className="mb-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">{notice}</p>}
          {!date ? (
            <p className="text-sm text-muted">Select a day to see free times.</p>
          ) : slots === null ? (
            <div className="grid grid-cols-2 gap-2">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-9" />)}</div>
          ) : slots.length ? (
            <div className="grid grid-cols-2 gap-2">
              {slots.map((s) => (
                <button key={s.start} disabled={pending} onClick={() => pickSlot(s)} className="tabular rounded-lg border border-line py-2 text-sm font-medium transition hover:border-brand hover:text-brand disabled:opacity-50">{time(s.start)}</button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No free times on this day.</p>
          )}
        </section>

        <form onSubmit={submit} className={`${step === 3 ? 'block' : 'hidden'} space-y-3 p-5 md:col-span-3 md:border-t md:border-line md:bg-canvas/60 ${hold ? 'md:block' : 'md:hidden'}`} aria-label="Your details">
          {hold && service && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-semibold">{service.title} · <span className="tabular">{time(hold.start)}</span> · <span className="tabular">{money(service.priceCents, org.currency)}</span></p>
                <p className="tabular rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800" aria-live="polite">Held for {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-muted">Full name<input name="name" autoComplete="name" className={`${input} mt-1`} /><Err k="name" /></label>
                <label className="text-xs font-medium text-muted">Email<input name="email" type="email" autoComplete="email" className={`${input} mt-1`} /><Err k="email" /></label>
              </div>
              <fieldset className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                <legend className="mb-1 flex items-center gap-1 text-xs font-medium text-muted"><Lock className="size-3" /> Demo payment — use 4242 4242 4242 4242</legend>
                <label className="text-xs text-muted">Card number<input name="card" inputMode="numeric" defaultValue="4242 4242 4242 4242" className={`${input} tabular mt-1`} /><Err k="card" /></label>
                <label className="text-xs text-muted">Expiry<input name="expiry" placeholder="MM/YY" defaultValue="12/30" className={`${input} tabular mt-1`} /><Err k="expiry" /></label>
                <label className="text-xs text-muted">CVC<input name="cvc" inputMode="numeric" defaultValue="123" className={`${input} tabular mt-1`} /><Err k="cvc" /></label>
              </fieldset>
              <button disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
                {pending && <Loader2 className="size-4 animate-spin" />} Pay {money(service.priceCents, org.currency)} &amp; confirm
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
