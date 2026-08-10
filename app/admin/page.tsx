import { cookies } from 'next/headers'

import { AdminBar } from '@/components/AdminBar'
import { SESSION_COOKIE, readSession } from '@/lib/auth'
import { pool } from '@/lib/db'
import { ROLE_LABELS, type Role } from '@/lib/validation'

export const dynamic = 'force-dynamic'

/**
 * Admin dashboard v1 — district density (Doc 02 §5).
 *
 * GUARDRAIL (Doc 03 §4): this page reads ONLY the aggregate
 * `district_density` view. No individual-level enrollment data may ever be
 * surfaced to owners, managers, or the sponsor. If you add a supporter-list
 * screen, it must sit behind campaign-administrator auth and be export-audited.
 *
 * Access is gated by `middleware.ts`. The session is re-read here so the page
 * can name who is signed in — that name is what `export_audit.admin_email`
 * will record once export lands.
 *
 * OPEN DECISION: Doc 03 §4 says to suppress counts below 5 on manager-facing
 * surfaces. This page is campaign staff, not managers, so counts are shown
 * whole. If the sponsor is ever given a login, add suppression before doing so.
 */
export default async function AdminPage() {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value)

  let rows: Array<{ state_house: string | null; role: Role; supporter_count: number }> = []
  let unmatched = { failed: 0, approximate: 0 }
  let dbError: string | null = null

  try {
    const result = await pool.query(
      `SELECT state_house, role, sum(supporter_count)::int AS supporter_count
         FROM district_density
        WHERE state_house IS NOT NULL
        GROUP BY state_house, role
        ORDER BY state_house`,
    )
    rows = result.rows

    // Match quality is an operational number, not a curiosity: an unmatched
    // supporter is a real person whose voice is not yet attached to a district.
    // Counts only — this stays an aggregate surface (Doc 03 §4).
    const quality = await pool.query<{ match_quality: string; n: number }>(
      `SELECT match_quality, count(*)::int AS n
         FROM district_matches
        WHERE address_kind = 'home'
        GROUP BY match_quality`,
    )
    for (const q of quality.rows) {
      if (q.match_quality === 'failed') unmatched.failed = q.n
      if (q.match_quality === 'approximate') unmatched.approximate = q.n
    }
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Database unavailable'
  }

  const byDistrict = new Map<string, Record<string, number>>()
  for (const r of rows) {
    const key = r.state_house ?? '—'
    const entry = byDistrict.get(key) ?? {}
    entry[r.role] = (entry[r.role] ?? 0) + r.supporter_count
    byDistrict.set(key, entry)
  }

  const roles = Object.keys(ROLE_LABELS) as Role[]
  const grandTotal = rows.reduce((sum, r) => sum + r.supporter_count, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AdminBar email={session?.email ?? null} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-[28px] font-bold leading-[1.15]">District density</h1>
        <a
          href="/admin/supporters"
          className="text-sm text-navy-700 underline hover:text-navy-900"
        >
          Supporter list &amp; export →
        </a>
      </div>
      <p className="mt-1 text-sm text-navy-500">
        Aggregate counts only. Individual enrollment is never reported.
      </p>

      {!dbError && (unmatched.failed > 0 || unmatched.approximate > 0) ? (
        <div className="mt-4 rounded-md bg-navy-50 px-[18px] py-4 text-sm leading-[1.55]">
          {unmatched.failed > 0 ? (
            <p>
              <strong className="font-semibold">
                {unmatched.failed} supporter{unmatched.failed === 1 ? '' : 's'}
              </strong>{' '}
              could not be matched to a district. They are signed up but counted
              nowhere. Re-run <code>npm run districts:rematch</code> after any geocoder
              change; addresses the Census database does not contain need a commercial
              fallback or manual resolution.
            </p>
          ) : null}
          {unmatched.approximate > 0 ? (
            <p className={unmatched.failed > 0 ? 'mt-2' : undefined}>
              {unmatched.approximate} matched approximately — the address was resolved
              after normalization and verified against the submitted ZIP, house number,
              and directional.
            </p>
          ) : null}
        </div>
      ) : null}

      {dbError ? (
        <p className="mt-6 rounded-md border-[1.5px] border-danger bg-danger-bg px-4 py-3 text-danger">
          {dbError}
        </p>
      ) : byDistrict.size === 0 ? (
        <p className="mt-6 text-navy-500">No matched supporters yet.</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-navy-500">
            {grandTotal} matched supporter{grandTotal === 1 ? '' : 's'} across{' '}
            {byDistrict.size} House district{byDistrict.size === 1 ? '' : 's'}.
          </p>
          <div className="mt-4 overflow-x-auto rounded-md border-[1.5px] border-navy-100 bg-white">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b-[1.5px] border-navy-100">
                  <th className="px-4 py-3 font-semibold">GA House district</th>
                  {roles.map((r) => (
                    <th key={r} className="px-4 py-3 font-semibold">
                      {ROLE_LABELS[r]}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {[...byDistrict.entries()]
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([district, counts]) => {
                    const total = Object.values(counts).reduce((a, b) => a + b, 0)
                    return (
                      <tr key={district} className="border-b border-navy-100 last:border-0">
                        <td className="px-4 py-3 font-semibold">{district}</td>
                        {roles.map((r) => (
                          <td key={r} className="px-4 py-3 text-navy-500">
                            {counts[r] ?? 0}
                          </td>
                        ))}
                        <td className="px-4 py-3 font-semibold">{total}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
