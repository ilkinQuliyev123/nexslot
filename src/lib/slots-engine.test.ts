import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dateInZone, generateSlots, mergeStaffSlots, weekday, zonedToUtc } from './slots-engine.ts'

const win = { start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00', bufferMin: 0 }
const base = { date: '2026-03-10', tz: 'Asia/Baku', win, busy: [], now: 0 }
const hm = (ts: number, tz = 'Asia/Baku') => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(ts)

test('zonedToUtc converts Baku (UTC+4) wall time', () => {
  assert.equal(new Date(zonedToUtc('2026-03-10', '09:00', 'Asia/Baku')).toISOString(), '2026-03-10T05:00:00.000Z')
})

test('zonedToUtc handles DST (London summer vs winter)', () => {
  assert.equal(new Date(zonedToUtc('2026-07-01', '12:00', 'Europe/London')).toISOString(), '2026-07-01T11:00:00.000Z')
  assert.equal(new Date(zonedToUtc('2026-01-01', '12:00', 'Europe/London')).toISOString(), '2026-01-01T12:00:00.000Z')
})

test('dateInZone and weekday', () => {
  assert.equal(dateInZone(Date.parse('2026-03-10T21:00:00Z'), 'Asia/Baku'), '2026-03-11')
  assert.equal(weekday('2026-03-10'), 2)
})

test('30-min service fills the working day and skips lunch', () => {
  const s = generateSlots({ ...base, durationMin: 30 }).map((t) => hm(t))
  assert.equal(s[0], '09:00')
  assert.equal(s.at(-1), '17:30')
  assert.ok(!s.includes('13:00') && !s.includes('13:30'))
  assert.equal(s.length, 16)
})

test('60-min service cannot straddle lunch or closing', () => {
  const s = generateSlots({ ...base, durationMin: 60 }).map((t) => hm(t))
  assert.ok(!s.includes('12:30') && s.includes('12:00') && s.includes('14:00') && s.includes('17:00') && !s.includes('17:30'))
})

test('existing bookings and buffer remove neighbouring slots', () => {
  const busy = [{ start: zonedToUtc('2026-03-10', '10:00', 'Asia/Baku'), end: zonedToUtc('2026-03-10', '10:30', 'Asia/Baku') }]
  const noBuf = generateSlots({ ...base, durationMin: 30, busy }).map((t) => hm(t))
  assert.ok(!noBuf.includes('10:00') && noBuf.includes('09:30') && noBuf.includes('10:30'))
  const withBuf = generateSlots({ ...base, win: { ...win, bufferMin: 15 }, durationMin: 30, busy }).map((t) => hm(t))
  assert.ok(!withBuf.includes('09:30') && !withBuf.includes('10:30') && withBuf.includes('09:00') && withBuf.includes('11:00'))
})

test('past slots and lead time are excluded', () => {
  const now = zonedToUtc('2026-03-10', '11:00', 'Asia/Baku')
  const s = generateSlots({ ...base, durationMin: 30, now, leadMin: 60 }).map((t) => hm(t))
  assert.equal(s[0], '12:00')
})

test('mergeStaffSlots unions staff availability', () => {
  const m = mergeStaffSlots(new Map([[1, [10, 20]], [2, [20, 30]]]))
  assert.deepEqual(m, [{ start: 10, staffIds: [1] }, { start: 20, staffIds: [1, 2] }, { start: 30, staffIds: [2] }])
})
