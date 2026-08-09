/**
 * District matching — docs/02-app-build-and-data-specification.md §4
 *
 * Strategy:
 *   1. U.S. Census Bureau geocoder (free, no API key) with the
 *      "Public_AR_Current" benchmark and the current TIGERweb vintage.
 *      Its `geographies` endpoint returns State Legislative Districts
 *      (upper + lower) and the Congressional District in one call — no
 *      separate point-in-polygon step needed for the common case.
 *   2. Commercial fallback (Google or Mapbox) for addresses Census cannot
 *      resolve. Keys come from env vars only; the fallback is a no-op
 *      until a key is present.
 *
 * Boundary vintage is stored on every match so a redistricting cycle can
 * be detected and the batch re-run (scripts/rematch-districts.mjs).
 */

export const BOUNDARY_VINTAGE = process.env.CENSUS_VINTAGE ?? 'Current_Current'
const CENSUS_BENCHMARK = process.env.CENSUS_BENCHMARK ?? 'Public_AR_Current'
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies/address'

export type MatchQuality = 'exact' | 'approximate' | 'failed'

export interface DistrictMatch {
  latitude: number | null
  longitude: number | null
  geocoder: 'census' | 'fallback' | null
  matchQuality: MatchQuality
  stateHouse: string | null
  stateSenate: string | null
  congressional: string | null
  county: string | null
  boundaryVintage: string
}

export const FAILED_MATCH: DistrictMatch = {
  latitude: null,
  longitude: null,
  geocoder: null,
  matchQuality: 'failed',
  stateHouse: null,
  stateSenate: null,
  congressional: null,
  county: null,
  boundaryVintage: BOUNDARY_VINTAGE,
}

export interface AddressInput {
  street: string
  city: string
  state: string
  zip: string
}

function pickDistrict(geographies: Record<string, unknown>, pattern: RegExp): string | null {
  for (const [layer, rows] of Object.entries(geographies)) {
    if (!pattern.test(layer)) continue
    const first = Array.isArray(rows) ? (rows[0] as Record<string, unknown> | undefined) : undefined
    if (!first) continue
    const code =
      (first['SLDLST'] as string) ??
      (first['SLDUST'] as string) ??
      (first['CD119'] as string) ??
      (first['CD118'] as string) ??
      (first['BASENAME'] as string) ??
      null
    if (code) return String(code).replace(/^0+/, '') || '0'
  }
  return null
}

export async function matchAddress(address: AddressInput): Promise<DistrictMatch> {
  const params = new URLSearchParams({
    street: address.street,
    city: address.city,
    state: address.state,
    zip: address.zip,
    benchmark: CENSUS_BENCHMARK,
    vintage: BOUNDARY_VINTAGE,
    layers: 'all',
    format: 'json',
  })

  try {
    const res = await fetch(`${CENSUS_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'unlicensed-care-platform/0.1 (True North Strategies)' },
    })
    if (!res.ok) throw new Error(`Census geocoder returned ${res.status}`)

    const body = (await res.json()) as {
      result?: { addressMatches?: Array<Record<string, any>> }
    }
    const match = body.result?.addressMatches?.[0]
    if (!match) return await fallbackMatch(address)

    const geo = (match.geographies ?? {}) as Record<string, unknown>
    const counties = geo['Counties'] as Array<Record<string, unknown>> | undefined

    return {
      latitude: match.coordinates?.y ?? null,
      longitude: match.coordinates?.x ?? null,
      geocoder: 'census',
      matchQuality: 'exact',
      stateHouse: pickDistrict(geo, /State Legislative Districts.*Lower/i),
      stateSenate: pickDistrict(geo, /State Legislative Districts.*Upper/i),
      congressional: pickDistrict(geo, /Congressional Districts/i),
      county: (counties?.[0]?.['BASENAME'] as string) ?? null,
      boundaryVintage: BOUNDARY_VINTAGE,
    }
  } catch {
    return await fallbackMatch(address)
  }
}

/**
 * Commercial fallback. Wire up Google or Mapbox here when a key exists.
 * Returning FAILED_MATCH is deliberate: a supporter is never blocked from
 * signing up because geocoding failed — the record is queued for the
 * re-match batch instead.
 */
async function fallbackMatch(_address: AddressInput): Promise<DistrictMatch> {
  const key = process.env.GEOCODER_FALLBACK_KEY
  if (!key) return FAILED_MATCH
  // TODO: implement Google/Mapbox geocode + point-in-polygon against
  // TIGER/Line shapefiles for GA House, GA Senate, and congressional
  // boundaries. Until then, fail soft.
  return FAILED_MATCH
}
