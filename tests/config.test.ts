import { describe, expect, it } from 'vitest'
import { normalizeFormats, normalizeOptions, normalizeQuality, normalizeWidths } from '../src/config'

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

describe('normalizeQuality', () => {
  it('allows lossless modern format sentinel quality', () => {
    expect(normalizeQuality({ webp: -1 }).webp).toBe(-1)
    expect(normalizeQuality({ avif: -1 }).avif).toBe(-1)
    expect(normalizeOptions({ quality: { webp: -1, avif: -1 } }).quality).toMatchObject({
      webp: -1,
      avif: -1
    })
  })

  it('allows lossy modern format quality values from 1 to 100', () => {
    expect(normalizeQuality({ webp: 1 }).webp).toBe(1)
    expect(normalizeQuality({ webp: 100 }).webp).toBe(100)
    expect(normalizeQuality({ avif: 1 }).avif).toBe(1)
    expect(normalizeQuality({ avif: 100 }).avif).toBe(100)
  })

  it('rejects unsupported modern format quality values', () => {
    expect(() => normalizeQuality({ webp: -2 })).toThrow(/quality\.webp/)
    expect(() => normalizeQuality({ webp: 0 })).toThrow(/quality\.webp/)
    expect(() => normalizeQuality({ webp: 101 })).toThrow(/quality\.webp/)
    expect(() => normalizeQuality({ avif: -2 })).toThrow(/quality\.avif/)
    expect(() => normalizeQuality({ avif: 0 })).toThrow(/quality\.avif/)
    expect(() => normalizeQuality({ avif: 101 })).toThrow(/quality\.avif/)
  })
})

describe('injectStyles', () => {
  it('defaults to injecting layout styles', () => {
    expect(normalizeOptions().injectStyles).toBe(true)
    expect(normalizeOptions({ injectStyles: false }).injectStyles).toBe(false)
  })
})
