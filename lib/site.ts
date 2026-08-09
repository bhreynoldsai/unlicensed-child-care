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
