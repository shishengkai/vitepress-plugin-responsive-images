# vitepress-plugin-responsive-images

Automatically convert local Markdown images in VitePress docs into responsive `<picture>` elements with WebP/AVIF sources and JPG/PNG fallbacks.

## Getting Started

```bash
npm install -D vitepress-plugin-responsive-images
```

```ts
import { defineConfig } from 'vitepress'
import { withResponsiveImages } from 'vitepress-plugin-responsive-images'

export default withResponsiveImages(
  defineConfig({
    title: 'My Docs'
  })
)
```
