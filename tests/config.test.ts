import { describe, expect, it } from 'vitest'
import { normalizeFormats, normalizeOptions } from '../src/config'

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
