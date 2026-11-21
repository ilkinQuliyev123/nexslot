# NexSlot — Booking & analytics for service businesses

A multi-tenant SaaS for clinics, studios and consultants: a public booking page for clients, a dashboard for the team, and revenue analytics. Built as a full-stack portfolio project.

**Live demo:** https://ilkin-nexslot.netlify.app — use the one-click role buttons on the landing page (no password).

## Features

- **Booking engine:** services, working hours, lunch breaks, buffers, time-zone aware slots, double-booking prevention with a 5-minute slot hold, demo payment step, `.ics` calendar file.
- **Dashboard:** KPIs (revenue, upcoming bookings, occupancy, cancellation rate), revenue chart, popular services, week/day/month calendar, filterable bookings with status workflow, services CRUD, team and working hours, mini CRM with private notes, CSV export.
- **Roles (RBAC, enforced on the server):** owner, manager, specialist (sees only own appointments), client (own bookings).
- **Multi-tenant:** every business has its own public link, e.g. `/baku-clinic`, `/nova-studio`.
- **Quality:** Zod validation on client and server, skeleton loading, empty states, responsive (mobile stepper), accessible controls.

## Tech

Next.js 16 (App Router, Server Actions), React 19, TypeScript (strict), Tailwind CSS 4, Drizzle ORM, PostgreSQL schema (pg-mem in the demo), Zod, jose (signed sessions), Recharts, Lucide.

## Honest notes about the demo

| Production design | In this demo |
|---|---|
| Neon/Supabase Postgres | In-memory Postgres (`pg-mem`), seeded on start; data resets when the server restarts. Swap the driver in `src/db/index.ts` for `node-postgres` + `DATABASE_URL`; schema and queries are unchanged. |
| Auth.js / OAuth | Signed-cookie demo sessions with real server-side role checks. |
| Stripe Checkout + webhook | Payment provider seam (`demoCharge`). Card `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` is declined. |
| Email (Resend) | Not sent. A `.ics` file is offered on the confirmation page. |
| WebSockets | Server-side slot holds and re-validation on confirm. |

## Architecture

```
src/lib/slots-engine.ts   pure scheduling logic (time zones, DST, breaks, buffers, conflicts) + unit tests
src/lib/booking.ts        availability, 5-min holds, confirm (serialised with a mutex)
src/lib/queries.ts        dashboard KPIs, bookings, clients
src/app/actions.ts        Server Actions with role guards and Zod validation
src/db/                   Drizzle schema, DDL, deterministic seed
```

## Run locally

```bash
npm install
npm run dev
node --test src/lib/slots-engine.test.ts   # engine unit tests
```
