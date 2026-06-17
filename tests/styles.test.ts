import { describe, expect, it } from 'vitest'
import { normalizeOptions } from '../src/config'
import { withResponsiveImages } from '../src/index'
import { getVpDocPictureCss, responsiveImagesHeadConfig } from '../src/styles'

describe('responsive images styles', () => {
  it('loads the default VitePress doc picture styles', () => {
    const css = getVpDocPictureCss()

    expect(css).toContain('.vp-doc picture')
    expect(css).toContain('display: block')
    expect(css).toContain('max-width: 100%')
    expect(css).toContain('height: auto')
  })

  it('builds a VitePress head entry for style injection', () => {
    expect(responsiveImagesHeadConfig()).toEqual([
      'style',
      { 'data-vpri-picture-styles': '' },
      getVpDocPictureCss()
    ])
  })

  it('merges layout styles into withResponsiveImages config by default', () => {
    const config = withResponsiveImages({ title: 'Test' }) as unknown as {
      head: ReturnType<typeof responsiveImagesHeadConfig>[]
    }

    expect(config.head).toEqual([responsiveImagesHeadConfig()])
  })

  it('skips layout styles when injectStyles is false', () => {
    const config = withResponsiveImages({ title: 'Test', head: [['meta', { name: 'x' }, '']] }, { injectStyles: false }) as unknown as {
      head: Array<[string, Record<string, string>, string]>
    }

    expect(config.head).toEqual([['meta', { name: 'x' }, '']])
    expect(normalizeOptions({ injectStyles: false }).injectStyles).toBe(false)
  })
})
