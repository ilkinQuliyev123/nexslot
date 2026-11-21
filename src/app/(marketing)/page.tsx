import { BarChart3, CalendarClock, CreditCard, ShieldCheck, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import BookingWidget from '@/components/booking-widget'
import Pricing from '@/components/pricing'
import { getOrgBySlug } from '@/lib/booking'

const features = [
  { icon: CalendarClock, title: 'Smart availability', text: 'Working hours, lunch breaks, buffers and time zones are handled automatically. Double bookings are impossible.' },
  { icon: CreditCard, title: 'Pay at booking', text: 'Collect full payment or a deposit when the client books, with a 5-minute hold on the chosen time.' },
  { icon: BarChart3, title: 'Revenue analytics', text: 'Revenue, occupancy, cancellations and popular services in one clear dashboard.' },
  { icon: Users, title: 'Team & roles', text: 'Owner, manager and specialist roles. Each person only sees what they should.' },
  { icon: ShieldCheck, title: 'Mini CRM', text: 'Client history, total spend and private notes, exportable to CSV in one click.' },
  { icon: Zap, title: 'Multi-tenant', text: 'Every business gets its own booking link, services and team: nexslot.app/your-name.' },
]
const demos = [['owner', 'Owner', 'Full access'], ['manager', 'Manager', 'Schedule & clients'], ['specialist', 'Specialist', 'Own appointments'], ['client', 'Client', 'My bookings']]

export const dynamic = 'force-dynamic'

export default async function Landing() {
  const data = (await getOrgBySlug('baku-clinic'))!
  return (
    <div>
      <header className="border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <p className="text-lg font-bold tracking-tight"><span className="text-brand">Nex</span>Slot</p>
          <nav className="flex items-center gap-5 text-sm text-muted">
            <a href="#demo" className="hover:text-ink">Live demo</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
            <Link href="/login" className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-hover">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
        <p className="mx-auto w-fit rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-muted">Booking · Payments · Analytics</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Run your appointments, <span className="text-brand">not your calendar</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">NexSlot gives clinics, studios and consultants a booking page, a team dashboard and revenue analytics in one place.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#demo" className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-hover">Try the booking demo</a>
          <a href="/api/demo-login?role=owner" className="rounded-lg border border-line bg-white px-6 py-3 font-semibold hover:border-slate-300">Open admin dashboard</a>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="mb-1 text-center text-2xl font-bold tracking-tight">Try it live, no sign-up</h2>
        <p className="mb-6 text-center text-sm text-muted">A real booking widget connected to a demo clinic. Book a time, then open the dashboard to see it appear.</p>
        <BookingWidget org={data.org} services={data.services} staff={data.staff} />
      </section>

      <section className="border-y border-line bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">Everything a service business needs</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon className="size-6 text-brand" strokeWidth={1.75} />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-1 text-center text-2xl font-bold tracking-tight">One-click demo access</h2>
        <p className="mb-6 text-center text-sm text-muted">Explore each role without a password.</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {demos.map(([role, title, desc]) => (
            <a key={role} href={`/api/demo-login?role=${role}`} className="rounded-xl border border-line bg-white p-4 text-center transition hover:border-brand">
              <p className="font-semibold">{title}</p>
              <p className="text-xs text-muted">{desc}</p>
            </a>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">Simple pricing</h2>
        <Pricing />
      </section>

      <footer className="border-t border-line bg-white py-6 text-center text-xs text-muted">
        NexSlot is a portfolio demo. Data is fictional and resets periodically. Payments are simulated.
      </footer>
    </div>
  )
}
