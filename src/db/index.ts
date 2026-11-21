import { drizzle, type PgRemoteDatabase } from 'drizzle-orm/pg-proxy'
import { newDb } from 'pg-mem'
import { ddl } from './ddl'
import { seed } from './seed'
import * as schema from './schema'

export type DB = PgRemoteDatabase<typeof schema>

// In-memory Postgres (pg-mem) so the demo runs anywhere with zero external services.
// For production: replace this file's driver with `drizzle-orm/node-postgres` + DATABASE_URL (Neon/Supabase).
// Schema and queries stay unchanged.
const g = globalThis as unknown as { __nexslotDb?: Promise<DB> }

async function init(): Promise<DB> {
  const mem = newDb()
  mem.public.none(ddl)
  const pool = new (mem.adapters.createPg().Pool)()
  const db = drizzle(
    async (text, values, method) => {
      const res = await pool.query(text, values)
      // pg-mem has no rowMode: 'array'. Its object rows keep select-list order, so Object.values gives drizzle what it expects.
      // Constraint: avoid selecting two columns with the same name in one query (they would collapse into one key).
      return { rows: method === 'all' ? res.rows.map(Object.values) : res.rows }
    },
    { schema },
  )
  await seed(db)
  return db
}

export const getDb = () => (g.__nexslotDb ??= init())
export { schema }
