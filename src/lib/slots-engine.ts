// Pure scheduling logic: no framework or DB imports, so it can be unit-tested with `node --test`.

export type Interval = { start: number; end: number } // epoch ms, [start, end)
export type Window = { start: string; end: string; breakStart?: string | null; breakEnd?: string | null; bufferMin: number } // "HH:MM"

const MIN = 60_000
export const SLOT_STEP_MIN = 30

const formatters = new Map<string, Intl.DateTimeFormat>()
const parts = (ts: number, tz: string) => {
  let f = formatters.get(tz)
  if (!f) formatters.set(tz, (f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })))
  return Object.fromEntries(f.formatToParts(ts).map((p) => [p.type, Number(p.value)]))
}

/** Offset (ms) of `tz` from UTC at instant `ts`. */
const offset = (ts: number, tz: string) => {
  const p = parts(ts, tz)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ts / 1000) * 1000
}

/** Wall-clock time in `tz` ("2026-03-10", "09:30") -> UTC epoch ms. Handles DST by re-checking the offset. */
export function zonedToUtc(date: string, hm: string, tz: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const [h, mi] = hm.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, d, h, mi)
  const first = guess - offset(guess, tz)
  return guess - offset(first, tz)
}

/** Calendar date (YYYY-MM-DD) of instant `ts` in `tz`. */
export const dateInZone = (ts: number, tz: string) => {
  const p = parts(ts, tz)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/** Day of week (0 = Sunday) of a calendar date; independent of timezone. */
export const weekday = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end

/**
 * Start times (UTC epoch ms) at which a service of `durationMin` fits in `win` on `date`,
 * avoiding the lunch break, busy intervals (plus buffer) and anything before `now + leadMin`.
 */
export function generateSlots(o: { date: string; tz: string; durationMin: number; win: Window; busy: Interval[]; now: number; leadMin?: number }): number[] {
  const { date, tz, durationMin, win, busy, now, leadMin = 0 } = o
  const dur = durationMin * MIN
  const buf = win.bufferMin * MIN
  const open = zonedToUtc(date, win.start, tz)
  const close = zonedToUtc(date, win.end, tz)
  const brk = win.breakStart && win.breakEnd ? { start: zonedToUtc(date, win.breakStart, tz), end: zonedToUtc(date, win.breakEnd, tz) } : null
  const earliest = now + leadMin * MIN
  const out: number[] = []
  for (let t = open; t + dur <= close; t += SLOT_STEP_MIN * MIN) {
    const slot = { start: t, end: t + dur }
    if (t < earliest) continue
    if (brk && overlaps(slot, brk)) continue
    if (busy.some((b) => overlaps({ start: slot.start - buf, end: slot.end + buf }, b))) continue
    out.push(t)
  }
  return out
}

/** Union of slot times across several staff members, each tagged with who can take it. */
export function mergeStaffSlots(perStaff: Map<number, number[]>): { start: number; staffIds: number[] }[] {
  const byTime = new Map<number, number[]>()
  for (const [staffId, slots] of perStaff) for (const s of slots) byTime.set(s, [...(byTime.get(s) ?? []), staffId])
  return [...byTime].map(([start, staffIds]) => ({ start, staffIds })).sort((a, b) => a.start - b.start)
}

/** Add `n` calendar days to a "YYYY-MM-DD" string. */
export const addDays = (date: string, n: number) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
