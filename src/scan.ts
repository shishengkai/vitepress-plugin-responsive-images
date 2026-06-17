import fs from 'node:fs/promises'
import path from 'node:path'
import { glob } from 'tinyglobby'
import type { RuntimeState } from './types'
import { ensureCacheMatchesOptions, pruneStaleCacheFiles } from './cache'
import { normalizePath, resolveImageSource } from './path'
import { generateImage } from './generate'

const markdownImagePattern = /!\[[^\]]*\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g

export async function buildManifest(runtime: RuntimeState): Promise<void> {
  await ensureCacheMatchesOptions(runtime)
  runtime.manifest.clear()

  const files = await glob(runtime.options.include, {
    cwd: runtime.root,
    ignore: runtime.options.exclude,
    absolute: true,
    onlyFiles: true
  })

  for (const file of files) {
    await scanMarkdownFile(runtime, file)
  }

  await pruneStaleCacheFiles(runtime)
  runtime.built = true
}

async function scanMarkdownFile(runtime: RuntimeState, markdownPath: string): Promise<void> {
  const content = await fs.readFile(markdownPath, 'utf8')

  if (hasResponsiveImagesDisabled(content)) return

  for (const source of extractMarkdownImageSources(content)) {
    const resolved = resolveImageSource({
      root: runtime.root,
      markdownPath,
      source,
      skipFormats: runtime.options.skipFormats
    })

    if (!resolved) continue

    try {
      const entry = await generateImage(runtime, resolved)
      runtime.manifest.set(entry.key, entry)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (runtime.options.failOnError) {
        throw new Error(`vitepress-plugin-responsive-images: failed to process ${normalizePath(resolved.sourcePath)}. ${message}`)
      }
      if (runtime.options.debug) {
        console.warn(`vitepress-plugin-responsive-images: skipped ${normalizePath(resolved.sourcePath)}. ${message}`)
      }
    }
  }
}

export function extractMarkdownImageSources(content: string): string[] {
  const sources: string[] = []
  let match: RegExpExecArray | null

  markdownImagePattern.lastIndex = 0
  while ((match = markdownImagePattern.exec(content))) {
    const source = match[1]?.trim()
    if (source) sources.push(source)
  }

  return sources
}

function hasResponsiveImagesDisabled(content: string): boolean {
  if (!content.startsWith('---')) return false
  const end = content.indexOf('\n---', 3)
  if (end === -1) return false
  const frontmatter = content.slice(3, end)
  return /^responsiveImages:\s*false\s*$/m.test(frontmatter)
}
