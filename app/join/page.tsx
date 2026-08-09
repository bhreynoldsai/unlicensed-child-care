/**
 * `/join` is the URL printed on the break room poster and encoded in its QR
 * code. It serves the same page as `/` so a shorter, sayable link can be handed
 * around without a redirect hop on a slow phone connection — and it carries the
 * `?c=` per-center attribution parameter through unchanged.
 */
export { default } from '@/app/page'
