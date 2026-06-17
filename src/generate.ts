import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import type { ImageCandidate, ManifestEntry, OutputFormat, RuntimeState } from './types'
import type { ResolvedImage } from './path'
import { joinUrl, normalizePath } from './path'

export async function generateImage(runtime: RuntimeState, image: ResolvedImage): Promise<ManifestEntry> {
  const sourceBuffer = await fs.readFile(image.sourcePath)
  const hash = crypto.createHash('sha1').update(sourceBuffer).digest('hex').slice(0, 10)
  const metadata = await sharp(sourceBuffer).metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('Missing image dimensions.')
  }

  await fs.mkdir(runtime.cacheDir, { recursive: true })

  const fallbackFormat = normalizeFallbackFormat(image.extension)
  const widths = selectWidths(runtime.options.widths, metadata.width)
  const baseName = sanitizeBaseName(path.basename(image.sourcePath, path.extname(image.sourcePath)))
  const sources: ManifestEntry['sources'] = {}

  for (const format of runtime.options.formats) {
    sources[format] = await Promise.all(
      widths.map((width) => writeVariant(runtime, sourceBuffer, baseName, hash, width, format))
    )
  }

  const fallbackCandidates = await Promise.all(
    widths.map((width) => writeVariant(runtime, sourceBuffer, baseName, hash, width, fallbackFormat))
  )
  const displayWidth = Math.min(metadata.width, runtime.options.defaultWidth)
  const displayHeight = Math.round((displayWidth / metadata.width) * metadata.height)
  const fallbackSrc = chooseDefaultCandidate(fallbackCandidates, displayWidth).url

  return {
    key: image.key,
    markdownPath: image.markdownPath,
    source: image.source,
    sourcePath: normalizePath(image.sourcePath),
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    displayWidth,
    displayHeight,
    sources,
    fallback: {
      format: fallbackFormat,
      candidates: fallbackCandidates,
      src: fallbackSrc
    }
  }
}

async function writeVariant(
  runtime: RuntimeState,
  sourceBuffer: Buffer,
  baseName: string,
  hash: string,
  width: number,
  format: OutputFormat | 'jpg' | 'jpeg' | 'png'
): Promise<ImageCandidate> {
  const extension = format === 'jpeg' ? 'jpg' : format
  const fileName = `${baseName}-${width}.${hash}.${extension}`
  const outputPath = path.join(runtime.cacheDir, fileName)

  try {
    await fs.access(outputPath)
  } catch {
    let pipeline = sharp(sourceBuffer).resize({ width, withoutEnlargement: true })

    if (format === 'webp') pipeline = pipeline.webp({ quality: runtime.options.quality.webp })
    if (format === 'avif') pipeline = pipeline.avif({ quality: runtime.options.quality.avif })
    if (format === 'jpg' || format === 'jpeg') pipeline = pipeline.jpeg({ quality: runtime.options.quality.jpeg })
    if (format === 'png') pipeline = pipeline.png(runtime.options.quality.png ? { quality: runtime.options.quality.png } : undefined)

    await pipeline.toFile(outputPath)
  }

  return {
    width,
    path: normalizePath(outputPath),
    url: joinUrl(runtime.base, runtime.options.outputDir, fileName)
  }
}

function selectWidths(widths: number[], sourceWidth: number): number[] {
  const selected = widths.filter((width) => width <= sourceWidth)
  return selected.length > 0 ? selected : [sourceWidth]
}

function chooseDefaultCandidate(candidates: ImageCandidate[], displayWidth: number): ImageCandidate {
  return candidates.find((candidate) => candidate.width >= displayWidth) ?? candidates[candidates.length - 1]
}

function normalizeFallbackFormat(extension: string): 'jpg' | 'jpeg' | 'png' {
  if (extension === 'jpg' || extension === 'jpeg') return 'jpg'
  if (extension === 'png') return 'png'
  throw new Error(`Unsupported fallback format "${extension}".`)
}

function sanitizeBaseName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'image'
}
