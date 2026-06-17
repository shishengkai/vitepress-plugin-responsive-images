import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  GENERATION_FINGERPRINT_FILE,
  collectManifestFileNames,
  ensureCacheMatchesOptions,
  getGenerationFingerprint,
  pruneStaleCacheFiles
} from '../src/cache'
import { normalizeOptions } from '../src/config'
import { createRuntime } from '../src/runtime'
import type { ManifestEntry } from '../src/types'

describe('getGenerationFingerprint', () => {
  it('changes when generation options change', () => {
    const baseline = getGenerationFingerprint(normalizeOptions())
    const widthsChanged = getGenerationFingerprint(normalizeOptions({ widths: [480, 960] }))
    const formatsChanged = getGenerationFingerprint(normalizeOptions({ formats: ['webp'] }))
    const qualityChanged = getGenerationFingerprint(normalizeOptions({ quality: { webp: 90 } }))

    expect(widthsChanged).not.toBe(baseline)
    expect(formatsChanged).not.toBe(baseline)
    expect(qualityChanged).not.toBe(baseline)
  })
})

describe('ensureCacheMatchesOptions', () => {
  it('clears cached variants when generation options change', async () => {
    const cacheDir = path.join('.cache-test', 'responsive-images')
    const runtime = createRuntime({ widths: [480], formats: ['webp'], quality: { webp: 80 } })
    runtime.cacheDir = cacheDir

    await fs.rm(cacheDir, { recursive: true, force: true })
    await ensureCacheMatchesOptions(runtime)
    await fs.writeFile(path.join(cacheDir, 'stale.webp'), 'stale')

    runtime.options = normalizeOptions({ widths: [480], formats: ['webp'], quality: { webp: 90 } })
    await ensureCacheMatchesOptions(runtime)

    const files = await fs.readdir(cacheDir)
    expect(files).toEqual([GENERATION_FINGERPRINT_FILE])
  })
})

describe('pruneStaleCacheFiles', () => {
  it('removes cache files that are no longer referenced by the manifest', async () => {
    const cacheDir = path.join('.cache-test', 'prune')
    const runtime = createRuntime()
    runtime.cacheDir = cacheDir
    runtime.manifest = new Map<string, ManifestEntry>([
        [
          'image',
          {
            key: 'image',
            markdownPath: 'docs/index.md',
            source: './images/dashboard.png',
            sourcePath: 'docs/images/dashboard.png',
            sourceWidth: 1200,
            sourceHeight: 600,
            displayWidth: 720,
            displayHeight: 360,
            sources: {
              webp: [{ width: 720, path: path.join(cacheDir, 'keep.webp'), url: '/_responsive-images/keep.webp' }]
            },
            fallback: {
              format: 'png',
              candidates: [{ width: 720, path: path.join(cacheDir, 'keep.png'), url: '/_responsive-images/keep.png' }],
              src: '/_responsive-images/keep.png'
            }
          }
        ]
      ])

    await fs.rm(cacheDir, { recursive: true, force: true })
    await fs.mkdir(cacheDir, { recursive: true })
    await fs.writeFile(path.join(cacheDir, 'keep.webp'), 'keep')
    await fs.writeFile(path.join(cacheDir, 'keep.png'), 'keep')
    await fs.writeFile(path.join(cacheDir, 'orphan.webp'), 'orphan')
    await fs.writeFile(path.join(cacheDir, GENERATION_FINGERPRINT_FILE), 'abc\n')

    await pruneStaleCacheFiles(runtime)

    const files = (await fs.readdir(cacheDir)).sort()
    expect(files).toEqual([GENERATION_FINGERPRINT_FILE, 'keep.png', 'keep.webp'])
    expect(collectManifestFileNames(runtime.manifest)).toEqual(new Set(['keep.png', 'keep.webp']))
  })
})
