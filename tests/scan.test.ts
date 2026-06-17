import { describe, expect, it } from 'vitest'
import { extractMarkdownImageSources } from '../src/scan'

describe('extractMarkdownImageSources', () => {
  it('extracts standard markdown image sources', () => {
    const sources = extractMarkdownImageSources('![A](./a.png) text ![B](/b.jpg "Title")')
    expect(sources).toEqual(['./a.png', '/b.jpg'])
  })
})
