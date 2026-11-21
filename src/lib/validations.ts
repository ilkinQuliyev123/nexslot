import { z } from 'zod'
import { roles, statuses } from '@/db/schema'

export const bookingDetails = z.object({
  name: z.string().trim().min(2, 'Please enter your full name'),
  email: z.email('Enter a valid email address'),
})

export const payment = z.object({
  card: z.string().transform((v) => v.replace(/\s/g, '')).pipe(z.string().regex(/^\d{16}$/, 'Card number must have 16 digits')),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY'),
  cvc: z.string().regex(/^\d{3,4}$/, 'CVC must have 3–4 digits'),
})

export const service = z.object({
  title: z.string().trim().min(2, 'Title is required'),
  description: z.string().trim().max(300, 'Max 300 characters'),
  durationMin: z.coerce.number().int().refine((n) => [15, 30, 45, 60, 90, 120].includes(n), 'Choose 15, 30, 45, 60, 90 or 120 minutes'),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(10_000),
})

export const statusChange = z.object({ id: z.coerce.number().int(), status: z.enum(statuses) })
export const roleChange = z.object({ userId: z.coerce.number().int(), role: z.enum(roles) })
export const note = z.object({ email: z.email(), note: z.string().trim().min(1, 'Note cannot be empty').max(500) })

export const hoursDay = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d\d:\d\d$/),
  endTime: z.string().regex(/^\d\d:\d\d$/),
}).refine((d) => d.startTime < d.endTime, 'End time must be after start time')

/** Flatten zod issues into `{ field: message }` for form display. */
export const fieldErrors = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path[0] ?? '_'), i.message]))
