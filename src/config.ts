import type { NormalizedOptions, ResponsiveImagesOptions } from './types'

const defaultOptions: NormalizedOptions = {
  widths: [480, 720, 960, 1440],
  formats: ['webp'],
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
  defaultWidth: 720
}

export function normalizeOptions(options: ResponsiveImagesOptions = {}): NormalizedOptions {
  const widths = Array.from(new Set(options.widths ?? defaultOptions.widths))
    .filter((width) => Number.isInteger(width) && width > 0)
    .sort((a, b) => a - b)

  if (widths.length === 0) {
    throw new Error('vitepress-plugin-responsive-images: at least one positive width is required.')
  }

  const formats = Array.from(new Set(options.formats ?? defaultOptions.formats))

  for (const format of formats) {
    if (format !== 'webp' && format !== 'avif') {
      throw new Error(`vitepress-plugin-responsive-images: unsupported output format "${format}".`)
    }
  }

  return {
    ...defaultOptions,
    ...options,
    widths,
    formats,
    quality: {
      ...defaultOptions.quality,
      ...options.quality
    },
    include: options.include ?? defaultOptions.include,
    exclude: options.exclude ?? defaultOptions.exclude,
    skipFormats: (options.skipFormats ?? defaultOptions.skipFormats).map((format) => format.toLowerCase()),
    outputDir: stripSlashes(options.outputDir ?? defaultOptions.outputDir)
  }
}

function stripSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '')
}
