import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import type { ImageCandidate, ManifestEntry, OutputFormat, RuntimeState } from './types'
import type { ResolvedImage } from './path'
import { joinUrl, normalizePath } from './path'
import { LOSSLESS_QUALITY, ORIGINAL_SIZE_WIDTH } from './config'

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
  const displayWidth =
    runtime.options.defaultWidth === ORIGINAL_SIZE_WIDTH ? metadata.width : Math.min(metadata.width, runtime.options.defaultWidth)
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
  const variantToken = getVariantToken(runtime, format)
  const fileName = `${baseName}-${width}.${hash}.${variantToken}.${extension}`
  const outputPath = path.join(runtime.cacheDir, fileName)

  try {
    await fs.access(outputPath)
  } catch {
    let pipeline = sharp(sourceBuffer).resize({ width, withoutEnlargement: true })

    if (format === 'webp') {
      pipeline =
        runtime.options.quality.webp === LOSSLESS_QUALITY
          ? pipeline.webp({ lossless: true })
          : pipeline.webp({ quality: runtime.options.quality.webp })
    }
    if (format === 'avif') {
      pipeline =
        runtime.options.quality.avif === LOSSLESS_QUALITY
          ? pipeline.avif({ lossless: true })
          : pipeline.avif({ quality: runtime.options.quality.avif })
    }
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

function getVariantToken(runtime: RuntimeState, format: OutputFormat | 'jpg' | 'jpeg' | 'png'): string {
  if (format === 'webp') {
    return runtime.options.quality.webp === LOSSLESS_QUALITY ? 'webp-lossless' : `webp-q${runtime.options.quality.webp}`
  }
  if (format === 'avif') {
    return runtime.options.quality.avif === LOSSLESS_QUALITY ? 'avif-lossless' : `avif-q${runtime.options.quality.avif}`
  }
  if (format === 'jpg' || format === 'jpeg') return `jpg-q${runtime.options.quality.jpeg}`
  return runtime.options.quality.png ? `png-q${runtime.options.quality.png}` : 'png-default'
}

function selectWidths(widths: number[], sourceWidth: number): number[] {
  const selected = Array.from(
    new Set(widths.map((width) => (width === ORIGINAL_SIZE_WIDTH ? sourceWidth : width)).filter((width) => width <= sourceWidth))
  ).sort((a, b) => a - b)

  return selected.length > 0 ? selected : [sourceWidth]
}

function chooseDefaultCandidate(candidates: ImageCandidate[], displayWidth: number): ImageCandidate {
  return candidates.find((candidate) => candidate.width >= displayWidth) ?? candidates[candidates.length - 1]
}

export function normalizeFallbackFormat(extension: string): 'jpg' | 'png' {
  if (extension === 'jpg' || extension === 'jpeg') return 'jpg'
  if (extension === 'png') return 'png'
  return 'png'
}

function sanitizeBaseName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'image'
}
