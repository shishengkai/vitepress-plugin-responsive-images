import path from 'node:path'
import type { ResponsiveImagesOptions, RuntimeState } from './types'
import { normalizeOptions } from './config'

export function createRuntime(options: ResponsiveImagesOptions = {}): RuntimeState {
  const root = process.cwd()

  return {
    options: normalizeOptions(options),
    root,
    cacheDir: path.join(root, '.vitepress', 'cache', 'responsive-images'),
    outDir: path.join(root, '.vitepress', 'dist'),
    base: '/',
    manifest: new Map(),
    built: false
  }
}
