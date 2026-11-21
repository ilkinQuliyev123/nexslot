import { and, eq, gt, gte, lt, ne } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { dateInZone, generateSlots, mergeStaffSlots, weekday, zonedToUtc, type Interval } from './slots-engine'

const { organizations, users, services, availability, bookings, holds } = schema
const HOLD_MS = 5 * 60_000
const LEAD_MIN = 30

// Single-process mutex: serialises read-check-write sequences so two clients can never take the same slot.
let chain: Promise<unknown> = Promise.resolve()
export const locked = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = chain.then(fn)
  chain = run.catch(() => undefined)
  return run
}

export async function getOrgBySlug(slug: string) {
  const db = await getDb()
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug))
  if (!org) return null
  const [svcs, staff] = await Promise.all([
    db.select().from(services).where(and(eq(services.orgId, org.id), eq(services.isActive, 1))).orderBy(services.id),
    db.select({ id: users.id, fullName: users.fullName }).from(users).where(and(eq(users.orgId, org.id), eq(users.role, 'specialist'))).orderBy(users.id),
  ])
  return { org, services: svcs, staff }
}

/** Free start times for one day, merged across staff (or for one staff member). */
export async function slotsForDay(o: { orgId: number; tz: string; serviceId: number; date: string; staffId?: number; now?: number }) {
  const db = await getDb()
  const now = o.now ?? Date.now()
  const [svc] = await db.select().from(services).where(and(eq(services.id, o.serviceId), eq(services.orgId, o.orgId), eq(services.isActive, 1)))
  if (!svc) return []
  const staff = (await db.select({ id: users.id }).from(users).where(and(eq(users.orgId, o.orgId), eq(users.role, 'specialist')))).filter((u) => !o.staffId || u.id === o.staffId)
  const from = new Date(zonedToUtc(o.date, '00:00', o.tz) - 86_400_000)
  const to = new Date(zonedToUtc(o.date, '23:59', o.tz) + 86_400_000)
  const [booked, held, wins] = await Promise.all([
    db.select({ staffId: bookings.staffId, startAt: bookings.startAt, endAt: bookings.endAt }).from(bookings).where(and(eq(bookings.orgId, o.orgId), ne(bookings.status, 'cancelled'), lt(bookings.startAt, to), gt(bookings.endAt, from))),
    db.select({ staffId: holds.staffId, startAt: holds.startAt, endAt: holds.endAt }).from(holds).where(and(eq(holds.orgId, o.orgId), gt(holds.expiresAt, new Date(now)), lt(holds.startAt, to), gt(holds.endAt, from))),
    db.select().from(availability).where(eq(availability.dayOfWeek, weekday(o.date))),
  ])
  const busyOf = (id: number): Interval[] => [...booked, ...held].filter((b) => b.staffId === id).map((b) => ({ start: +b.startAt, end: +b.endAt }))
  const perStaff = new Map<number, number[]>()
  for (const u of staff) {
    const w = wins.find((a) => a.userId === u.id)
    if (w) perStaff.set(u.id, generateSlots({ date: o.date, tz: o.tz, durationMin: svc.durationMin, win: { start: w.startTime, end: w.endTime, breakStart: w.breakStart, breakEnd: w.breakEnd, bufferMin: w.bufferMin }, busy: busyOf(u.id), now, leadMin: LEAD_MIN }))
  }
  return mergeStaffSlots(perStaff)
}

/** Number of free slots per day for a month ("YYYY-MM"), used to enable days in the calendar. */
export async function monthAvailability(o: { orgId: number; tz: string; serviceId: number; month: string; staffId?: number }) {
  const [y, m] = o.month.split('-').map(Number)
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const out: Record<string, number> = {}
  for (let d = 1; d <= days; d++) {
    const date = `${o.month}-${String(d).padStart(2, '0')}`
    out[date] = (await slotsForDay({ ...o, date })).length
  }
  return out
}

export type HoldResult = { ok: true; holdId: string; expiresAt: number; staffId: number } | { ok: false; error: 'SLOT_TAKEN' | 'INVALID' }

export const holdSlot = (o: { orgId: number; tz: string; serviceId: number; start: number; staffId?: number }): Promise<HoldResult> =>
  locked(async () => {
    const db = await getDb()
    await db.delete(holds).where(lt(holds.expiresAt, new Date()))
    const date = dateInZone(o.start, o.tz)
    const slot = (await slotsForDay({ ...o, date })).find((s) => s.start === o.start && (!o.staffId || s.staffIds.includes(o.staffId)))
    if (!slot) return { ok: false, error: 'SLOT_TAKEN' }
    const [svc] = await db.select().from(services).where(eq(services.id, o.serviceId))
    const staffId = o.staffId ?? slot.staffIds[0]
    const holdId = crypto.randomUUID()
    const expiresAt = Date.now() + HOLD_MS
    await db.insert(holds).values({ id: holdId, orgId: o.orgId, serviceId: o.serviceId, staffId, startAt: new Date(o.start), endAt: new Date(o.start + svc.durationMin * 60_000), expiresAt: new Date(expiresAt) })
    return { ok: true, holdId, expiresAt, staffId }
  })

/** Payment provider seam: replace `demoCharge` with a Stripe Checkout session + webhook for production. */
export const demoCharge = (card: string) => (card === '4000000000000002' ? { ok: false as const, error: 'Your card was declined (demo card).' } : { ok: true as const, sessionId: `cs_test_${crypto.randomUUID().slice(0, 12)}` })

export type ConfirmResult = { ok: true; bookingId: number } | { ok: false; error: 'HOLD_EXPIRED' | 'DECLINED'; message: string }

export const confirmBooking = (o: { holdId: string; name: string; email: string; card: string }): Promise<ConfirmResult> =>
  locked(async () => {
    const db = await getDb()
    const [hold] = await db.select().from(holds).where(and(eq(holds.id, o.holdId), gte(holds.expiresAt, new Date())))
    if (!hold) return { ok: false, error: 'HOLD_EXPIRED', message: 'Your reservation timed out. Please pick a time again.' }
    const [svc] = await db.select().from(services).where(eq(services.id, hold.serviceId))
    const pay = demoCharge(o.card)
    if (!pay.ok) return { ok: false, error: 'DECLINED', message: pay.error }
    const [row] = await db.insert(bookings).values({ orgId: hold.orgId, serviceId: hold.serviceId, staffId: hold.staffId, clientName: o.name, clientEmail: o.email.toLowerCase(), startAt: hold.startAt, endAt: hold.endAt, status: 'confirmed', priceCents: svc.priceCents, stripeSessionId: pay.sessionId }).returning({ id: bookings.id })
    await db.delete(holds).where(eq(holds.id, hold.id))
    return { ok: true, bookingId: row.id }
  })
