import type MarkdownIt from 'markdown-it'
import type { Plugin as VitePlugin } from 'vite'
import type { ResponsiveImagesOptions, RuntimeState } from './types'
import { createRuntime } from './runtime'
import { responsiveImagesMarkdownPlugin } from './markdownPlugin'
import { responsiveImagesVitePlugin } from './vitePlugin'

export type { ResponsiveImagesOptions } from './types'

export function responsiveImages(options: ResponsiveImagesOptions = {}): (md: MarkdownIt) => void {
  return responsiveImagesMarkdownPlugin(createRuntime(options))
}

export function createResponsiveImagesPlugins(options: ResponsiveImagesOptions = {}): {
  runtime: RuntimeState
  markdownPlugin: (md: MarkdownIt) => void
  vitePlugin: VitePlugin
} {
  const runtime = createRuntime(options)

  return {
    runtime,
    markdownPlugin: responsiveImagesMarkdownPlugin(runtime),
    vitePlugin: responsiveImagesVitePlugin(runtime)
  }
}

export function withResponsiveImages<T>(config: T, options: ResponsiveImagesOptions = {}): T {
  if (typeof config === 'function') {
    return (async (...args: unknown[]) => {
      const resolved = await (config as (...args: unknown[]) => unknown)(...args)
      return withResponsiveImages(resolved, options)
    }) as T
  }

  const plugins = createResponsiveImagesPlugins(options)
  const userConfig = (config ?? {}) as Record<string, any>
  const vite = { ...(userConfig.vite ?? {}) }
  const markdown = { ...(userConfig.markdown ?? {}) }
  const previousMarkdownConfig = markdown.config

  vite.plugins = [...toArray(vite.plugins), plugins.vitePlugin]
  markdown.config = (...args: unknown[]) => {
    if (typeof previousMarkdownConfig === 'function') {
      previousMarkdownConfig(...args)
    }
    const md = args[0] as MarkdownIt
    md.use(plugins.markdownPlugin)
  }

  return {
    ...userConfig,
    vite,
    markdown
  } as T
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}
