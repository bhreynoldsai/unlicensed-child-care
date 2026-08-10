import { describe, expect, it } from 'vitest'

import { __testing } from '@/lib/export'

const { csvCell } = __testing

/**
 * Exported CSVs get opened in Excel and Google Sheets, which execute a leading
 * =, +, -, or @ as a formula. Supporter-supplied text (employer name, "other"
 * role) lands in those cells, so neutralising it is a security control, not
 * formatting.
 */
describe('csv cell escaping', () => {
  /** Unwrap CSV quoting so the assertion sees the cell's actual content. */
  function content(cell: string): string {
    if (!cell.startsWith('"')) return cell
    return cell.slice(1, -1).replace(/""/g, '"')
  }

  it.each(['=1+1', '+1', '-1', '@SUM(A1)', '=HYPERLINK("http://evil","clickme")'])(
    'neutralises the formula trigger in %j',
    (input) => {
      // The apostrophe may sit inside CSV quoting when the value also contains
      // a quote or comma — that still neutralises it in a spreadsheet.
      expect(content(csvCell(input)).startsWith("'")).toBe(true)
    },
  )

  it('quotes and doubles embedded quotes', () => {
    expect(csvCell('Sunrise "Learning" Center')).toBe('"Sunrise ""Learning"" Center"')
  })

  it('quotes values containing commas or newlines', () => {
    expect(csvCell('Atlanta, GA')).toBe('"Atlanta, GA"')
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"')
  })

  it('leaves ordinary values untouched', () => {
    expect(csvCell('Sunrise Learning')).toBe('Sunrise Learning')
    expect(csvCell(58)).toBe('58')
  })

  it('renders null and undefined as empty', () => {
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })
})
