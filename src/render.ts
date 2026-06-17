import type { ManifestEntry, NormalizedOptions } from './types'

export interface RenderImageAttributes {
  alt: string
  title?: string
}

export function renderPicture(entry: ManifestEntry, options: NormalizedOptions, attrs: RenderImageAttributes): string {
  const sources = options.formats
    .map((format) => {
      const candidates = entry.sources[format]
      if (!candidates?.length) return ''
      return `<source type="image/${format}" srcset="${escapeAttribute(renderSrcset(candidates))}">`
    })
    .filter(Boolean)
    .join('')

  const title = attrs.title ? ` title="${escapeAttribute(attrs.title)}"` : ''
  const loading = options.loading ? ` loading="${escapeAttribute(options.loading)}"` : ''
  const decoding = options.decoding ? ` decoding="${escapeAttribute(options.decoding)}"` : ''

  return `<picture>${sources}<img src="${escapeAttribute(entry.fallback.src)}" srcset="${escapeAttribute(renderSrcset(entry.fallback.candidates))}" sizes="${escapeAttribute(options.sizes)}" width="${entry.displayWidth}" height="${entry.displayHeight}" alt="${escapeAttribute(attrs.alt)}"${title}${loading}${decoding}></picture>`
}

export function renderSrcset(candidates: Array<{ url: string; width: number }>): string {
  return candidates.map((candidate) => `${candidate.url} ${candidate.width}w`).join(', ')
}

export function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
