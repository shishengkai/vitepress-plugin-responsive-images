import { describe, expect, it } from 'vitest'
import { normalizeFormats, normalizeOptions, normalizeWidths } from '../src/config'

describe('normalizeFormats', () => {
  it('defaults to AVIF and WebP', () => {
    expect(normalizeFormats()).toEqual(['avif', 'webp'])
    expect(normalizeOptions().formats).toEqual(['avif', 'webp'])
  })

  it('supports explicit format lists', () => {
    expect(normalizeFormats(['avif', 'webp'])).toEqual(['avif', 'webp'])
    expect(normalizeFormats(['webp'])).toEqual(['webp'])
    expect(normalizeFormats(['avif'])).toEqual(['avif'])
  })

  it('keeps AVIF before WebP when both are requested explicitly', () => {
    expect(normalizeFormats(['webp', 'avif'])).toEqual(['avif', 'webp'])
  })

  it('rejects empty format lists', () => {
    expect(() => normalizeFormats([])).toThrow(/at least one modern output format/)
  })
})

describe('normalizeWidths', () => {
  it('allows zero as the original-size sentinel', () => {
    expect(normalizeWidths([0])).toEqual([0])
    expect(normalizeOptions({ widths: [480, 0], defaultWidth: 0 }).widths).toEqual([0, 480])
    expect(normalizeOptions({ widths: [480, 0], defaultWidth: 0 }).defaultWidth).toBe(0)
  })

  it('rejects negative widths and defaultWidth values', () => {
    expect(() => normalizeOptions({ widths: [-1] })).toThrow(/at least one non-negative width/)
    expect(() => normalizeOptions({ defaultWidth: -1 })).toThrow(/defaultWidth must be a non-negative integer/)
  })
})
