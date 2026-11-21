import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Role } from '@/db/schema'

export type SessionRole = Role | 'client'
export type Session = { role: SessionRole; orgId: number; userId?: number; email: string; name: string }

const COOKIE = 'nexslot_session'
const key = new TextEncoder().encode(process.env.SESSION_SECRET ?? 'nexslot-demo-secret-change-me-in-production')

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(key)
  ;(await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 86400 })
}

export const destroySession = async () => (await cookies()).delete(COOKIE)

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key)
    return payload as unknown as Session
  } catch {
    return null
  }
}

/** Server-side RBAC guard: redirects anonymous users to /login and forbidden roles to their home page. */
export async function requireRole(...allowed: SessionRole[]): Promise<Session> {
  const s = await getSession()
  if (!s) redirect('/login')
  if (!allowed.includes(s.role)) redirect(s.role === 'client' ? '/account' : '/dashboard')
  return s
}

export const STAFF: SessionRole[] = ['owner', 'manager', 'specialist']
export const MANAGERS: SessionRole[] = ['owner', 'manager']
