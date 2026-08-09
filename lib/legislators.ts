import { pool } from '@/lib/db'

/**
 * Legislator lookup for the confirmation screen (Doc 02 §6).
 *
 * Refreshed by `npm run legislators:import`. A seat can legitimately be empty
 * between a resignation and its special election, so every field here is
 * nullable and callers must render a missing member as a normal state.
 */

export interface Legislator {
  chamber: 'lower' | 'upper'
  district: string
  name: string
  party: string | null
  email: string | null
  phone: string | null
  url: string | null
}

export interface MatchedLegislators {
  house: Legislator | null
  senate: Legislator | null
}

export async function lookupLegislators(
  houseDistrict: string | null,
  senateDistrict: string | null,
): Promise<MatchedLegislators> {
  if (!houseDistrict && !senateDistrict) return { house: null, senate: null }

  try {
    const { rows } = await pool.query<Legislator>(
      `SELECT chamber, district, name, party, email, phone, url
         FROM legislators
        WHERE (chamber = 'lower' AND district = $1)
           OR (chamber = 'upper' AND district = $2)`,
      [houseDistrict, senateDistrict],
    )

    return {
      house: rows.find((r) => r.chamber === 'lower') ?? null,
      senate: rows.find((r) => r.chamber === 'upper') ?? null,
    }
  } catch (err) {
    // The sign-up is already committed by the time this runs. A roster outage
    // costs a name on the confirmation screen, never the supporter.
    console.error('legislator_lookup_failed', err instanceof Error ? err.message : 'unknown')
    return { house: null, senate: null }
  }
}
