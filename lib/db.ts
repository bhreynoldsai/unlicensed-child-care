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

export const pool: Pool = global.__ucPool ?? createPool()
if (process.env.NODE_ENV !== 'production') global.__ucPool = pool

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
