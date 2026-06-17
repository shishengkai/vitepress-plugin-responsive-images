import { describe, expect, it } from 'vitest'
import { normalizeOptions } from '../src/config'
import { renderPicture } from '../src/render'
import type { ManifestEntry } from '../src/types'

describe('renderPicture', () => {
  it('renders sources and fallback image', () => {
    const options = normalizeOptions({ formats: ['webp'] })
    const entry: ManifestEntry = {
      key: 'page.md::./image.png',
      markdownPath: '/docs/page.md',
      source: './image.png',
      sourcePath: '/docs/image.png',
      sourceWidth: 1200,
      sourceHeight: 600,
      displayWidth: 720,
      displayHeight: 360,
      sources: {
        webp: [
          { width: 480, path: '/tmp/image-480.webp', url: '/_responsive-images/image-480.webp' },
          { width: 720, path: '/tmp/image-720.webp', url: '/_responsive-images/image-720.webp' }
        ]
      },
      fallback: {
        format: 'png',
        src: '/_responsive-images/image-720.png',
        candidates: [
          { width: 480, path: '/tmp/image-480.png', url: '/_responsive-images/image-480.png' },
          { width: 720, path: '/tmp/image-720.png', url: '/_responsive-images/image-720.png' }
        ]
      }
    }

    const html = renderPicture(entry, options, { alt: 'Dashboard <screenshot>' })

    expect(html).toContain('<picture>')
    expect(html).toContain('type="image/webp"')
    expect(html).toContain('srcset="/_responsive-images/image-480.webp 480w, /_responsive-images/image-720.webp 720w"')
    expect(html).toContain('alt="Dashboard &lt;screenshot&gt;"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('decoding="async"')
  })
})
