/**
 * Site-level constants. The public origin is read from the environment so the
 * share link on the confirmation screen and the QR code on the break room
 * poster cannot drift apart.
 */

const RAW_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://galicensedcare.org'

export const SITE_URL = RAW_URL.replace(/\/+$/, '')

/** Printed on the poster and handed around by supporters. */
export const SHARE_URL = `${SITE_URL}/join`

export const SITE_NAME = 'Georgia Licensed Child Care Network'

/**
 * Where a supporter reports a wrong legislator match. This is the feedback loop
 * that catches bad geocodes — the person reading the name is the only one who
 * knows it is wrong. Until it is set, the confirmation screen makes no promise
 * it cannot keep.
 */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null
