import { and, desc, eq, gte, lt } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import type { Session } from './auth'
import { dateInZone, weekday } from './slots-engine'

const { organizations, users, services, availability, bookings } = schema
const DAY = 86_400_000

export const getOrg = async (id: number) => (await (await getDb()).select().from(organizations).where(eq(organizations.id, id)))[0]

/** Bookings visible to the session (specialists only see their own), joined with service and staff names. */
export async function listBookings(s: Session, range?: { from?: Date; to?: Date }) {
  const db = await getDb()
  const conds = [eq(bookings.orgId, s.orgId), s.role === 'specialist' && s.userId ? eq(bookings.staffId, s.userId) : undefined, range?.from ? gte(bookings.startAt, range.from) : undefined, range?.to ? lt(bookings.startAt, range.to) : undefined].filter((c) => !!c)
  return db
    .select({ id: bookings.id, clientName: bookings.clientName, clientEmail: bookings.clientEmail, startAt: bookings.startAt, endAt: bookings.endAt, status: bookings.status, priceCents: bookings.priceCents, service: services.title, staff: users.fullName, staffId: bookings.staffId })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(users, eq(users.id, bookings.staffId))
    .where(and(...conds))
    .orderBy(desc(bookings.startAt))
}
export type BookingRow = Awaited<ReturnType<typeof listBookings>>[number]

const paid = (b: { status: string }) => b.status === 'confirmed' || b.status === 'completed'

export async function dashboard(s: Session) {
  const org = await getOrg(s.orgId)
  const db = await getDb()
  const now = Date.now()
  const all = await listBookings(s, { from: new Date(now - 60 * DAY) })
  const cur = all.filter((b) => +b.startAt >= now - 30 * DAY && +b.startAt <= now)
  const prev = all.filter((b) => +b.startAt < now - 30 * DAY)
  const revenue = cur.filter(paid).reduce((a, b) => a + b.priceCents, 0)
  const prevRevenue = prev.filter(paid).reduce((a, b) => a + b.priceCents, 0)

  // Occupancy = booked minutes / bookable minutes (working hours minus lunch) over the last 30 days.
  const staff = (await db.select({ id: users.id }).from(users).where(and(eq(users.orgId, s.orgId), eq(users.role, 'specialist')))).filter((u) => s.role !== 'specialist' || u.id === s.userId)
  const wins = await db.select().from(availability)
  const mins = (a: string, b: string) => (Number(b.slice(0, 2)) * 60 + Number(b.slice(3))) - (Number(a.slice(0, 2)) * 60 + Number(a.slice(3)))
  let capacity = 0
  for (let i = 1; i <= 30; i++) {
    const dow = weekday(dateInZone(now - i * DAY, org.timezone))
    for (const u of staff) {
      const w = wins.find((x) => x.userId === u.id && x.dayOfWeek === dow)
      if (w) capacity += mins(w.startTime, w.endTime) - (w.breakStart && w.breakEnd ? mins(w.breakStart, w.breakEnd) : 0)
    }
  }
  const booked = cur.filter((b) => b.status !== 'cancelled').reduce((a, b) => a + (+b.endAt - +b.startAt) / 60_000, 0)

  const series = Array.from({ length: 30 }, (_, i) => {
    const date = dateInZone(now - (29 - i) * DAY, org.timezone)
    const day = cur.filter((b) => dateInZone(+b.startAt, org.timezone) === date)
    return { date: date.slice(5), revenue: day.filter(paid).reduce((a, b) => a + b.priceCents, 0) / 100, bookings: day.filter((b) => b.status !== 'cancelled').length }
  })
  const byService = new Map<string, number>()
  for (const b of cur.filter((b) => b.status !== 'cancelled')) byService.set(b.service, (byService.get(b.service) ?? 0) + 1)

  return {
    org,
    revenue,
    revenueDelta: prevRevenue ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null,
    upcoming: all.filter((b) => +b.startAt >= now && (b.status === 'confirmed' || b.status === 'pending')).length,
    occupancy: capacity ? Math.round((booked / capacity) * 1000) / 10 : 0,
    cancelRate: cur.length ? Math.round((cur.filter((b) => b.status === 'cancelled').length / cur.length) * 100) : 0,
    series,
    popular: [...byService].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    recent: all.slice(0, 8),
  }
}

export async function listClients(orgId: number) {
  const db = await getDb()
  const rows = await db.select({ name: bookings.clientName, email: bookings.clientEmail, startAt: bookings.startAt, status: bookings.status, priceCents: bookings.priceCents }).from(bookings).where(eq(bookings.orgId, orgId))
  const notes = await db.select().from(schema.clientNotes).where(eq(schema.clientNotes.orgId, orgId)).orderBy(desc(schema.clientNotes.id))
  const map = new Map<string, { name: string; email: string; visits: number; spent: number; last: number; notes: string[] }>()
  for (const r of rows) {
    const c = map.get(r.email) ?? { name: r.name, email: r.email, visits: 0, spent: 0, last: 0, notes: notes.filter((n) => n.clientEmail === r.email).map((n) => n.note) }
    if (r.status !== 'cancelled') c.visits++
    if (paid(r)) c.spent += r.priceCents
    c.last = Math.max(c.last, +r.startAt)
    map.set(r.email, c)
  }
  return [...map.values()].sort((a, b) => b.spent - a.spent)
}
