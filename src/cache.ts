import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { ManifestEntry, NormalizedOptions, RuntimeState } from './types'

export const GENERATION_FINGERPRINT_FILE = '.generation-fingerprint'

export function getGenerationFingerprint(options: NormalizedOptions): string {
  return crypto
    .createHash('sha1')
    .update(
      JSON.stringify({
        widths: options.widths,
        formats: options.formats,
        quality: options.quality
      })
    )
    .digest('hex')
    .slice(0, 10)
}

export async function ensureCacheMatchesOptions(runtime: RuntimeState): Promise<void> {
  const fingerprint = getGenerationFingerprint(runtime.options)
  const fingerprintPath = path.join(runtime.cacheDir, GENERATION_FINGERPRINT_FILE)
  let storedFingerprint: string | undefined

  try {
    storedFingerprint = (await fs.readFile(fingerprintPath, 'utf8')).trim()
  } catch {
    storedFingerprint = undefined
  }

  if (storedFingerprint === fingerprint) {
    return
  }

  await fs.rm(runtime.cacheDir, { recursive: true, force: true })
  await fs.mkdir(runtime.cacheDir, { recursive: true })
  await fs.writeFile(fingerprintPath, `${fingerprint}\n`)
}

export function collectManifestFileNames(manifest: Map<string, ManifestEntry>): Set<string> {
  const fileNames = new Set<string>()

  for (const entry of manifest.values()) {
    for (const candidate of entry.fallback.candidates) {
      fileNames.add(path.basename(candidate.path))
    }

    for (const candidates of Object.values(entry.sources)) {
      if (!candidates) continue

      for (const candidate of candidates) {
        fileNames.add(path.basename(candidate.path))
      }
    }
  }

  return fileNames
}

export async function pruneStaleCacheFiles(runtime: RuntimeState): Promise<void> {
  const referenced = collectManifestFileNames(runtime.manifest)
  let files: string[]

  try {
    files = await fs.readdir(runtime.cacheDir)
  } catch {
    return
  }

  await Promise.all(
    files
      .filter((file) => file !== GENERATION_FINGERPRINT_FILE && !referenced.has(file))
      .map((file) => fs.rm(path.join(runtime.cacheDir, file), { force: true }))
  )
}
