# vitepress-plugin-responsive-images

Automatically convert local Markdown images in VitePress docs into responsive `<picture>` elements with WebP/AVIF sources and JPG/PNG fallbacks.

Write normal Markdown:

```md
![Dashboard screenshot](./images/dashboard.png)
```

Build responsive images automatically:

```html
<picture>
  <source type="image/webp" srcset="... 480w, ... 720w, ... 1440w">
  <img src="...png" srcset="... 480w, ... 720w, ... 1440w" sizes="(max-width: 768px) 100vw, 720px" alt="Dashboard screenshot">
</picture>
```

## Why

VitePress lets authors write Markdown quickly, but it does not automatically generate responsive image variants for local Markdown images. This plugin keeps the authoring experience simple while improving image delivery for documentation sites.

It is designed for documentation that must remain usable on older enterprise devices: modern browsers can load WebP or AVIF, while older browsers can still use JPG/PNG fallbacks.

## Compatibility

| VitePress version | Status |
| --- | --- |
| `1.6.x` | Stable supported |
| `2.0.x` | Supported and continuously tested; alpha caveats apply while VitePress 2 is not stable |

## Install

```bash
npm install -D vitepress-plugin-responsive-images
```

## Usage

```ts
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'
import { withResponsiveImages } from 'vitepress-plugin-responsive-images'

export default withResponsiveImages(
  defineConfig({
    title: 'My Docs'
  })
)
```

With options:

```ts
export default withResponsiveImages(
  defineConfig({
    title: 'My Docs'
  }),
  {
    widths: [480, 720, 960, 1440],
    formats: ['webp'],
    sizes: '(max-width: 768px) 100vw, 720px'
  }
)
```

## Defaults

- Processes local Markdown images written as `![]()`.
- Processes `jpg`, `jpeg`, and `png` by default.
- Skips remote URLs, data URLs, SVG, GIF, Vue components, theme images, CSS backgrounds, and handwritten HTML images.
- Generates WebP plus original-format JPG/PNG fallback by default.
- Avoids upscaling images.
- Adds `loading="lazy"` and `decoding="async"` by default.

## Configuration

```ts
interface ResponsiveImagesOptions {
  widths?: number[]
  formats?: Array<'webp' | 'avif'>
  sizes?: string
  outputDir?: string
  include?: string[]
  exclude?: string[]
  quality?: {
    webp?: number
    avif?: number
    jpeg?: number
    png?: number
  }
  loading?: 'lazy' | 'eager' | false
  decoding?: 'async' | 'sync' | 'auto' | false
  failOnError?: boolean
  debug?: boolean
}
```

## Page opt-out

Disable the plugin for a single Markdown page with frontmatter:

```yaml
---
responsiveImages: false
---
```

## Releasing

This project uses Changesets and npm Trusted Publishing.

For user-facing changes, add a changeset before opening a pull request:

```bash
npm run changeset
```

When changes are merged into `main`, the release workflow creates a `Version Packages` pull request. Merging that pull request publishes the package to npm and creates the GitHub release through Trusted Publishing.

## License

MIT
