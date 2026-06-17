import type { RuntimeState } from './types'
import { parseHtmlImgAttributes } from './discover'
import { getMarkdownPathFromEnv, resolveImageSource } from './path'
import { renderPicture, type RenderImageAttributes } from './render'

const htmlImgTagPattern = /<img\b[\s\S]*?\/?>/gi

export function transformHtmlImageTags(html: string, runtime: RuntimeState, env: unknown): string {
  const markdownPath = getMarkdownPathFromEnv(runtime.root, env)
  const replacements: Array<{ start: number; end: number; value: string }> = []
  let match: RegExpExecArray | null

  htmlImgTagPattern.lastIndex = 0
  while ((match = htmlImgTagPattern.exec(html))) {
    if (isInsidePicture(html, match.index)) continue

    const tag = match[0]
    const attrs = parseHtmlImgAttributes(tag)
    const source = attrs.src?.trim()
    if (!source) continue

    const resolved = resolveImageSource({
      root: runtime.root,
      markdownPath,
      source,
      skipFormats: runtime.options.skipFormats
    })

    const entry = resolved ? runtime.manifest.get(resolved.key) : undefined
    if (!entry) continue

    replacements.push({
      start: match.index,
      end: match.index + tag.length,
      value: renderPicture(entry, runtime.options, attributesFromHtml(attrs))
    })
  }

  if (replacements.length === 0) return html

  let output = html
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, replacement.start) + replacement.value + output.slice(replacement.end)
  }

  return output
}

function attributesFromHtml(attrs: Record<string, string>): RenderImageAttributes {
  return {
    alt: attrs.alt,
    title: attrs.title,
    class: attrs.class,
    style: attrs.style,
    id: attrs.id,
    width: attrs.width,
    height: attrs.height,
    loading: attrs.loading,
    decoding: attrs.decoding
  }
}

function isInsidePicture(content: string, index: number): boolean {
  const before = content.slice(0, index)
  const lastPictureOpen = before.lastIndexOf('<picture')
  const lastPictureClose = before.lastIndexOf('</picture>')
  return lastPictureOpen !== -1 && lastPictureOpen > lastPictureClose
}
