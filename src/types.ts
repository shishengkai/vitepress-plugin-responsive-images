export type OutputFormat = 'webp' | 'avif'
export type FallbackFormat = 'original'
export type LoadingValue = 'lazy' | 'eager' | false
export type DecodingValue = 'async' | 'sync' | 'auto' | false

export interface FormatQuality {
  /**
   * WebP quality.
   *
   * Use an integer from `1` to `100` for lossy WebP.
   * Use `-1` to enable Sharp's `webp({ lossless: true })` mode.
   */
  webp: number
  /**
   * AVIF quality.
   *
   * Use an integer from `1` to `100` for lossy AVIF.
   * Use `-1` to enable Sharp's `avif({ lossless: true })` mode.
   */
  avif: number
  jpeg: number
  png?: number
}

export interface ResponsiveImagesOptions {
  /**
   * Responsive image candidate widths.
   *
   * The default is `[480, 720, 960, 1440]`.
   * Use `0` to include the original source width without resizing.
   *
   * @example widths: [0]
   * @example widths: [480, 720, 0]
   */
  widths?: number[]
  /**
   * Modern image formats to generate for `<picture><source>` entries.
   * JPG/PNG fallback is always preserved separately.
   *
   * The default is `['avif', 'webp']`.
   * Use `['webp']` for faster builds or `['avif']` when smallest files matter more than encoding speed.
   */
  formats?: OutputFormat[]
  fallbackFormat?: FallbackFormat
  sizes?: string
  outputDir?: string
  include?: string[]
  exclude?: string[]
  quality?: Partial<FormatQuality>
  loading?: LoadingValue
  decoding?: DecodingValue
  skipFormats?: string[]
  failOnError?: boolean
  debug?: boolean
  /**
   * The rendered `<img width>` value.
   *
   * The default is `720`.
   * Use `0` to render the original source width and height.
   */
  defaultWidth?: number
  /**
   * Inject default VitePress doc layout styles for `<picture>` and `<img>` elements.
   *
   * The default is `true`. Set to `false` when your theme already provides equivalent
   * rules or when you import `vitepress-plugin-responsive-images/vp-doc-picture.css` manually.
   */
  injectStyles?: boolean
}

export interface NormalizedOptions {
  widths: number[]
  formats: OutputFormat[]
  fallbackFormat: FallbackFormat
  sizes: string
  outputDir: string
  include: string[]
  exclude: string[]
  quality: FormatQuality
  loading: LoadingValue
  decoding: DecodingValue
  skipFormats: string[]
  failOnError: boolean
  debug: boolean
  defaultWidth: number
  injectStyles: boolean
}

export interface ImageCandidate {
  width: number
  path: string
  url: string
}

export interface ManifestEntry {
  key: string
  markdownPath: string
  source: string
  sourcePath: string
  alt?: string
  sourceWidth: number
  sourceHeight: number
  displayWidth: number
  displayHeight: number
  sources: Partial<Record<OutputFormat, ImageCandidate[]>>
  fallback: {
    format: 'jpg' | 'jpeg' | 'png'
    candidates: ImageCandidate[]
    src: string
  }
}

export interface RuntimeState {
  options: NormalizedOptions
  root: string
  cacheDir: string
  outDir: string
  base: string
  manifest: Map<string, ManifestEntry>
  built: boolean
}
