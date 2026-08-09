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
 * TODO before this is reachable by anyone: add authentication.
 * There is no auth here yet — do not deploy /admin publicly.
 */
export default async function AdminPage() {
  let rows: Array<{ state_house: string | null; role: Role; supporter_count: number }> = []
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy-900">District density</h1>
      <p className="mt-1 text-sm text-navy-700">
        Aggregate counts only. Individual enrollment is never reported.
      </p>

      <p className="mt-4 rounded-md border border-gold-300 bg-gold-300/10 px-4 py-3 text-sm text-navy-900">
        <strong>Not yet protected.</strong> Add authentication before deploying this
        route anywhere reachable.
      </p>

      {dbError ? (
        <p className="mt-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-800">
          {dbError}
        </p>
      ) : byDistrict.size === 0 ? (
        <p className="mt-6 text-navy-700">No matched supporters yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-navy-300 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-navy-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-navy-900">GA House district</th>
                {roles.map((r) => (
                  <th key={r} className="px-4 py-3 font-semibold text-navy-900">
                    {ROLE_LABELS[r]}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-navy-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {[...byDistrict.entries()]
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([district, counts]) => {
                  const total = Object.values(counts).reduce((a, b) => a + b, 0)
                  return (
                    <tr key={district}>
                      <td className="px-4 py-3 font-medium text-navy-900">{district}</td>
                      {roles.map((r) => (
                        <td key={r} className="px-4 py-3 text-navy-900/80">
                          {counts[r] ?? 0}
                        </td>
                      ))}
                      <td className="px-4 py-3 font-semibold text-navy-900">{total}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
