import { shouldSkipSource } from './path'

export type ImageReferenceKind = 'markdown-inline' | 'markdown-reference' | 'html'

export interface ImageReference {
  kind: ImageReferenceKind
  source: string
  referenceId?: string
}

const inlineMarkdownImagePattern = /!\[[^\]]*\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g
const explicitReferencePattern = /!\[[^\]]*\]\[([^\]]*)\]/g
const shortcutReferencePattern = /!\[([^\]]+)\](?!\(|\[)/g
const referenceDefinitionPattern = /^\[([^\]\n]+)\]:\s+(\S+)/gm
const htmlImgTagPattern = /<img\b[\s\S]*?\/?>/gi
const htmlAttributePattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g

export function discoverImageReferences(content: string): ImageReference[] {
  const body = stripFrontmatter(content)
  const references: ImageReference[] = []
  const seen = new Set<string>()

  const add = (reference: ImageReference) => {
    if (seen.has(reference.source)) return
    seen.add(reference.source)
    references.push(reference)
  }

  for (const source of extractInlineMarkdownImages(body)) {
    add({ kind: 'markdown-inline', source })
  }

  for (const reference of extractReferenceImages(body)) {
    add(reference)
  }

  for (const source of extractHtmlImageSources(body)) {
    add({ kind: 'html', source })
  }

  return references
}

export function extractInlineMarkdownImages(content: string): string[] {
  const sources: string[] = []
  let match: RegExpExecArray | null

  inlineMarkdownImagePattern.lastIndex = 0
  while ((match = inlineMarkdownImagePattern.exec(content))) {
    const source = match[1]?.trim()
    if (source) sources.push(source)
  }

  return sources
}

export function extractReferenceImages(content: string, skipFormats: string[] = ['svg', 'gif']): ImageReference[] {
  const definitions = parseReferenceDefinitions(content)
  const references: ImageReference[] = []
  const usedReferenceIds = collectReferenceImageIds(content)

  for (const referenceId of usedReferenceIds) {
    const source = definitions.get(referenceId)
    if (!source || shouldSkipSource(source, skipFormats)) continue
    references.push({
      kind: 'markdown-reference',
      source,
      referenceId
    })
  }

  return references
}

export function extractHtmlImageSources(content: string): string[] {
  const sources: string[] = []
  let match: RegExpExecArray | null

  htmlImgTagPattern.lastIndex = 0
  while ((match = htmlImgTagPattern.exec(content))) {
    if (isInsidePicture(content, match.index)) continue

    const source = parseHtmlImgAttributes(match[0]).src?.trim()
    if (source) sources.push(source)
  }

  return sources
}

export function parseHtmlImgAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  let match: RegExpExecArray | null

  htmlAttributePattern.lastIndex = 0
  while ((match = htmlAttributePattern.exec(tag))) {
    const name = match[1]?.toLowerCase()
    const value = match[2] ?? match[3] ?? match[4] ?? ''
    if (name) attrs[name] = value
  }

  return attrs
}

function parseReferenceDefinitions(content: string): Map<string, string> {
  const definitions = new Map<string, string>()
  let match: RegExpExecArray | null

  referenceDefinitionPattern.lastIndex = 0
  while ((match = referenceDefinitionPattern.exec(content))) {
    const id = match[1]?.trim()
    const source = match[2]?.trim()
    if (id && source) definitions.set(id, source)
  }

  return definitions
}

function collectReferenceImageIds(content: string): Set<string> {
  const ids = new Set<string>()
  let match: RegExpExecArray | null

  explicitReferencePattern.lastIndex = 0
  while ((match = explicitReferencePattern.exec(content))) {
    const explicitId = match[1]?.trim()
    const referenceId = explicitId || readAltFromImageReferenceMatch(match)
    if (referenceId) ids.add(referenceId)
  }

  shortcutReferencePattern.lastIndex = 0
  while ((match = shortcutReferencePattern.exec(content))) {
    const referenceId = match[1]?.trim()
    if (referenceId) ids.add(referenceId)
  }

  return ids
}

function readAltFromImageReferenceMatch(match: RegExpExecArray): string {
  const altMatch = match[0].match(/^!\[([^\]]*)\]/)
  return altMatch?.[1]?.trim() ?? ''
}

function stripFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content

  const end = content.indexOf('\n---', 3)
  if (end === -1) return content

  return content.slice(end + 4)
}

function isInsidePicture(content: string, index: number): boolean {
  const before = content.slice(0, index)
  const lastPictureOpen = before.lastIndexOf('<picture')
  const lastPictureClose = before.lastIndexOf('</picture>')
  return lastPictureOpen !== -1 && lastPictureOpen > lastPictureClose
}
