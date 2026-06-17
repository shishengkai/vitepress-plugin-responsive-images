import path from 'node:path'
import { pathToFileURL } from 'node:url'

export interface ParsedImageSource {
  cleanSource: string
  suffix: string
}

export interface ResolvedImage {
  key: string
  markdownPath: string
  source: string
  sourcePath: string
  extension: string
}

const externalPattern = /^(?:[a-z][a-z\d+.-]*:)?\/\//i

export function parseImageSource(source: string): ParsedImageSource {
  const match = source.match(/^([^?#]*)([?#].*)?$/)
  return {
    cleanSource: match?.[1] ?? source,
    suffix: match?.[2] ?? ''
  }
}

export function shouldSkipSource(source: string, skipFormats: string[]): boolean {
  if (!source || source.startsWith('#')) return true
  if (source.startsWith('data:') || source.startsWith('blob:')) return true
  if (externalPattern.test(source)) return true

  const { cleanSource } = parseImageSource(source)
  const extension = path.extname(cleanSource).slice(1).toLowerCase()

  return !extension || skipFormats.includes(extension)
}

export function resolveImageSource(params: {
  root: string
  markdownPath?: string
  source: string
  skipFormats: string[]
}): ResolvedImage | undefined {
  const { root, source, skipFormats } = params

  if (shouldSkipSource(source, skipFormats)) return undefined

  const { cleanSource } = parseImageSource(source)
  const extension = path.extname(cleanSource).slice(1).toLowerCase()
  let sourcePath: string
  let markdownPath = params.markdownPath ? normalizePath(params.markdownPath) : ''

  if (cleanSource.startsWith('/')) {
    sourcePath = path.join(root, 'public', cleanSource)
    markdownPath ||= '__public__'
  } else if (cleanSource.startsWith('@/')) {
    sourcePath = path.join(root, cleanSource.slice(2))
    markdownPath ||= '__src__'
  } else {
    if (!markdownPath) return undefined
    sourcePath = path.resolve(path.dirname(markdownPath), cleanSource)
  }

  return {
    key: createImageKey(markdownPath, source),
    markdownPath,
    source,
    sourcePath,
    extension
  }
}

export function createImageKey(markdownPath: string, source: string): string {
  return `${normalizePath(markdownPath)}::${source}`
}

export function normalizePath(value: string): string {
  return value.split(path.sep).join('/')
}

export function toFileUrl(filePath: string): string {
  return pathToFileURL(filePath).href
}

export function getMarkdownPathFromEnv(root: string, env: unknown): string | undefined {
  if (!env || typeof env !== 'object') return undefined
  const record = env as Record<string, unknown>
  const candidates = [record.path, record.filePath, record.filename, record.id, record.relativePath]

  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || candidate.length === 0) continue
    return path.isAbsolute(candidate) ? normalizePath(candidate) : normalizePath(path.join(root, candidate))
  }

  return undefined
}

export function joinUrl(...parts: string[]): string {
  const normalized = parts
    .filter(Boolean)
    .map((part, index) => {
      if (index === 0) return part.replace(/\/+$/g, '')
      return part.replace(/^\/+|\/+$/g, '')
    })
    .filter(Boolean)
    .join('/')

  return normalized.startsWith('/') ? normalized : `/${normalized}`
}
