import fs from 'node:fs/promises'
import path from 'node:path'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import type { RuntimeState } from './types'
import { buildManifest } from './scan'
import { joinUrl } from './path'

export function responsiveImagesVitePlugin(runtime: RuntimeState): Plugin {
  let resolvedConfig: ResolvedConfig | undefined
  const virtualPrefix = '\0vitepress-responsive-image:'

  return {
    name: 'vitepress-plugin-responsive-images',
    async configResolved(config) {
      resolvedConfig = config
      applyResolvedConfig(runtime, config)
      await ensureManifest(runtime)
    },
    async buildStart() {
      await ensureManifest(runtime)
    },
    resolveId(source) {
      const fileName = getGeneratedFileName(source, runtime)
      return fileName ? `${virtualPrefix}${fileName}` : undefined
    },
    load(id) {
      if (!id.startsWith(virtualPrefix)) return undefined
      const fileName = id.slice(virtualPrefix.length)
      return `export default ${JSON.stringify(joinUrl(runtime.base, runtime.options.outputDir, fileName))}`
    },
    async configureServer(server) {
      await ensureManifest(runtime)
      installDevMiddleware(server, runtime)
      server.watcher.on('change', async () => {
        await rebuildManifest(runtime)
      })
    },
    async closeBundle() {
      if (!resolvedConfig) return
      await copyGeneratedImages(runtime)
    }
  }
}

function applyResolvedConfig(runtime: RuntimeState, config: ResolvedConfig): void {
  runtime.root = config.root
  runtime.base = config.base || '/'
  runtime.cacheDir = path.join(config.cacheDir, 'responsive-images')
  runtime.outDir = config.build.outDir
}

async function ensureManifest(runtime: RuntimeState): Promise<void> {
  if (!runtime.built) {
    await rebuildManifest(runtime)
  }
}

async function rebuildManifest(runtime: RuntimeState): Promise<void> {
  await buildManifest(runtime)
}

function getGeneratedFileName(source: string, runtime: RuntimeState): string | undefined {
  const normalizedBase = runtime.base === '/' ? '' : runtime.base.replace(/\/+$/g, '')
  const prefixes = [`/${runtime.options.outputDir}/`]

  if (normalizedBase) {
    prefixes.push(`${normalizedBase}/${runtime.options.outputDir}/`)
  }

  for (const prefix of prefixes) {
    if (source.startsWith(prefix)) {
      return source.slice(prefix.length)
    }
  }

  return undefined
}

function installDevMiddleware(server: ViteDevServer, runtime: RuntimeState): void {
  const mountPath = `/${runtime.options.outputDir}/`

  server.middlewares.use(mountPath, async (request, response, next) => {
    const requestUrl = request.url?.split('?')[0] ?? ''
    const fileName = decodeURIComponent(requestUrl.replace(/^\/+/, ''))
    const filePath = path.join(runtime.cacheDir, fileName)

    try {
      const file = await fs.readFile(filePath)
      response.statusCode = 200
      response.end(file)
    } catch {
      next()
    }
  })
}

async function copyGeneratedImages(runtime: RuntimeState): Promise<void> {
  const targetDir = path.join(runtime.outDir, runtime.options.outputDir)
  await fs.mkdir(targetDir, { recursive: true })

  try {
    const files = await fs.readdir(runtime.cacheDir)
    await Promise.all(
      files.map((file) => fs.copyFile(path.join(runtime.cacheDir, file), path.join(targetDir, file)))
    )
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : undefined
    if (code !== 'ENOENT') throw error
  }
}
