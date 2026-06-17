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
    formats: ['avif', 'webp'],
    sizes: '(max-width: 768px) 100vw, 720px'
  }
)
```

## Defaults

- Processes local Markdown images written as `![]()`.
- Processes `jpg`, `jpeg`, and `png` by default.
- Skips remote URLs, data URLs, SVG, GIF, Vue components, theme images, CSS backgrounds, and handwritten HTML images.
- Generates AVIF + WebP modern sources, with original-format JPG/PNG fallback.
- Avoids upscaling images.
- Adds `loading="lazy"` and `decoding="async"` by default.

## Configuration

### Responsive widths

Use `widths` to choose the generated responsive image widths. Use `0` when you want to keep the original image size and only convert formats.

| Value | Generates | When to use |
| --- | --- | --- |
| `[480, 720, 960, 1440]` (default) | Responsive resized variants | General documentation images |
| `[0]` | Original-size variants only | Format conversion without resizing |
| `[480, 720, 0]` | Resized variants plus original-size variant | Responsive images that can still use the original file width |

When using original-size-only output, pair it with `defaultWidth: 0` if the rendered `<img width>` and `<img height>` should also use the source image dimensions:

```ts
export default withResponsiveImages(
  defineConfig({
    title: 'My Docs'
  }),
  {
    widths: [0],
    defaultWidth: 0,
    formats: ['avif', 'webp']
  }
)
```

### Modern formats

Use `formats` to choose which modern image variants are generated for `<picture><source>` entries. JPG/PNG fallback is always kept for older browsers.

| Value | Generates | When to use |
| --- | --- | --- |
| `['avif', 'webp']` (default) | AVIF + WebP | Best balance of size and compatibility |
| `['webp']` | WebP only | Faster builds; good for most documentation sites |
| `['avif']` | AVIF only | Smallest files, but slower to encode |

Examples:

```ts
// Default: AVIF + WebP
formats: ['avif', 'webp']

// WebP only
formats: ['webp']

// AVIF only
formats: ['avif']
```

### Quality

Use `quality` to tune encoder output. WebP and AVIF can be generated in Sharp's lossless mode by setting their quality value to `-1`.

| Value | Meaning |
| --- | --- |
| `quality.webp: 80` (default) | Lossy WebP quality 80 |
| `quality.webp: 100` | Maximum lossy WebP quality |
| `quality.webp: -1` | Lossless WebP via `webp({ lossless: true })` |
| `quality.avif: 50` (default) | Lossy AVIF quality 50 |
| `quality.avif: 100` | Maximum lossy AVIF quality |
| `quality.avif: -1` | Lossless AVIF via `avif({ lossless: true })` |

```ts
export default withResponsiveImages(
  defineConfig({
    title: 'My Docs'
  }),
  {
    formats: ['avif', 'webp'],
    quality: {
      avif: -1,
      webp: -1
    }
  }
)
```

```ts
interface ResponsiveImagesOptions {
  widths?: number[]
  formats?: Array<'webp' | 'avif'>
  defaultWidth?: number
  sizes?: string
  outputDir?: string
  include?: string[]
  exclude?: string[]
  quality?: {
    webp?: number // -1 enables lossless WebP; 1..100 uses lossy quality
    avif?: number // -1 enables lossless AVIF; 1..100 uses lossy quality
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
