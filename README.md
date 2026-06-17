# vitepress-plugin-responsive-images

Automatically convert local Markdown images in VitePress docs into responsive `<picture>` elements with WebP/AVIF sources and JPG/PNG fallbacks.

Keep writing images the way you already do in Markdown:

```md
<!-- Inline -->
![Dashboard screenshot](./images/dashboard.png)

<!-- Reference-style -->
![Architecture diagram][arch]
[arch]: ./images/architecture.png

<!-- Handwritten HTML -->
<img src="./images/hero.png" alt="Hero" class="rounded">
```

The plugin generates responsive variants at build time and rewrites local images into markup like this:

```html
<picture>
  <source type="image/avif" srcset="... 480w, ... 720w, ... 1440w">
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

### Example page

A typical documentation page can mix all supported syntaxes in one file:

```md
# Product overview

![Dashboard screenshot](./images/dashboard.png)

See the full architecture in the diagram below.

![Architecture diagram][arch]

For fine-grained layout control, you can still use HTML:

<img
  src="./images/hero.png"
  alt="Product hero"
  class="rounded border"
  loading="eager"
>

[arch]: ./images/architecture.png "System architecture"
```

After `vitepress build`, local images in that page are emitted as `<picture>` elements. Handwritten HTML keeps attributes such as `class`, `style`, `loading`, and `decoding` on the fallback `<img>`.

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

- Processes local images from Markdown inline images `![]()`, reference-style images `![alt][ref]`, and handwritten HTML `<img src="...">` tags in Markdown files.
- Processes Sharp-readable local images with file extensions.
- Skips remote URLs, data URLs, SVG, GIF, Vue components, theme images, CSS backgrounds, and `<img>` tags already inside `<picture>`.
- Generates AVIF + WebP modern sources, with JPG/PNG fallback.
- Avoids upscaling images.
- Adds `loading="lazy"` and `decoding="async"` by default.
- Injects default `.vp-doc` layout styles for `<picture>` and `<img>` elements.
- Invalidates cached variants automatically when `widths`, `formats`, or `quality` change.

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

### Fallback format

The fallback `<img>` always uses a broadly compatible JPG or PNG file:

| Source format | Fallback format |
| --- | --- |
| `jpg`, `jpeg` | `jpg` |
| `png` | `png` |
| Other Sharp-readable formats, such as `webp`, `avif`, `bmp`, or `tiff` | `png` |

Using PNG for non-JPG/PNG inputs preserves transparency and avoids unexpected lossy conversion. It can produce larger fallback files for photo-like images, but modern browsers will usually load the AVIF/WebP `<source>` first.

### Layout styles

VitePress does not ship layout rules for `<picture>` elements. By default, this plugin adds them through VitePress `head` config as a small scoped stylesheet:

```css
.vp-doc picture { display: block; }
.vp-doc picture > img,
.vp-doc img { max-width: 100%; height: auto; }
```

Disable automatic injection when your theme already provides equivalent rules:

```ts
export default withResponsiveImages(
  defineConfig({
    title: 'My Docs'
  }),
  {
    injectStyles: false
  }
)
```

You can also import the stylesheet manually:

```ts
import 'vitepress-plugin-responsive-images/vp-doc-picture.css'
```

Custom themes that do not use the `.vp-doc` wrapper should provide their own layout rules.

### Cache behavior

Generated variants are stored in `.vitepress/cache/responsive-images` and copied into the build output on production builds.

The plugin tracks a fingerprint of generation options (`widths`, `formats`, and `quality`). When those options change, the cache directory is cleared automatically so old variants are not reused.

After each manifest rebuild, unreferenced cache files are pruned. Production builds also replace the output image directory with only the files referenced by the current manifest, so you do not need to manually delete `.vitepress/dist` or `.vitepress/cache/responsive-images` after changing image settings.

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
  injectStyles?: boolean
}
```

## Supported Markdown image syntax

| Syntax | Example | Notes |
| --- | --- | --- |
| Inline Markdown | `![Alt](./images/a.png)` | Default authoring style |
| Reference-style | `![Alt][ref]` + `[ref]: ./images/a.png` | Useful for repeated images or long URLs |
| Shortcut reference | `![logo]` + `[logo]: ./images/logo.png` | Same-file reference definitions only |
| Handwritten HTML | `<img src="./images/a.png" alt="Alt">` | Preserves existing HTML attributes |

Reference-style images must define the URL in the same Markdown file:

```md
![Logo][logo]

[logo]: /logo.png
```

Handwritten HTML inside an existing `<picture>` element is left unchanged.

## Not supported yet

- Theme hero images, site logo, and other frontmatter-driven theme assets
- Per-image opt-out (page-level `responsiveImages: false` is supported)
- Vue image components and CSS `background-image`

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
