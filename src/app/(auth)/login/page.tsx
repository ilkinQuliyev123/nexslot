import Link from 'next/link'

const roles = [
  ['owner', 'Owner', 'Leyla Aliyeva · everything, including roles'],
  ['manager', 'Manager', 'Rashad Mammadov · schedule, services, clients'],
  ['specialist', 'Specialist', 'Dr. Nigar Hasanova · own appointments only'],
  ['client', 'Client', 'Anna Petrova · her bookings'],
]

export default function Login() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Link href="/" className="text-lg font-bold tracking-tight"><span className="text-brand">Nex</span>Slot</Link>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Sign in to the demo</h1>
      <p className="mt-1 text-sm text-muted">Pick a role. No password needed. Each role sees a different part of the app.</p>
      <div className="mt-6 space-y-3">
        {roles.map(([role, title, desc]) => (
          <a key={role} href={`/api/demo-login?role=${role}`} className="block rounded-xl border border-line bg-white p-4 transition hover:border-brand">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted">{desc}</p>
          </a>
        ))}
      </div>
    </main>
  )
}
