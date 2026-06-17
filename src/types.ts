export type OutputFormat = 'webp' | 'avif'
export type FallbackFormat = 'original'
export type LoadingValue = 'lazy' | 'eager' | false
export type DecodingValue = 'async' | 'sync' | 'auto' | false

export interface FormatQuality {
  webp: number
  avif: number
  jpeg: number
  png?: number
}

export interface ResponsiveImagesOptions {
  widths?: number[]
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
  defaultWidth?: number
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
