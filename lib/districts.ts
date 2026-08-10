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
const ONELINE_URL = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress'

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

/**
 * Guards against the failure mode that matters most here.
 *
 * Relaxing a query to rescue an address the geocoder could not resolve exactly
 * does not fail cleanly — it returns a *different* address. Observed: asking
 * for "1500 N Patterson St, 31698" without the ZIP returns "1500 S PATTERSON
 * ST, 31601" — a different street, in a different ZIP.
 *
 * In that particular instance both addresses happen to sit in the same
 * districts, which is exactly why the substitution is dangerous: you cannot
 * tell from the response whether it changed the answer, and across a state it
 * often will. Filing a supporter under the wrong legislator is worse than
 * filing them under none, because nobody detects it.
 *
 * So a relaxed result is accepted only when the address that came back still
 * agrees with what was typed on the three things that move a district line:
 * the house number, the ZIP, and the street's directional prefix or suffix.
 */
const DIRECTIONALS = /\b(N|S|E|W|NE|NW|SE|SW|NORTH|SOUTH|EAST|WEST)\b/g

function houseNumber(street: string): string | null {
  return street.trim().match(/^(\d+)/)?.[1] ?? null
}

function directionals(street: string): string {
  const found = street.toUpperCase().match(DIRECTIONALS) ?? []
  // Normalize the spelled-out forms so "North" and "N" compare equal.
  return [...new Set(found.map((d) => d[0] + (d.length > 2 ? '' : d.slice(1))))].sort().join('')
}

export function relaxedMatchIsTrustworthy(submitted: AddressInput, matched: string): boolean {
  const upper = matched.toUpperCase()

  const submittedZip = submitted.zip.slice(0, 5)
  const matchedZip = upper.match(/\b(\d{5})(?:-\d{4})?\b\s*$/)?.[1] ?? upper.match(/\b(\d{5})\b/)?.[1]
  if (!matchedZip || matchedZip !== submittedZip) return false

  const submittedNumber = houseNumber(submitted.street)
  const matchedNumber = houseNumber(upper)
  if (submittedNumber && matchedNumber !== submittedNumber) return false

  // A directional the submitter wrote must survive; one they omitted may be
  // added by normalization, so only a contradiction is disqualifying.
  const submittedDirs = directionals(submitted.street)
  if (submittedDirs && directionals(upper) !== submittedDirs) return false

  return true
}

/** Unit designators confuse the Census parser more often than they help it. */
function stripUnit(street: string): string {
  return street
    .replace(/\b(APT|APARTMENT|UNIT|STE|SUITE|BLDG|BUILDING|FL|FLOOR|RM|ROOM)\b\.?\s*[\w-]*/gi, '')
    .replace(/#\s*[\w-]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
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

/** Run one Census query and shape the winner, or null if nothing came back. */
async function queryCensus(
  params: URLSearchParams,
  quality: MatchQuality,
  url: string = CENSUS_URL,
): Promise<(DistrictMatch & { matchedAddress: string }) | null> {
  const res = await fetch(`${url}?${params.toString()}`, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'unlicensed-care-platform/0.1 (True North Strategies)' },
  })
  if (!res.ok) throw new Error(`Census geocoder returned ${res.status}`)

  const body = (await res.json()) as { result?: { addressMatches?: Array<Record<string, any>> } }
  const match = body.result?.addressMatches?.[0]
  if (!match) return null

  const geo = (match.geographies ?? {}) as Record<string, unknown>
  const counties = geo['Counties'] as Array<Record<string, unknown>> | undefined

  return {
    matchedAddress: String(match.matchedAddress ?? ''),
    latitude: match.coordinates?.y ?? null,
    longitude: match.coordinates?.x ?? null,
    geocoder: 'census',
    matchQuality: quality,
    stateHouse: pickDistrict(geo, /State Legislative Districts.*Lower/i),
    stateSenate: pickDistrict(geo, /State Legislative Districts.*Upper/i),
    congressional: pickDistrict(geo, /Congressional Districts/i),
    county: (counties?.[0]?.['BASENAME'] as string) ?? null,
    boundaryVintage: BOUNDARY_VINTAGE,
  }
}

export async function matchAddress(address: AddressInput): Promise<DistrictMatch> {
  const base = {
    city: address.city,
    state: address.state,
    benchmark: CENSUS_BENCHMARK,
    vintage: BOUNDARY_VINTAGE,
    layers: 'all',
    format: 'json',
  }

  try {
    // 1. Exactly what was typed. Anything this returns is trusted as-is.
    const exact = await queryCensus(
      new URLSearchParams({ ...base, street: address.street, zip: address.zip }),
      'exact',
    )
    if (exact) {
      const { matchedAddress: _ignored, ...match } = exact
      return match
    }

    // 2. Same address with the unit designator removed. Census parses
    //    "1200 Peachtree St NE Apt 4" less reliably than the street alone, and
    //    a unit never changes which district a building sits in.
    const stripped = stripUnit(address.street)
    if (stripped && stripped !== address.street) {
      const relaxed = await queryCensus(
        new URLSearchParams({ ...base, street: stripped, zip: address.zip }),
        'approximate',
      )
      if (relaxed && relaxedMatchIsTrustworthy(address, relaxed.matchedAddress)) {
        const { matchedAddress: _ignored, ...match } = relaxed
        return match
      }
    }

    // 3. One-line parse, which sometimes handles abbreviations and ordering the
    //    structured endpoint rejects. Verified before it is believed.
    const oneline = await queryCensus(
      new URLSearchParams({
        address: `${address.street}, ${address.city}, ${address.state} ${address.zip}`,
        benchmark: CENSUS_BENCHMARK,
        vintage: BOUNDARY_VINTAGE,
        layers: 'all',
        format: 'json',
      }),
      'approximate',
      ONELINE_URL,
    )
    if (oneline && relaxedMatchIsTrustworthy(address, oneline.matchedAddress)) {
      const { matchedAddress: _ignored, ...match } = oneline
      return match
    }

    // Something came back but could not be trusted — that is a failure, not a
    // result. Better a blank district than a confidently wrong one.
    return await fallbackMatch(address)
  } catch {
    return await fallbackMatch(address)
  }
}

