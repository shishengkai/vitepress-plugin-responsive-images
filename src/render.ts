import type { ManifestEntry, NormalizedOptions } from './types'

export interface RenderImageAttributes {
  alt?: string
  title?: string
  class?: string
  style?: string
  id?: string
  width?: string | number
  height?: string | number
  loading?: string
  decoding?: string
}

export function renderPicture(entry: ManifestEntry, options: NormalizedOptions, attrs: RenderImageAttributes = {}): string {
  const sources = options.formats
    .map((format) => {
      const candidates = entry.sources[format]
      if (!candidates?.length) return ''
      return `<source type="image/${format}" srcset="${escapeAttribute(renderSrcset(candidates))}">`
    })
    .filter(Boolean)
    .join('')

  const width = attrs.width ?? entry.displayWidth
  const height = attrs.height ?? entry.displayHeight
  const alt = attrs.alt ?? ''
  const title = attrs.title ? ` title="${escapeAttribute(attrs.title)}"` : ''
  const className = attrs.class ? ` class="${escapeAttribute(attrs.class)}"` : ''
  const style = attrs.style ? ` style="${escapeAttribute(attrs.style)}"` : ''
  const id = attrs.id ? ` id="${escapeAttribute(attrs.id)}"` : ''
  const loadingValue = attrs.loading ?? options.loading
  const decodingValue = attrs.decoding ?? options.decoding
  const loading = loadingValue ? ` loading="${escapeAttribute(String(loadingValue))}"` : ''
  const decoding = decodingValue ? ` decoding="${escapeAttribute(String(decodingValue))}"` : ''

  return `<picture>${sources}<img src="${escapeAttribute(entry.fallback.src)}" srcset="${escapeAttribute(renderSrcset(entry.fallback.candidates))}" sizes="${escapeAttribute(options.sizes)}" width="${width}" height="${height}" alt="${escapeAttribute(alt)}"${title}${className}${style}${id}${loading}${decoding}></picture>`
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
