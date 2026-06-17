---
"vitepress-plugin-responsive-images": minor
---

- Default modern formats are now AVIF + WebP.
- Add original-size (`widths: [0]`) variants and `defaultWidth: 0`.
- Add lossless WebP/AVIF quality via `quality: -1`.
- Inject default `.vp-doc` layout styles with `injectStyles` opt-out.
- Auto-invalidate and prune generated image cache when generation options change.
