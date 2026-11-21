import { getSession, MANAGERS } from '@/lib/auth'
import { fmtDate, fmtTime, money, toCsv } from '@/lib/format'
import { getOrg, listBookings, listClients } from '@/lib/queries'

/** GET /api/export/bookings | /api/export/clients  -> CSV download (owner/manager only). */
export async function GET(_: Request, { params }: { params: Promise<{ kind: string }> }) {
  const s = await getSession()
  if (!s || !MANAGERS.includes(s.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const { kind } = await params
  const org = await getOrg(s.orgId)
  let rows: (string | number)[][]
  if (kind === 'clients') {
    rows = [['Name', 'Email', 'Visits', 'Total paid', 'Last visit'], ...(await listClients(s.orgId)).map((c) => [c.name, c.email, c.visits, money(c.spent, org.currency), fmtDate(c.last, org.timezone, { dateStyle: 'medium' })])]
  } else if (kind === 'bookings') {
    rows = [['ID', 'Client', 'Email', 'Service', 'Staff', 'Date', 'Time', 'Status', 'Price'], ...(await listBookings(s)).map((b) => [b.id, b.clientName, b.clientEmail, b.service, b.staff, fmtDate(b.startAt, org.timezone, { dateStyle: 'medium' }), fmtTime(b.startAt, org.timezone), b.status, money(b.priceCents, org.currency)])]
  } else return Response.json({ error: 'Not found' }, { status: 404 })
  return new Response(toCsv(rows), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${kind}.csv"` } })
}
