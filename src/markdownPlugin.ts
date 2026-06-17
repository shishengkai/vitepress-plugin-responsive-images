import type MarkdownIt from 'markdown-it'
import type Renderer from 'markdown-it/lib/renderer.mjs'
import type Token from 'markdown-it/lib/token.mjs'
import type { RuntimeState } from './types'
import { getMarkdownPathFromEnv, resolveImageSource } from './path'
import { renderPicture } from './render'

export function responsiveImagesMarkdownPlugin(runtime: RuntimeState): (md: MarkdownIt) => void {
  return (md) => {
    const defaultRender = md.renderer.rules.image ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx]
      const source = token.attrGet('src')

      if (!source) return defaultRender(tokens, idx, options, env, self)

      const markdownPath = getMarkdownPathFromEnv(runtime.root, env)
      const resolved = resolveImageSource({
        root: runtime.root,
        markdownPath,
        source,
        skipFormats: runtime.options.skipFormats
      })

      const entry = resolved ? runtime.manifest.get(resolved.key) : undefined

      if (!entry) return defaultRender(tokens, idx, options, env, self)

      return renderPicture(entry, runtime.options, {
        alt: renderAlt(token, options, env, self),
        title: token.attrGet('title') ?? undefined
      })
    }
  }
}

function renderAlt(token: Token, options: Parameters<Renderer['renderInlineAsText']>[1], env: unknown, self: Renderer): string {
  return self.renderInlineAsText(token.children ?? [], options, env)
}
