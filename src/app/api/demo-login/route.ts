import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { createSession } from '@/lib/auth'

const ROLES = ['owner', 'manager', 'specialist', 'client'] as const

/** One-click demo login for reviewers: /api/demo-login?role=owner|manager|specialist|client */
export async function GET(req: Request) {
  const role = new URL(req.url).searchParams.get('role') as (typeof ROLES)[number]
  if (!ROLES.includes(role)) return Response.json({ error: 'Unknown role' }, { status: 400 })
  const db = await getDb()
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.slug, 'baku-clinic'))
  if (role === 'client') {
    await createSession({ role, orgId: org.id, email: 'anna.petrova@example.com', name: 'Anna Petrova' })
    return Response.redirect(new URL('/account', req.url), 303)
  }
  const staff = await db.select().from(schema.users).where(eq(schema.users.orgId, org.id))
  const user = staff.find((u) => u.role === role)!
  await createSession({ role, orgId: org.id, userId: user.id, email: user.email, name: user.fullName })
  return Response.redirect(new URL('/dashboard', req.url), 303)
}
