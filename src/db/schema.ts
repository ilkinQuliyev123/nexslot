import { integer, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const roles = ['owner', 'manager', 'specialist'] as const
export const statuses = ['pending', 'confirmed', 'completed', 'cancelled'] as const
export type Role = (typeof roles)[number]
export type Status = (typeof statuses)[number]

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  tagline: text('tagline').notNull().default(''),
  timezone: text('timezone').notNull(),
  currency: text('currency').notNull().default('USD'),
  logoUrl: text('logo_url'),
  planTier: text('plan_tier').notNull().default('pro'),
})

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull().references(() => organizations.id),
    email: text('email').notNull(),
    fullName: text('full_name').notNull(),
    role: text('role').$type<Role>().notNull(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.orgId, t.email)],
)

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull().references(() => organizations.id),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  durationMin: integer('duration_min').notNull(),
  priceCents: integer('price_cents').notNull(), // money is stored as integer cents
  isActive: integer('is_active').notNull().default(1),
})

export const availability = pgTable('availability', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  bufferMin: integer('buffer_min').notNull().default(0),
  breakStart: text('break_start'),
  breakEnd: text('break_end'),
})

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull().references(() => organizations.id),
  serviceId: integer('service_id').notNull().references(() => services.id),
  staffId: integer('staff_id').notNull().references(() => users.id),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(), // UTC
  endAt: timestamp('end_at', { withTimezone: true }).notNull(), // UTC
  status: text('status').$type<Status>().notNull(),
  priceCents: integer('price_cents').notNull(),
  stripeSessionId: text('stripe_session_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Temporary 5-minute lock on a slot while the client is paying. */
export const holds = pgTable('holds', {
  id: text('id').primaryKey(),
  orgId: integer('org_id').notNull().references(() => organizations.id),
  serviceId: integer('service_id').notNull().references(() => services.id),
  staffId: integer('staff_id').notNull().references(() => users.id),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export const clientNotes = pgTable('client_notes', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull().references(() => organizations.id),
  clientEmail: text('client_email').notNull(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
