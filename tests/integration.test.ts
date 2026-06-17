import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import sharp from 'sharp'
import { beforeAll, describe, expect, it } from 'vitest'
import type { ResolvedConfig } from 'vite'
import { createResponsiveImagesPlugins } from '../src/index'

const execFileAsync = promisify(execFile)
const fixtureRoot = path.resolve('tests/fixtures/basic')
const docsRoot = path.join(fixtureRoot, 'docs')

beforeAll(async () => {
  await fs.mkdir(path.join(docsRoot, 'images'), { recursive: true })
  await sharp({
    create: {
      width: 1200,
      height: 600,
      channels: 3,
      background: '#3366ff'
    }
  })
    .png()
    .toFile(path.join(docsRoot, 'images', 'dashboard.png'))
})

describe('VitePress integration', () => {
  it('warms the manifest during config resolution', async () => {
    const { runtime, vitePlugin } = createResponsiveImagesPlugins({
      widths: [480, 720],
      formats: ['webp']
    })

    const config = {
      root: docsRoot,
      base: '/',
      cacheDir: path.join(docsRoot, '.vitepress', 'cache'),
      build: {
        outDir: path.join(docsRoot, '.vitepress', 'dist')
      }
    } as ResolvedConfig

    if (typeof vitePlugin.configResolved !== 'function') {
      throw new Error('Expected configResolved hook to be defined.')
    }

    await (vitePlugin.configResolved as unknown as (config: ResolvedConfig) => void | Promise<void>)(config)

    expect(runtime.built).toBe(true)
    expect(runtime.manifest.size).toBeGreaterThan(0)
    expect([...runtime.manifest.values()].some((entry) => entry.source === './images/dashboard.png')).toBe(true)
  })

  it('supports original-size format conversion without resized variants', async () => {
    const { runtime, vitePlugin } = createResponsiveImagesPlugins({
      widths: [0],
      defaultWidth: 0,
      formats: ['webp']
    })

    const config = {
      root: docsRoot,
      base: '/',
      cacheDir: path.join(docsRoot, '.vitepress', 'cache'),
      build: {
        outDir: path.join(docsRoot, '.vitepress', 'dist')
      }
    } as ResolvedConfig

    if (typeof vitePlugin.configResolved !== 'function') {
      throw new Error('Expected configResolved hook to be defined.')
    }

    await (vitePlugin.configResolved as unknown as (config: ResolvedConfig) => void | Promise<void>)(config)

    const entry = [...runtime.manifest.values()].find((manifestEntry) => manifestEntry.source === './images/dashboard.png')

    expect(entry?.displayWidth).toBe(1200)
    expect(entry?.displayHeight).toBe(600)
    expect(entry?.sources.webp?.map((candidate) => candidate.width)).toEqual([1200])
    expect(entry?.fallback.candidates.map((candidate) => candidate.width)).toEqual([1200])
  })

  it('supports lossless modern format output', async () => {
    const { runtime, vitePlugin } = createResponsiveImagesPlugins({
      widths: [0],
      formats: ['avif', 'webp'],
      quality: {
        avif: -1,
        webp: -1
      }
    })

    const config = {
      root: docsRoot,
      base: '/',
      cacheDir: path.join(docsRoot, '.vitepress', 'cache'),
      build: {
        outDir: path.join(docsRoot, '.vitepress', 'dist')
      }
    } as ResolvedConfig

    if (typeof vitePlugin.configResolved !== 'function') {
      throw new Error('Expected configResolved hook to be defined.')
    }

    await (vitePlugin.configResolved as unknown as (config: ResolvedConfig) => void | Promise<void>)(config)

    const entry = [...runtime.manifest.values()].find((manifestEntry) => manifestEntry.source === './images/dashboard.png')
    const avifPath = entry?.sources.avif?.[0]?.path
    const webpPath = entry?.sources.webp?.[0]?.path

    expect(avifPath).toBeDefined()
    expect(avifPath).toContain('avif-lossless')
    expect(webpPath).toBeDefined()
    expect(webpPath).toContain('webp-lossless')
    const avifStats = await fs.stat(avifPath!)
    const webpStats = await fs.stat(webpPath!)
    expect(avifStats.isFile()).toBe(true)
    expect(webpStats.isFile()).toBe(true)
  })

  it('builds picture markup and generated assets', async () => {
    await execFileAsync('npx', ['vitepress', 'build', 'docs'], {
      cwd: fixtureRoot,
      env: { ...process.env, NODE_ENV: 'production' }
    })

    const html = await fs.readFile(path.join(docsRoot, '.vitepress', 'dist', 'index.html'), 'utf8')
    const generatedAssets = await fs.readdir(path.join(docsRoot, '.vitepress', 'dist', '_responsive-images'))

    expect(html).toContain('<picture>')
    expect(html).toContain('data-vpri-picture-styles')
    expect(html).toContain('.vp-doc picture')
    expect(html).toContain('max-width: 100%')
    expect(html).toContain('type="image/webp"')
    expect(html).toContain('srcset=')
    expect(html).toContain('dashboard')
    expect(generatedAssets.some((asset) => asset.endsWith('.webp'))).toBe(true)
    expect(generatedAssets.some((asset) => asset.endsWith('.png'))).toBe(true)
  })
})
