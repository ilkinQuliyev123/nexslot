import { getOrgBySlug, monthAvailability, slotsForDay } from '@/lib/booking'

/** GET /api/slots?org=slug&service=id[&staff=id]&date=YYYY-MM-DD  -> free slots; or &month=YYYY-MM -> free-slot counts per day. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  const data = await getOrgBySlug(q.get('org') ?? '')
  const serviceId = Number(q.get('service'))
  const date = q.get('date'), month = q.get('month')
  if (!data || !serviceId || (!date && !month) || (date && !/^\d{4}-\d\d-\d\d$/.test(date)) || (month && !/^\d{4}-\d\d$/.test(month)))
    return Response.json({ error: 'Bad request' }, { status: 400 })
  const base = { orgId: data.org.id, tz: data.org.timezone, serviceId, staffId: Number(q.get('staff')) || undefined }
  return Response.json(month ? { tz: base.tz, days: await monthAvailability({ ...base, month }) } : { tz: base.tz, slots: await slotsForDay({ ...base, date: date! }) })
}
