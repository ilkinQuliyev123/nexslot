import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { toIcs } from '@/lib/format'

/** GET /api/ics/:bookingId -> calendar file. Booking ids act as unguessable-enough demo references. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const db = await getDb()
  const [row] = await db
    .select({ id: schema.bookings.id, start: schema.bookings.startAt, end: schema.bookings.endAt, title: schema.services.title, org: schema.organizations.name })
    .from(schema.bookings)
    .innerJoin(schema.services, eq(schema.services.id, schema.bookings.serviceId))
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.bookings.orgId))
    .where(eq(schema.bookings.id, id))
  if (!row) return new Response('Not found', { status: 404 })
  return new Response(toIcs({ id: row.id, title: `${row.title} — ${row.org}`, description: `Booked via NexSlot`, start: row.start, end: row.end, location: row.org }), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': `attachment; filename="booking-${row.id}.ics"` } })
}
