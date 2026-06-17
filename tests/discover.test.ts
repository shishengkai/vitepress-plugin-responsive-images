import { describe, expect, it } from 'vitest'
import {
  discoverImageReferences,
  extractHtmlImageSources,
  extractInlineMarkdownImages,
  extractReferenceImages,
  parseHtmlImgAttributes
} from '../src/discover'

describe('discoverImageReferences', () => {
  it('extracts inline markdown image sources', () => {
    const sources = extractInlineMarkdownImages('![A](./a.png) text ![B](/b.jpg "Title")')
    expect(sources).toEqual(['./a.png', '/b.jpg'])
  })

  it('extracts reference-style image sources', () => {
    const content = `![Dashboard][dash]

![Logo][]

![Shortcut]

[dash]: ./images/dashboard.png
[Logo]: /logo.png
[Shortcut]: ./shortcut.png`

    expect(extractReferenceImages(content)).toEqual([
      { kind: 'markdown-reference', source: './images/dashboard.png', referenceId: 'dash' },
      { kind: 'markdown-reference', source: '/logo.png', referenceId: 'Logo' },
      { kind: 'markdown-reference', source: './shortcut.png', referenceId: 'Shortcut' }
    ])
  })

  it('extracts handwritten html image sources', () => {
    const sources = extractHtmlImageSources('<img alt="x" src=\'./a.png\'> and <img src="/b.jpg" />')
    expect(sources).toEqual(['./a.png', '/b.jpg'])
  })

  it('skips html images inside picture elements', () => {
    const sources = extractHtmlImageSources('<picture><img src="./inside.png"></picture><img src="./outside.png">')
    expect(sources).toEqual(['./outside.png'])
  })

  it('deduplicates mixed image sources', () => {
    const content = `![Inline](./a.png)

<img src="./a.png" alt="HTML">

![Ref][logo]
[logo]: ./a.png`

    expect(discoverImageReferences(content)).toEqual([{ kind: 'markdown-inline', source: './a.png' }])
  })

  it('ignores remote reference definitions', () => {
    const content = `![Remote][remote]

[remote]: https://example.com/image.png`

    expect(extractReferenceImages(content)).toEqual([])
  })
})

describe('parseHtmlImgAttributes', () => {
  it('parses attributes regardless of order', () => {
    expect(parseHtmlImgAttributes('<img alt="Demo" class="hero" src="./demo.png" loading="eager">')).toEqual({
      alt: 'Demo',
      class: 'hero',
      src: './demo.png',
      loading: 'eager'
    })
  })
})
