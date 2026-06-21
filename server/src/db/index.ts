import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('Unexpected pg pool error:', err)
  process.exit(-1)
})

export async function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  if (process.env.NODE_ENV !== 'production') {
    console.log('query', { text: text.slice(0, 80), duration, rows: res.rowCount })
  }
  return res.rows as T[]
}
