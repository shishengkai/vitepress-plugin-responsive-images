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

  it('builds picture markup and generated assets', async () => {
    await execFileAsync('npx', ['vitepress', 'build', 'docs'], {
      cwd: fixtureRoot,
      env: { ...process.env, NODE_ENV: 'production' }
    })

    const html = await fs.readFile(path.join(docsRoot, '.vitepress', 'dist', 'index.html'), 'utf8')
    const assets = await fs.readdir(path.join(docsRoot, '.vitepress', 'dist', '_responsive-images'))

    expect(html).toContain('<picture>')
    expect(html).toContain('type="image/webp"')
    expect(html).toContain('srcset=')
    expect(html).toContain('dashboard')
    expect(assets.some((asset) => asset.endsWith('.webp'))).toBe(true)
    expect(assets.some((asset) => asset.endsWith('.png'))).toBe(true)
  })
})