const MAPBOX_URL = 'https://api.mapbox.com/search/geocode/v6/forward'
const CENSUS_COORDS_URL =
  'https://geocoding.geo.census.gov/geocoder/geographies/coordinates'

/**
 * Mapbox reports per-component results. We require the parts that can move a
 * district line to have matched outright — a "confidence: high" result whose
 * house number was merely approximated can sit on the wrong side of a boundary.
 */
interface MapboxMatchCode {
  address_number?: string
  street?: string
  postcode?: string
  region?: string
  confidence?: string
}

function mapboxResultIsTrustworthy(
  submitted: AddressInput,
  matchCode: MapboxMatchCode | undefined,
  returnedPostcode: string | undefined,
  returnedRegion: string | undefined,
): boolean {
  if (!matchCode) return false
  if (matchCode.confidence !== 'exact' && matchCode.confidence !== 'high') return false
  if (matchCode.address_number !== 'matched') return false
  if (matchCode.street !== 'matched') return false

  // The same rule the Census ladder applies: the answer has to still describe
  // the address that was typed.
  if (returnedPostcode && returnedPostcode.slice(0, 5) !== submitted.zip.slice(0, 5)) return false
  if (returnedRegion && returnedRegion.toUpperCase() !== submitted.state.toUpperCase()) return false

  return true
}

/**
 * Commercial fallback for addresses the Census address database does not hold —
 * newer suburban streets, most commonly. Census coverage gaps are real: the
 * first live sign-up on this platform was one.
 *
 * Two steps, both cheap:
 *   1. Mapbox resolves the address to coordinates (100k/month free).
 *   2. Census resolves those coordinates to districts, via its `coordinates`
 *      endpoint — so no TIGER/Line shapefiles and no point-in-polygon code,
 *      and the district boundaries still come from the same authority the
 *      primary path uses.
 *
 * Quality is recorded as `approximate` because the address was not matched by
 * Census itself. A supporter is never blocked from signing up if this fails;
 * the record is left for the re-match batch.
 */
async function fallbackMatch(address: AddressInput): Promise<DistrictMatch> {
  const key = process.env.GEOCODER_FALLBACK_KEY?.trim()
  if (!key) return FAILED_MATCH

  try {
    const query = `${address.street}, ${address.city}, ${address.state} ${address.zip}`
    const params = new URLSearchParams({
      q: query,
      country: 'US',
      limit: '1',
      access_token: key,
    })

    const geo = await fetch(`${MAPBOX_URL}?${params}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!geo.ok) throw new Error(`Mapbox returned ${geo.status}`)

    const feature = ((await geo.json()) as { features?: Array<Record<string, any>> })
      .features?.[0]
    const props = feature?.properties
    const coords = props?.coordinates
    if (!coords?.latitude || !coords?.longitude) return FAILED_MATCH

    if (
      !mapboxResultIsTrustworthy(
        address,
        props.match_code,
        props.context?.postcode?.name,
        props.context?.region?.region_code,
      )
    ) {
      return FAILED_MATCH
    }

    const censusParams = new URLSearchParams({
      x: String(coords.longitude),
      y: String(coords.latitude),
      benchmark: CENSUS_BENCHMARK,
      vintage: BOUNDARY_VINTAGE,
      layers: 'all',
      format: 'json',
    })

    const res = await fetch(`${CENSUS_COORDS_URL}?${censusParams}`, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'unlicensed-care-platform/0.1 (True North Strategies)' },
    })
    if (!res.ok) throw new Error(`Census coordinate lookup returned ${res.status}`)

    const geographies = ((await res.json()) as { result?: { geographies?: Record<string, unknown> } })
      .result?.geographies
    if (!geographies) return FAILED_MATCH

    const counties = geographies['Counties'] as Array<Record<string, unknown>> | undefined

    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      geocoder: 'fallback',
      matchQuality: 'approximate',
      stateHouse: pickDistrict(geographies, /State Legislative Districts.*Lower/i),
      stateSenate: pickDistrict(geographies, /State Legislative Districts.*Upper/i),
      congressional: pickDistrict(geographies, /Congressional Districts/i),
      county: (counties?.[0]?.['BASENAME'] as string) ?? null,
      boundaryVintage: BOUNDARY_VINTAGE,
    }
  } catch (err) {
    console.error('fallback_geocode_failed', err instanceof Error ? err.message : 'unknown')
    return FAILED_MATCH
  }
}

export { mapboxResultIsTrustworthy }
