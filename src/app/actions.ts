'use server'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getDb, schema } from '@/db'
import { destroySession, MANAGERS, requireRole, STAFF } from '@/lib/auth'
import { confirmBooking, getOrgBySlug, holdSlot } from '@/lib/booking'
import * as v from '@/lib/validations'

type Result = { ok: true } | { ok: false; errors: Record<string, string> }
const fail = (errors: Record<string, string>): Result => ({ ok: false, errors })
const refresh = () => revalidatePath('/', 'layout')
const { bookings, services, users, availability, clientNotes } = schema

// ---- Public booking flow -------------------------------------------------------------------------------------------

export async function holdSlotAction(i: { orgSlug: string; serviceId: number; start: number; staffId?: number }) {
  const data = await getOrgBySlug(i.orgSlug)
  if (!data) return { ok: false as const, error: 'INVALID' as const }
  return holdSlot({ orgId: data.org.id, tz: data.org.timezone, serviceId: i.serviceId, start: i.start, staffId: i.staffId })
}

export type ConfirmOut = { ok: true; bookingId: number } | { ok: false; errors: Record<string, string>; error?: 'HOLD_EXPIRED' | 'DECLINED'; message?: string }

export async function confirmBookingAction(i: { holdId: string; name: string; email: string; card: string; expiry: string; cvc: string }): Promise<ConfirmOut> {
  const d = v.bookingDetails.safeParse(i)
  const p = v.payment.safeParse(i)
  if (!d.success || !p.success) return { ok: false, errors: { ...(d.success ? {} : v.fieldErrors(d.error)), ...(p.success ? {} : v.fieldErrors(p.error)) } }
  const res = await confirmBooking({ holdId: i.holdId, name: d.data.name, email: d.data.email, card: p.data.card })
  if (res.ok) refresh()
  return res.ok ? res : { ok: false, errors: {}, error: res.error, message: res.message }
}

// ---- Dashboard mutations (all guarded server-side) -----------------------------------------------------------------

export async function changeStatus(form: FormData) {
  const s = await requireRole(...STAFF)
  const p = v.statusChange.safeParse(Object.fromEntries(form))
  if (!p.success) return
  const db = await getDb()
  const own = s.role === 'specialist' && s.userId ? eq(bookings.staffId, s.userId) : undefined
  await db.update(bookings).set({ status: p.data.status }).where(and(eq(bookings.id, p.data.id), eq(bookings.orgId, s.orgId), own))
  refresh()
}

export async function saveService(_: unknown, form: FormData): Promise<Result> {
  const s = await requireRole(...MANAGERS)
  const p = v.service.safeParse(Object.fromEntries(form))
  if (!p.success) return fail(v.fieldErrors(p.error))
  const db = await getDb()
  const values = { title: p.data.title, description: p.data.description, durationMin: p.data.durationMin, priceCents: Math.round(p.data.price * 100) }
  const id = Number(form.get('id'))
  if (id) await db.update(services).set(values).where(and(eq(services.id, id), eq(services.orgId, s.orgId)))
  else await db.insert(services).values({ ...values, orgId: s.orgId })
  refresh()
  return { ok: true }
}

export async function toggleService(form: FormData) {
  const s = await requireRole(...MANAGERS)
  const id = Number(form.get('id'))
  const db = await getDb()
  const [row] = await db.select().from(services).where(and(eq(services.id, id), eq(services.orgId, s.orgId)))
  if (row) await db.update(services).set({ isActive: row.isActive ? 0 : 1 }).where(eq(services.id, id))
  refresh()
}

export async function changeRole(form: FormData) {
  const s = await requireRole('owner')
  const p = v.roleChange.safeParse(Object.fromEntries(form))
  if (!p.success || p.data.userId === s.userId) return // owners cannot demote themselves
  await (await getDb()).update(users).set({ role: p.data.role }).where(and(eq(users.id, p.data.userId), eq(users.orgId, s.orgId)))
  refresh()
}

export async function addNote(_: unknown, form: FormData): Promise<Result> {
  const s = await requireRole(...MANAGERS)
  const p = v.note.safeParse(Object.fromEntries(form))
  if (!p.success) return fail(v.fieldErrors(p.error))
  await (await getDb()).insert(clientNotes).values({ orgId: s.orgId, clientEmail: p.data.email, note: p.data.note })
  refresh()
  return { ok: true }
}

export async function saveHours(_: unknown, form: FormData): Promise<Result> {
  const s = await requireRole(...MANAGERS)
  const userId = Number(form.get('userId'))
  const db = await getDb()
  const [member] = await db.select().from(users).where(and(eq(users.id, userId), eq(users.orgId, s.orgId)))
  if (!member) return fail({ _: 'Unknown team member' })
  for (let dow = 0; dow < 7; dow++) {
    const on = form.get(`on-${dow}`) === 'on'
    await db.delete(availability).where(and(eq(availability.userId, userId), eq(availability.dayOfWeek, dow)))
    if (!on) continue
    const p = v.hoursDay.safeParse({ dayOfWeek: dow, startTime: form.get(`start-${dow}`), endTime: form.get(`end-${dow}`) })
    if (!p.success) return fail({ _: `Day ${dow}: ${p.error.issues[0].message}` })
    await db.insert(availability).values({ userId, ...p.data, bufferMin: 10, breakStart: p.data.endTime > '14:00' && p.data.startTime < '13:00' ? '13:00' : null, breakEnd: p.data.endTime > '14:00' && p.data.startTime < '13:00' ? '14:00' : null })
  }
  refresh()
  return { ok: true }
}

export async function logout() {
  await destroySession()
  redirect('/')
}
