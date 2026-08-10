import type { PoolClient } from 'pg'

import { withTransaction } from '@/lib/db'
import { ROLES, type Role } from '@/lib/validation'

/**
 * Supporter export (Doc 02 §5).
 *
 * Exporting home addresses is the highest-sensitivity operation in the system
 * (Doc 03 §5), so three things are true of every export:
 *
 *   1. It is written to `export_audit` — who ran it, what filter, how many
 *      rows, and which PII columns were included — in the SAME transaction as
 *      the read. An export that is not logged does not happen.
 *   2. Contact details and home address are opt-in per export, not default.
 *      Most operational questions ("how many owners in House 27") need neither.
 *   3. The audit row records the columns actually included, so "who has ever
 *      pulled home addresses" is answerable later.
 *
 * This is campaign-staff tooling. It is NOT the manager-facing surface — that
 * remains the aggregate `district_density` view, and no owner, manager, or
 * sponsor sees this output.
 */

export interface ExportFilter {
  stateHouse?: string | null
  stateSenate?: string | null
  role?: Role | null
  status?: 'active' | 'unsubscribed' | null
  includeContact: boolean
  includeHomeAddress: boolean
}

export interface ExportResult {
  csv: string
  rowCount: number
  includedPii: string[]
}

/**
 * Spreadsheet software treats a leading =, +, -, or @ as a formula, so a
 * supporter who types `=HYPERLINK("http://evil","click")` as their employer
 * name gets it executed when staff open the export. Prefixing with a single
 * quote is the standard neutralisation and is invisible in the cell.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers.map(csvCell).join(',')]
  for (const row of rows) lines.push(row.map(csvCell).join(','))
  // CRLF and a UTF-8 BOM so Excel opens accented names correctly.
  return '﻿' + lines.join('\r\n') + '\r\n'
}

interface SupporterRow {
  created_at: Date
  first_name: string
  last_name: string
  email: string
  cell_phone: string | null
  other_phone: string | null
  home_street: string | null
  home_street2: string | null
  home_city: string | null
  home_state: string | null
  home_zip: string | null
  employer_name: string
  employer_city: string | null
  employer_state: string | null
  employer_zip: string | null
  role: string
  role_other: string | null
  source_center_code: string | null
  status: string
  state_house: string | null
  state_senate: string | null
  congressional: string | null
  county: string | null
  match_quality: string | null
  house_member: string | null
  house_party: string | null
  house_email: string | null
  senate_member: string | null
  senate_party: string | null
  senate_email: string | null
}

async function fetchRows(
  client: PoolClient,
  filter: ExportFilter,
): Promise<SupporterRow[]> {
  const conditions: string[] = []
  const params: unknown[] = []

  const add = (sql: string, value: unknown) => {
    params.push(value)
    conditions.push(sql.replace('$?', `$${params.length}`))
  }

  if (filter.stateHouse) add('home.state_house = $?', filter.stateHouse)
  if (filter.stateSenate) add('home.state_senate = $?', filter.stateSenate)
  if (filter.role) add('s.role = $?::supporter_role', filter.role)
  if (filter.status) add('s.status = $?', filter.status)

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  // The legislator join is what turns a district number into something a
  // volunteer can act on — a name and an office email.
  const { rows } = await client.query<SupporterRow>(
    `SELECT
       s.created_at, s.first_name, s.last_name, s.email,
       s.cell_phone, s.other_phone,
       s.home_street, s.home_street2, s.home_city, s.home_state, s.home_zip,
       s.employer_name, s.employer_city, s.employer_state, s.employer_zip,
       s.role::text AS role, s.role_other, s.source_center_code, s.status,
       home.state_house, home.state_senate, home.congressional, home.county,
       home.match_quality,
       rep.name  AS house_member,  rep.party  AS house_party,  rep.email  AS house_email,
       sen.name  AS senate_member, sen.party  AS senate_party, sen.email  AS senate_email
     FROM supporters s
     LEFT JOIN district_matches home
       ON home.supporter_id = s.id AND home.address_kind = 'home'
     LEFT JOIN legislators rep
       ON rep.chamber = 'lower' AND rep.district = home.state_house
     LEFT JOIN legislators sen
       ON sen.chamber = 'upper' AND sen.district = home.state_senate
     ${where}
     ORDER BY home.state_house NULLS LAST, s.last_name, s.first_name`,
    params,
  )

  return rows
}

export async function exportSupporters(
  adminEmail: string,
  filter: ExportFilter,
): Promise<ExportResult> {
  return withTransaction(async (client) => {
    const rows = await fetchRows(client, filter)

    const headers = [
      'signed_up',
      'first_name',
      'last_name',
      'employer',
      'employer_city',
      'employer_state',
      'employer_zip',
      'role',
      'role_other',
      'ga_house_district',
      'ga_house_member',
      'ga_house_party',
      'ga_house_email',
      'ga_senate_district',
      'ga_senate_member',
      'ga_senate_party',
      'ga_senate_email',
      'congressional_district',
      'county',
      'match_quality',
      'center_code',
      'status',
    ]

    if (filter.includeContact) headers.splice(3, 0, 'email', 'cell_phone', 'other_phone')
    if (filter.includeHomeAddress) {
      headers.push('home_street', 'home_street2', 'home_city', 'home_state', 'home_zip')
    }

    const body = rows.map((r) => {
      const base: unknown[] = [
        r.created_at.toISOString().slice(0, 10),
        r.first_name,
        r.last_name,
      ]
      if (filter.includeContact) base.push(r.email, r.cell_phone, r.other_phone)
      base.push(
        r.employer_name,
        r.employer_city,
        r.employer_state,
        r.employer_zip,
        r.role,
        r.role_other,
        r.state_house,
        r.house_member,
        r.house_party,
        r.house_email,
        r.state_senate,
        r.senate_member,
        r.senate_party,
        r.senate_email,
        r.congressional,
        r.county,
        r.match_quality,
        r.source_center_code,
        r.status,
      )
      if (filter.includeHomeAddress) {
        base.push(r.home_street, r.home_street2, r.home_city, r.home_state, r.home_zip)
      }
      return base
    })

    const includedPii: string[] = []
    if (filter.includeContact) includedPii.push('email', 'cell_phone', 'other_phone')
    if (filter.includeHomeAddress) includedPii.push('home_address')

    // Logged in the same transaction as the read: if the audit row cannot be
    // written, the export does not happen.
    await client.query(
      `INSERT INTO export_audit (admin_email, filter_json, row_count, included_pii)
       VALUES ($1, $2, $3, $4)`,
      [
        adminEmail,
        JSON.stringify({
          stateHouse: filter.stateHouse ?? null,
          stateSenate: filter.stateSenate ?? null,
          role: filter.role ?? null,
          status: filter.status ?? null,
        }),
        rows.length,
        includedPii,
      ],
    )

    return { csv: toCsv(headers, body), rowCount: rows.length, includedPii }
  })
}

export function parseFilter(params: URLSearchParams): ExportFilter {
  const role = params.get('role')
  const status = params.get('status')
  return {
    stateHouse: params.get('house')?.trim() || null,
    stateSenate: params.get('senate')?.trim() || null,
    role: ROLES.includes(role as Role) ? (role as Role) : null,
    status: status === 'active' || status === 'unsubscribed' ? status : null,
    includeContact: params.get('contact') === '1',
    includeHomeAddress: params.get('address') === '1',
  }
}

export const __testing = { csvCell, toCsv }
