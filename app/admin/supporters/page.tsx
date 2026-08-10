import { cookies } from 'next/headers'
import Link from 'next/link'

import { AdminBar } from '@/components/AdminBar'
import { SESSION_COOKIE, readSession } from '@/lib/auth'
import { pool } from '@/lib/db'
import { ROLES, ROLE_LABELS, type Role } from '@/lib/validation'

export const dynamic = 'force-dynamic'

/**
 * Supporter list — campaign staff only.
 *
 * Doc 03 §4 permits this screen explicitly: "If you add a supporter-list
 * screen, it must sit behind campaign-administrator auth and be
 * export-audited." Both hold — `middleware.ts` gates the route, and pulling the
 * data out goes through /api/admin/export, which writes an `export_audit` row.
 *
 * What this screen deliberately does NOT show by default: home address, email,
 * and phone. Answering "how many owners in House 27, and who is their
 * representative" needs none of them, and the minimum-necessary rule (Doc 02
 * §2) applies to reading as much as to exporting. They come down the CSV when
 * someone asks for them, and that request is logged.
 *
 * This is not, and must never become, a manager-facing surface. Owners,
 * directors, and the sponsor see the aggregate view on /admin.
 */

interface Row {
  id: string
  created_at: Date
  first_name: string
  last_name: string
  employer_name: string
  home_city: string | null
  role: Role
  role_other: string | null
  status: string
  state_house: string | null
  state_senate: string | null
  match_quality: string | null
  house_member: string | null
  senate_member: string | null
}

export default async function SupportersPage({
  searchParams,
}: {
  searchParams: Promise<{ house?: string; role?: string; status?: string }>
}) {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value)
  const { house, role, status } = await searchParams

  const conditions: string[] = []
  const params: unknown[] = []
  if (house?.trim()) {
    params.push(house.trim())
    conditions.push(`home.state_house = $${params.length}`)
  }
  if (role && ROLES.includes(role as Role)) {
    params.push(role)
    conditions.push(`s.role = $${params.length}::supporter_role`)
  }
  if (status === 'active' || status === 'unsubscribed') {
    params.push(status)
    conditions.push(`s.status = $${params.length}`)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  let rows: Row[] = []
  let total = 0
  let dbError: string | null = null

  try {
    const result = await pool.query<Row>(
      `SELECT s.id, s.created_at, s.first_name, s.last_name, s.employer_name,
              s.home_city, s.role, s.role_other, s.status,
              home.state_house, home.state_senate, home.match_quality,
              rep.name AS house_member, sen.name AS senate_member
         FROM supporters s
         LEFT JOIN district_matches home
           ON home.supporter_id = s.id AND home.address_kind = 'home'
         LEFT JOIN legislators rep
           ON rep.chamber = 'lower' AND rep.district = home.state_house
         LEFT JOIN legislators sen
           ON sen.chamber = 'upper' AND sen.district = home.state_senate
         ${where}
        ORDER BY s.created_at DESC
        LIMIT 500`,
      params,
    )
    rows = result.rows
    total = (await pool.query<{ n: number }>(`SELECT count(*)::int AS n FROM supporters`))
      .rows[0]!.n
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Database unavailable'
  }

  const query = new URLSearchParams()
  if (house?.trim()) query.set('house', house.trim())
  if (role) query.set('role', role)
  if (status) query.set('status', status)
  const filterSuffix = query.toString() ? `&${query}` : ''

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <AdminBar email={session?.email ?? null} />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[28px] font-bold">Supporters</h1>
          <p className="mt-1 text-sm text-navy-500">
            {rows.length === total
              ? `${total} total`
              : `showing ${rows.length} of ${total}`}
            . Campaign staff only — never shared with employers or the sponsor.
          </p>
        </div>
        <Link href="/admin" className="text-sm text-navy-700 underline hover:text-navy-900">
          ← District density
        </Link>
      </div>

      {/* Filters are plain GET params so a useful view is a shareable URL. */}
      <form method="get" className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="field-label" htmlFor="house">
            House district
          </label>
          <input
            className="field-input w-32"
            id="house"
            name="house"
            inputMode="numeric"
            defaultValue={house ?? ''}
            placeholder="any"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="role">
            Role
          </label>
          <select className="field-input w-56" id="role" name="role" defaultValue={role ?? ''}>
            <option value="">Any role</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="status">
            Status
          </label>
          <select
            className="field-input w-44"
            id="status"
            name="status"
            defaultValue={status ?? ''}
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>
        <button type="submit" className="btn-primary w-auto px-6">
          Apply
        </button>
      </form>

      <div className="card mb-6 p-4">
        <h2 className="mb-1 font-heading text-base font-bold">Download</h2>
        <p className="mb-3 text-sm text-navy-500">
          Every download is recorded in <code>export_audit</code> with your email, the
          filter, the row count, and which personal columns were included.
        </p>
        <div className="flex flex-wrap gap-2">
          <a className="btn-gold" href={`/api/admin/export?x=1${filterSuffix}`}>
            CSV — districts &amp; legislators
          </a>
          <a className="btn-gold" href={`/api/admin/export?contact=1${filterSuffix}`}>
            + email &amp; phone
          </a>
          <a
            className="btn-gold"
            href={`/api/admin/export?contact=1&address=1${filterSuffix}`}
          >
            + home addresses
          </a>
        </div>
        <p className="mt-3 text-sm text-navy-500">
          Home addresses are the most sensitive data here (Doc 03 §5). Pull them only
          when the task genuinely needs them.
        </p>
      </div>

      {dbError ? (
        <p className="rounded-md border-[1.5px] border-danger bg-danger-bg px-4 py-3 text-danger">
          {dbError}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-navy-500">No supporters match that filter yet.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-navy-100 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Employer</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">GA House</th>
                <th className="px-4 py-3 font-semibold">GA Senate</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-navy-100 last:border-0">
                  <td className="px-4 py-3 font-semibold">
                    {r.first_name} {r.last_name}
                    <div className="text-xs font-normal text-navy-500">
                      {r.created_at.toISOString().slice(0, 10)}
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.employer_name}</td>
                  <td className="px-4 py-3">{r.home_city ?? '—'}</td>
                  <td className="px-4 py-3">
                    {ROLE_LABELS[r.role] ?? r.role}
                    {r.role_other ? (
                      <div className="text-xs text-navy-500">{r.role_other}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {r.state_house ? (
                      <>
                        <span className="font-semibold">{r.state_house}</span>
                        <div className="text-xs text-navy-500">
                          {r.house_member ?? 'seat vacant'}
                        </div>
                      </>
                    ) : (
                      <span className="text-danger">unmatched</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.state_senate ? (
                      <>
                        <span className="font-semibold">{r.state_senate}</span>
                        <div className="text-xs text-navy-500">
                          {r.senate_member ?? 'seat vacant'}
                        </div>
                      </>
                    ) : (
                      <span className="text-danger">unmatched</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'active' ? (
                      <span className="text-navy-500">active</span>
                    ) : (
                      <span className="font-semibold text-danger">{r.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
