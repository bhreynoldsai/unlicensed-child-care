/**
 * The GLCCN mark: the outline of Georgia with a gold check inside.
 *
 * Inline SVG rather than the PNG in the handoff, so it stays crisp at any size
 * and can be recoloured for the dark and one-colour lockups. The brand
 * specification calls for a vector asset in production — this is it.
 *
 * Per the handoff README, the mark in the Brand System sheet is one generation
 * behind; the signup page header carries the canonical version reproduced here.
 */
export function BrandMark({
  size = 50,
  outline = '#0F2340',
  check = '#C9A227',
  className,
}: {
  size?: number
  outline?: string
  check?: string
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      className={className}
      role="img"
      aria-label="Georgia Licensed Child Care Network"
    >
      <path
        d="M13 6 L34 6 L34 12 L38 15 L37 19 L41 22 L40 26 L44 29 L42 33 L45 37 L43 40 L46 44 L44 47 L45 51 L41 53 L38 51 L35 53 L31 51 L28 54 L24 52 L20 54 L16 51 L13 51 Z"
        fill="none"
        stroke={outline}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M17 34 L24 41 L38 24"
        fill="none"
        stroke={check}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
