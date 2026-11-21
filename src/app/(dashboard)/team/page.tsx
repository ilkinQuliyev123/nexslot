import { eq } from 'drizzle-orm'
import { changeRole } from '@/app/actions'
import HoursForm from '@/components/dashboard/hours-form'
import { getDb, schema } from '@/db'
import { roles } from '@/db/schema'
import { MANAGERS, requireRole } from '@/lib/auth'

const blurb = { owner: 'Full access, including roles and billing', manager: 'Schedule, services and clients', specialist: 'Sees only their own appointments' } as const

export default async function Team() {
  const s = await requireRole(...MANAGERS)
  const db = await getDb()
  const members = await db.select().from(schema.users).where(eq(schema.users.orgId, s.orgId)).orderBy(schema.users.id)
  const hours = await db.select().from(schema.availability)
  return (
    <>
      <div><h1 className="text-2xl font-bold tracking-tight">Team</h1><p className="text-sm text-muted">Roles control what each person can see and do.{s.role !== 'owner' && ' Only the owner can change roles.'}</p></div>
      <div className="space-y-3">
        {members.map((m) => {
          const own = hours.filter((h) => h.userId === m.id)
          return (
            <section key={m.id} className="rounded-xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-semibold">{m.fullName}{m.id === s.userId && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}</p><p className="text-xs text-muted">{m.email} · {blurb[m.role]}</p></div>
                {s.role === 'owner' && m.id !== s.userId ? (
                  <form action={changeRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={m.id} />
                    <select name="role" defaultValue={m.role} aria-label={`Role for ${m.fullName}`} className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm capitalize">{roles.map((r) => <option key={r} value={r}>{r}</option>)}</select>
                    <button className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:border-brand hover:text-brand">Update</button>
                  </form>
                ) : <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">{m.role}</span>}
              </div>
              {m.role === 'specialist' && (
                <details className="mt-3 border-t border-line pt-3">
                  <summary className="cursor-pointer text-sm font-medium text-brand">Working hours ({own.length} days)</summary>
                  <HoursForm userId={m.id} hours={own} />
                </details>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
