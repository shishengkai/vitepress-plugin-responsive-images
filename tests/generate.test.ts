import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { generateImage, normalizeFallbackFormat } from '../src/generate'
import { createRuntime } from '../src/runtime'
import type { ResolvedImage } from '../src/path'

const fixtureRoot = path.resolve('.cache-test', 'generate')
const sourceDir = path.join(fixtureRoot, 'images')
const cacheDir = path.join(fixtureRoot, 'cache')

describe('normalizeFallbackFormat', () => {
  it('keeps browser-safe JPG and PNG fallbacks, and converts other inputs to PNG', () => {
    expect(normalizeFallbackFormat('jpg')).toBe('jpg')
    expect(normalizeFallbackFormat('jpeg')).toBe('jpg')
    expect(normalizeFallbackFormat('png')).toBe('png')
    expect(normalizeFallbackFormat('webp')).toBe('png')
    expect(normalizeFallbackFormat('avif')).toBe('png')
    expect(normalizeFallbackFormat('bmp')).toBe('png')
  })
})

describe('generateImage fallback format', () => {
  beforeEach(async () => {
    await fs.rm(fixtureRoot, { recursive: true, force: true })
    await fs.mkdir(sourceDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(fixtureRoot, { recursive: true, force: true })
  })

  it('keeps PNG source fallbacks as PNG', async () => {
    const sourcePath = path.join(sourceDir, 'source.png')
    await createTestImage().png().toFile(sourcePath)

    const entry = await generateImage(createTestRuntime(), createResolvedImage(sourcePath, 'png'))

    expect(entry.fallback.format).toBe('png')
    expect(entry.fallback.src).toMatch(/png-default\.png$/)
  })

  it('keeps JPEG source fallbacks as JPG', async () => {
    const sourcePath = path.join(sourceDir, 'source.jpeg')
    await createTestImage().jpeg().toFile(sourcePath)

    const entry = await generateImage(createTestRuntime(), createResolvedImage(sourcePath, 'jpeg'))

    expect(entry.fallback.format).toBe('jpg')
    expect(entry.fallback.src).toMatch(/jpg-q82\.jpg$/)
  })

  it('converts WebP source fallbacks to PNG', async () => {
    const sourcePath = path.join(sourceDir, 'source.webp')
    await createTestImage().webp().toFile(sourcePath)

    const entry = await generateImage(createTestRuntime(), createResolvedImage(sourcePath, 'webp'))

    expect(entry.fallback.format).toBe('png')
    expect(entry.fallback.src).toMatch(/png-default\.png$/)
  })
})

function createTestImage(): sharp.Sharp {
  return sharp({
    create: {
      width: 16,
      height: 8,
      channels: 4,
      background: '#3366ff'
    }
  })
}

function createTestRuntime() {
  const runtime = createRuntime({ widths: [0], defaultWidth: 0, formats: ['webp'] })
  runtime.root = fixtureRoot
  runtime.cacheDir = cacheDir
  runtime.base = '/'
  return runtime
}

function createResolvedImage(sourcePath: string, extension: string): ResolvedImage {
  return {
    key: `docs/index.md::./images/${path.basename(sourcePath)}`,
    markdownPath: path.join(fixtureRoot, 'docs', 'index.md'),
    source: `./images/${path.basename(sourcePath)}`,
    sourcePath,
    extension
  }
}
