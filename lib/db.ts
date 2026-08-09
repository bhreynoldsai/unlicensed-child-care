import { Pool } from 'pg'

/**
 * All credentials come from environment variables (Doc 02 §8).
 * Never hardcode a connection string or paste one into chat.
 */
declare global {
  // eslint-disable-next-line no-var
  var __ucPool: Pool | undefined
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.')
  }
  return new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    max: 10,
  })
}

/**
 * The pool is created on first use, not at import.
 *
 * Building at module scope means a missing DATABASE_URL throws while Next is
 * collecting route config, which fails the build with an error that points at
 * the framework rather than at the missing variable. Deferring it turns that
 * into a clear runtime error on the one request that needed a database, and
 * lets the static pages — including the poster and the privacy notice — build
 * and serve regardless.
 */
function getPool(): Pool {
  if (!global.__ucPool) {
    const created = createPool()
    // In development the module can be re-evaluated on every hot reload; caching
    // the pool globally stops each reload leaking a fresh set of connections.
    global.__ucPool = created
    return created
  }
  return global.__ucPool
}

export const pool = {
  query: ((...args: Parameters<Pool['query']>) =>
    getPool().query(...args)) as Pool['query'],
  connect: () => getPool().connect(),
}

export async function withTransaction<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
