# NexSlot — Multi-tenant booking & analytics SaaS (Upwork portfolio)

Source spec: Desktop PDF "NexSlot - Upwork Portfolio Layihə Planı və Dizayn" (Azerbaijani). Repo: github.com/ilkinQuliyev123/nexslot (public). Live: Netlify `ilkin-nexslot`.

## Rules (from the owner — follow always)
1. **Log every change here.** After each piece of work update "Progress"; when resuming, read this file first and continue from "Next steps".
2. **Save tokens:** smart, working, short code — like a senior engineer. No boilerplate, dead code or over-engineering.
3. **Test as you build.** Run it and verify every flow end to end before marking it done.
4. **UI:** modest, clean, not bloated, pleasant. Spec design: "Clean Neo-Swiss SaaS" (tokens below).
5. **Stack:** TypeScript + Tailwind CSS; latest libraries; Lucide icons.
6. **Portfolio language is English** (UI, README). Spec is Azerbaijani.
7. Do not copy brands/assets of other sites.
8. **Model routing:** simple/mechanical work -> lighter models (Agent `model: "haiku"|"sonnet"`); complex work (architecture, algorithms, tricky bugs, review) -> strongest model.
9. This folder sits inside the Desktop git repo: always `git init` inside the project, never `git add` from the parent.

## Deviations from the spec (be honest in README/portfolio)
- DB: Drizzle ORM + **pg-mem** (in-memory Postgres, seeded at start) instead of Neon/Supabase: PGlite WASM needed 9–21 s to boot here, unusable on serverless. Swap driver to node-postgres + DATABASE_URL for production; schema/queries unchanged. State resets on cold start.
- Auth: signed-cookie (jose) demo sessions with real server-side RBAC instead of Auth.js/Clerk (no OAuth keys).
- Payments: provider interface + demo card step (4242… succeeds, 4000 0000 0000 0002 declines). Stripe Checkout needs account keys -> not wired.
- Email: no Resend; `.ics` download on the confirmation page instead.
- Realtime: slot holds (5 min) enforced server-side + re-check on confirm, instead of WebSockets.
- Next.js 16 / React 19 (newer than the spec's 15). `cacheComponents` turned off (dynamic app).
- pg-mem limits: no `group by ... ::int` raw SQL; aggregate in JS. Never select two same-named columns in one query (driver maps rows by `Object.values`).

## Design tokens
Primary #2563EB (hover #1D4ED8) · canvas #F8FAFC · surface #FFFFFF · ink #0F172A · muted #64748B · border #E2E8F0 · status #10B981 / #F59E0B / #EF4444. Fonts: Inter; JetBrains Mono for prices/times/IDs.

## RBAC
owner: everything incl. role changes · manager: dashboard, calendar, bookings, services, clients, team (view+hours), no role changes · specialist: own dashboard/calendar/bookings only · client: /account only.

## Progress
- [x] Scaffold Next 16 + Tailwind 4, deps (drizzle-orm, pg-mem, zod, jose, recharts, lucide-react)
- [x] `src/lib/slots-engine.ts` pure engine (tz/DST, lunch, buffer, conflicts) + 8 node:test unit tests (`node --test src/lib/slots-engine.test.ts`)
- [x] DB: schema.ts, ddl.ts, seed.ts (2 orgs, 7 staff, 8 services, ~300 bookings skewed to recent days), index.ts (pg-mem via drizzle pg-proxy), init ~4 s
- [x] Phase 1-2: tokens/fonts, demo auth (jose cookie) + RBAC guards, landing (hero, live widget, features, one-click demo roles, pricing switcher)
- [x] Phase 3: public booking widget (3-col desktop, mobile stepper), slots API, 5-min holds, demo payment, confirmation, .ics
- [x] Phase 4: dashboard KPIs + Recharts, calendar (day/week/month), bookings (filters, status workflow, pagination, CSV), services CRUD (dialog), team (roles, hours), clients (notes, CSV), settings, client /account
- [x] Phase 5: loading skeleton, empty states, zod errors, 404, mobile checks
- [x] Playwright E2E script (50 checks: pricing, API, booking+conflict+declined card, RBAC, CRUD, CSV, calendar, mobile) all pass; tsc clean
- [ ] GitHub repo pushed, Netlify deploy `ilkin-nexslot`, portfolio card + screenshot
- Known gaps: hold expiry (5 min) not covered by E2E; Stripe/Resend/Auth.js/WebSockets are simulated (see Deviations); state resets on cold start.

## Next steps
1. Push to GitHub (public) and deploy to Netlify; verify live URL with the E2E script.
2. Add portfolio card + screenshots, redeploy portfolio, update CV link if the portfolio URL changes.
