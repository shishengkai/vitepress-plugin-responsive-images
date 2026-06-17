import type { NormalizedOptions, OutputFormat, ResponsiveImagesOptions } from './types'

const FORMAT_ORDER: OutputFormat[] = ['avif', 'webp']
export const ORIGINAL_SIZE_WIDTH = 0
export const LOSSLESS_QUALITY = -1

const defaultOptions: NormalizedOptions = {
  widths: [480, 720, 960, 1440],
  formats: [...FORMAT_ORDER],
  fallbackFormat: 'original',
  sizes: '(max-width: 768px) 100vw, 720px',
  outputDir: '_responsive-images',
  include: ['**/*.md'],
  exclude: [],
  quality: {
    webp: 80,
    avif: 50,
    jpeg: 82
  },
  loading: 'lazy',
  decoding: 'async',
  skipFormats: ['svg', 'gif'],
  failOnError: false,
  debug: false,
  defaultWidth: 720,
  injectStyles: true
}

export function normalizeOptions(options: ResponsiveImagesOptions = {}): NormalizedOptions {
  const widths = normalizeWidths(options.widths)
  const defaultWidth = normalizeDefaultWidth(options.defaultWidth)
  const quality = normalizeQuality(options.quality)

  if (widths.length === 0) {
    throw new Error('vitepress-plugin-responsive-images: at least one non-negative width is required.')
  }

  const formats = normalizeFormats(options.formats)

  return {
    ...defaultOptions,
    ...options,
    widths,
    defaultWidth,
    formats,
    quality,
    include: options.include ?? defaultOptions.include,
    exclude: options.exclude ?? defaultOptions.exclude,
    skipFormats: (options.skipFormats ?? defaultOptions.skipFormats).map((format) => format.toLowerCase()),
    outputDir: stripSlashes(options.outputDir ?? defaultOptions.outputDir)
  }
}

export function normalizeWidths(widths: ResponsiveImagesOptions['widths']): number[] {
  return Array.from(new Set(widths ?? defaultOptions.widths))
    .filter((width) => Number.isInteger(width) && width >= ORIGINAL_SIZE_WIDTH)
    .sort((a, b) => a - b)
}

function normalizeDefaultWidth(defaultWidth: ResponsiveImagesOptions['defaultWidth']): number {
  const normalizedDefaultWidth = defaultWidth ?? defaultOptions.defaultWidth

  if (!Number.isInteger(normalizedDefaultWidth) || normalizedDefaultWidth < ORIGINAL_SIZE_WIDTH) {
    throw new Error('vitepress-plugin-responsive-images: defaultWidth must be a non-negative integer.')
  }

  return normalizedDefaultWidth
}

export function normalizeQuality(quality: ResponsiveImagesOptions['quality']): NormalizedOptions['quality'] {
  const normalizedQuality = {
    ...defaultOptions.quality,
    ...quality
  }

  validateModernQuality('webp', normalizedQuality.webp)
  validateModernQuality('avif', normalizedQuality.avif)

  return normalizedQuality
}

function validateModernQuality(format: OutputFormat, quality: number): void {
  if (!Number.isInteger(quality) || quality < LOSSLESS_QUALITY || quality === 0 || quality > 100) {
    throw new Error(
      `vitepress-plugin-responsive-images: quality.${format} must be -1 for lossless or an integer from 1 to 100.`
    )
  }
}

function stripSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '')
}

export function normalizeFormats(formats?: ResponsiveImagesOptions['formats']): OutputFormat[] {
  if (formats === undefined) {
    return [...FORMAT_ORDER]
  }

  const uniqueFormats = Array.from(new Set(formats))

  if (uniqueFormats.length === 0) {
    throw new Error('vitepress-plugin-responsive-images: at least one modern output format is required.')
  }

  for (const format of uniqueFormats) {
    if (format !== 'webp' && format !== 'avif') {
      throw new Error(`vitepress-plugin-responsive-images: unsupported output format "${format}".`)
    }
  }

  return FORMAT_ORDER.filter((format) => uniqueFormats.includes(format))
}
