# vitepress-plugin-responsive-images

## 0.2.1

### Patch Changes

- [`faf555d`](https://github.com/shishengkai/vitepress-plugin-responsive-images/commit/faf555d973b0ed9981a1f17c3ce13d16ac6440e5) Thanks [@AaronJiTuo](https://github.com/AaronJiTuo)! - Convert fallback images for non-JPG/PNG source formats to PNG instead of failing on inputs such as WebP, AVIF, BMP, or TIFF.

## 0.2.0

### Minor Changes

- [`a2efbd1`](https://github.com/shishengkai/vitepress-plugin-responsive-images/commit/a2efbd136aaa3c202f65d17407d15f21f0aaafff) Thanks [@AaronJiTuo](https://github.com/AaronJiTuo)! - - Default modern formats are now AVIF + WebP.
  - Add original-size (`widths: [0]`) variants and `defaultWidth: 0`.
  - Add lossless WebP/AVIF quality via `quality: -1`.
  - Inject default `.vp-doc` layout styles with `injectStyles` opt-out.
  - Auto-invalidate and prune generated image cache when generation options change.

## 0.1.1

### Patch Changes

- [`e29ea20`](https://github.com/shishengkai/vitepress-plugin-responsive-images/commit/e29ea20f787c0d5df21d0aff4d1f56befe348acc) Thanks [@AaronJiTuo](https://github.com/AaronJiTuo)! - Warm the responsive image manifest during Vite config resolution so VitePress Markdown rendering can reliably emit picture markup during normal builds.
