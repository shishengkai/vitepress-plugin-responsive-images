import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import { normalizeOptions } from '../src/config'
import { transformHtmlImageTags } from '../src/htmlTransform'
import { responsiveImagesMarkdownPlugin } from '../src/markdownPlugin'
import { renderPicture } from '../src/render'
import { createRuntime } from '../src/runtime'
import type { ManifestEntry } from '../src/types'

describe('transformHtmlImageTags', () => {
  const markdownPath = '/project/docs/page.md'
  const entry: ManifestEntry = {
    key: `${markdownPath}::./image.png`,
    markdownPath: '/project/docs/page.md',
    source: './image.png',
    sourcePath: '/project/docs/image.png',
    sourceWidth: 1200,
    sourceHeight: 600,
    displayWidth: 720,
    displayHeight: 360,
    sources: {
      webp: [{ width: 720, path: '/tmp/image-720.webp', url: '/_responsive-images/image-720.webp' }]
    },
    fallback: {
      format: 'png',
      src: '/_responsive-images/image-720.png',
      candidates: [{ width: 720, path: '/tmp/image-720.png', url: '/_responsive-images/image-720.png' }]
    }
  }

  it('replaces handwritten img tags when manifest entries exist', () => {
    const runtime = createRuntime({ formats: ['webp'] })
    runtime.root = '/project/docs'
    runtime.manifest.set(entry.key, entry)

    const html = transformHtmlImageTags('<img class="demo" src="./image.png" alt="Demo & More" loading="eager">', runtime, {
      path: markdownPath
    })

    expect(html).toContain('<picture>')
    expect(html).toContain('class="demo"')
    expect(html).toContain('loading="eager"')
    expect(html).toContain('alt="Demo &amp; More"')
    expect(html).not.toContain('<img class="demo" src="./image.png"')
  })

  it('leaves img tags unchanged when manifest entries are missing', () => {
    const runtime = createRuntime({ formats: ['webp'] })
    runtime.root = '/project/docs'

    const original = '<img src="./missing.png" alt="Missing">'
    expect(transformHtmlImageTags(original, runtime, { path: markdownPath })).toBe(original)
  })

  it('does not rewrite img tags inside picture elements', () => {
    const runtime = createRuntime({ formats: ['webp'] })
    runtime.root = '/project/docs'
    runtime.manifest.set(entry.key, entry)

    const original = '<picture><img src="./image.png" alt="Existing"></picture>'
    expect(transformHtmlImageTags(original, runtime, { path: markdownPath })).toBe(original)
  })
})

describe('responsiveImagesMarkdownPlugin html rendering', () => {
  const markdownPath = '/project/docs/page.md'
  const manifestEntry: ManifestEntry = {
    key: `${markdownPath}::./image.png`,
    markdownPath,
    source: './image.png',
    sourcePath: '/project/docs/image.png',
    sourceWidth: 1200,
    sourceHeight: 600,
    displayWidth: 720,
    displayHeight: 360,
    sources: {
      webp: [{ width: 720, path: '/tmp/image-720.webp', url: '/_responsive-images/image-720.webp' }]
    },
    fallback: {
      format: 'png',
      src: '/_responsive-images/image-720.png',
      candidates: [{ width: 720, path: '/tmp/image-720.png', url: '/_responsive-images/image-720.png' }]
    }
  }

  it('rewrites html img tags through markdown-it html rules', () => {
    const runtime = createRuntime({ formats: ['webp'] })
    runtime.root = '/project/docs'
    runtime.manifest.set(manifestEntry.key, manifestEntry)

    const md = new MarkdownIt({ html: true })
    md.use(responsiveImagesMarkdownPlugin(runtime))

    const html = md.render('<img src="./image.png" alt="HTML image">', {
      path: markdownPath
    })

    expect(html).toContain('<picture>')
    expect(html).toContain('alt="HTML image"')
  })

  it('renders reference-style markdown images through the image rule', () => {
    const runtime = createRuntime({ formats: ['webp'] })
    runtime.root = '/project/docs'
    runtime.manifest.set(manifestEntry.key, manifestEntry)

    const md = new MarkdownIt()
    md.use(responsiveImagesMarkdownPlugin(runtime))

    const html = md.render(`![Reference image][logo]

[logo]: ./image.png`, {
      path: markdownPath
    })

    expect(html).toContain('<picture>')
    expect(html).toContain('alt="Reference image"')
  })
})

describe('renderPicture html attribute merge', () => {
  it('uses plugin defaults when html attributes are absent', () => {
    const options = normalizeOptions({ formats: ['webp'] })
    const html = renderPicture(
      {
        key: 'page.md::./image.png',
        markdownPath: '/docs/page.md',
        source: './image.png',
        sourcePath: '/docs/image.png',
        sourceWidth: 1200,
        sourceHeight: 600,
        displayWidth: 720,
        displayHeight: 360,
        sources: {
          webp: [{ width: 720, path: '/tmp/image-720.webp', url: '/_responsive-images/image-720.webp' }]
        },
        fallback: {
          format: 'png',
          src: '/_responsive-images/image-720.png',
          candidates: [{ width: 720, path: '/tmp/image-720.png', url: '/_responsive-images/image-720.png' }]
        }
      },
      options,
      {}
    )

    expect(html).toContain('loading="lazy"')
    expect(html).toContain('decoding="async"')
  })
})
