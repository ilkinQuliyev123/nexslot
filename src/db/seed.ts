import type { PgRemoteDatabase } from 'drizzle-orm/pg-proxy'
import { dateInZone, generateSlots, weekday, zonedToUtc } from '@/lib/slots-engine'
import * as s from './schema'

const DAY = 86_400_000
// Deterministic PRNG so demo data is stable between restarts.
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)

const CLIENTS = ['Anna Petrova', 'Murad Quliyev', 'Sevinc Abdullayeva', 'John Carter', 'Aysel Nasirova', 'Tural Ismayilov', 'Emma Wilson', 'Kamran Aliyev', 'Lala Huseynova', 'Omar Farouk', 'Nigar Mammadli', 'David Brown']
const email = (n: string) => `${n.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`

const ORGS = [
  {
    org: { name: 'Baku Clinic', slug: 'baku-clinic', tagline: 'Family health care in the heart of Baku', timezone: 'Asia/Baku', currency: 'USD' },
    staff: [['Leyla Aliyeva', 'owner'], ['Rashad Mammadov', 'manager'], ['Dr. Nigar Hasanova', 'specialist'], ['Dr. Elnur Guliyev', 'specialist']] as const,
    services: [['General Consultation', 'Check-up and advice from a general practitioner.', 30, 4000], ['Dental Check-up', 'Examination and cleaning advice.', 45, 6000], ['Physiotherapy Session', 'Personal rehabilitation session.', 60, 7500], ['Lab Results Review', 'Discuss your test results.', 30, 3500], ['Follow-up Visit', 'Short follow-up appointment.', 30, 2500]] as const,
    bookings: 260,
  },
  {
    org: { name: 'Nova Studio', slug: 'nova-studio', tagline: 'Design and brand strategy consultations', timezone: 'Europe/London', currency: 'USD' },
    staff: [['Sam Carter', 'owner'], ['Maya Lin', 'specialist'], ['Alex Reed', 'specialist']] as const,
    services: [['Brand Discovery Call', 'Understand your goals and audience.', 45, 9000], ['Design Review', 'Feedback on your existing designs.', 30, 6000], ['Workshop', 'Half-day collaborative workshop.', 60, 15000]] as const,
    bookings: 40,
  },
]

export async function seed(db: PgRemoteDatabase<typeof s>) {
  const rand = rng(42)
  const now = Date.now()

  for (const def of ORGS) {
    const [org] = await db.insert(s.organizations).values(def.org).returning()
    const staff = await db.insert(s.users).values(def.staff.map(([fullName, role]) => ({ orgId: org.id, fullName, role, email: email(fullName.replace('Dr. ', '')) }))).returning()
    const services = await db.insert(s.services).values(def.services.map(([title, description, durationMin, priceCents]) => ({ orgId: org.id, title, description, durationMin, priceCents }))).returning()

    const workers = staff.filter((u) => u.role === 'specialist')
    for (const u of staff)
      for (const dow of u.role === 'specialist' ? [1, 2, 3, 4, 5, ...(u.id % 2 ? [6] : [])] : [])
        await db.insert(s.availability).values({
          userId: u.id, dayOfWeek: dow, startTime: dow === 6 ? '10:00' : '09:00', endTime: dow === 6 ? '14:00' : '18:00',
          bufferMin: 10, breakStart: dow === 6 ? null : '13:00', breakEnd: dow === 6 ? null : '14:00',
        })
    const avail = await db.select().from(s.availability)

    // Realistic bookings placed only on genuinely free slots across the past 60 and next 14 days.
    const taken = new Map<number, { start: number; end: number }[]>()
    const rows: (typeof s.bookings.$inferInsert)[] = []
    let guard = 0
    while (rows.length < def.bookings && guard++ < 8000) {
      const offsetDays = Math.floor(74 * (1 - (1 - rand()) ** 1.35)) - 60 // skewed toward recent days: a growing business
      const date = dateInZone(now + offsetDays * DAY, org.timezone)
      const staffMember = workers[Math.floor(rand() * workers.length)]
      const win = avail.find((a) => a.userId === staffMember.id && a.dayOfWeek === weekday(date))
      if (!win) continue
      const svc = services[Math.floor(rand() ** 1.6 * services.length)] // earlier services are more popular
      const slots = generateSlots({ date, tz: org.timezone, durationMin: svc.durationMin, win: { start: win.startTime, end: win.endTime, breakStart: win.breakStart, breakEnd: win.breakEnd, bufferMin: win.bufferMin }, busy: taken.get(staffMember.id) ?? [], now: 0 })
      if (!slots.length) continue
      const start = slots[Math.floor(rand() * slots.length)]
      const end = start + svc.durationMin * 60_000
      taken.set(staffMember.id, [...(taken.get(staffMember.id) ?? []), { start, end }])
      const past = end < now
      const r = rand()
      const status: s.Status = past ? (r < 0.12 ? 'cancelled' : 'completed') : r < 0.3 ? 'pending' : r < 0.9 ? 'confirmed' : 'cancelled'
      const name = CLIENTS[Math.floor(rand() * CLIENTS.length)]
      rows.push({ orgId: org.id, serviceId: svc.id, staffId: staffMember.id, clientName: name, clientEmail: email(name), startAt: new Date(start), endAt: new Date(end), status, priceCents: svc.priceCents, stripeSessionId: status === 'pending' ? null : `cs_test_${Math.floor(rand() * 1e9).toString(36)}` })
    }
    await db.insert(s.bookings).values(rows)
  }
}

export { zonedToUtc }
