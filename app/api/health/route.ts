import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await pool.query('SELECT 1')
    return NextResponse.json({ ok: true, db: 'up' })
  } catch {
    return NextResponse.json({ ok: false, db: 'down' }, { status: 503 })
  }
}
