import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveImageSource, shouldSkipSource } from '../src/path'

describe('path resolution', () => {
  it('skips remote and unsupported sources', () => {
    expect(shouldSkipSource('https://example.com/a.png', ['svg', 'gif'])).toBe(true)
    expect(shouldSkipSource('data:image/png;base64,abc', ['svg', 'gif'])).toBe(true)
    expect(shouldSkipSource('./icon.svg', ['svg', 'gif'])).toBe(true)
    expect(shouldSkipSource('./photo.jpg', ['svg', 'gif'])).toBe(false)
  })

  it('resolves relative markdown image paths', () => {
    const resolved = resolveImageSource({
      root: '/repo/docs',
      markdownPath: '/repo/docs/guide/page.md',
      source: './images/a.png',
      skipFormats: ['svg', 'gif']
    })

    expect(resolved?.sourcePath).toBe(path.resolve('/repo/docs/guide/images/a.png'))
    expect(resolved?.key).toBe('/repo/docs/guide/page.md::./images/a.png')
  })

  it('resolves public absolute image paths', () => {
    const resolved = resolveImageSource({
      root: '/repo/docs',
      markdownPath: '/repo/docs/page.md',
      source: '/images/a.png',
      skipFormats: ['svg', 'gif']
    })

    expect(resolved?.sourcePath).toBe(path.resolve('/repo/docs/public/images/a.png'))
  })
})
