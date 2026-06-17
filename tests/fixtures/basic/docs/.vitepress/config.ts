import { defineConfig } from 'vitepress'
import { withResponsiveImages } from '../../../../../src/index'

export default withResponsiveImages(
  defineConfig({
    title: 'Fixture'
  }),
  {
    widths: [480, 720, 1440],
    formats: ['webp'],
    sizes: '(max-width: 768px) 100vw, 720px',
    debug: true
  }
)
