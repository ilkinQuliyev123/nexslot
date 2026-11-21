export const money = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100)

export const fmtTime = (d: Date | number, tz: string) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d)
export const fmtDate = (d: Date | number, tz: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, ...opts }).format(d)

export const statusStyle = {
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  completed: 'bg-slate-100 text-slate-600 ring-slate-500/20',
} as const

/** RFC 4180 CSV with formula-injection guard. */
export const toCsv = (rows: (string | number)[][]) =>
  rows.map((r) => r.map((c) => `"${String(typeof c === 'string' && /^[=+\-@]/.test(c) ? `'${c}` : c).replace(/"/g, '""')}"`).join(',')).join('\r\n')

const ics = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
export const toIcs = (e: { id: number; title: string; description: string; start: Date; end: Date; location: string }) =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NexSlot//EN', 'BEGIN:VEVENT', `UID:booking-${e.id}@nexslot`, `DTSTAMP:${ics(new Date())}`, `DTSTART:${ics(e.start)}`, `DTEND:${ics(e.end)}`, `SUMMARY:${e.title}`, `DESCRIPTION:${e.description}`, `LOCATION:${e.location}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
