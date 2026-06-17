import type MarkdownIt from 'markdown-it'
import type Renderer from 'markdown-it/lib/renderer.mjs'
import type Token from 'markdown-it/lib/token.mjs'
import { transformHtmlImageTags } from './htmlTransform'
import type { RuntimeState } from './types'
import { getMarkdownPathFromEnv, resolveImageSource } from './path'
import { renderPicture } from './render'

export function responsiveImagesMarkdownPlugin(runtime: RuntimeState): (md: MarkdownIt) => void {
  return (md) => {
    const defaultImageRender = md.renderer.rules.image ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
    const defaultHtmlBlockRender = md.renderer.rules.html_block ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
    const defaultHtmlInlineRender = md.renderer.rules.html_inline ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx]
      const source = token.attrGet('src')

      if (!source) return defaultImageRender(tokens, idx, options, env, self)

      const markdownPath = getMarkdownPathFromEnv(runtime.root, env)
      const resolved = resolveImageSource({
        root: runtime.root,
        markdownPath,
        source,
        skipFormats: runtime.options.skipFormats
      })

      const entry = resolved ? runtime.manifest.get(resolved.key) : undefined

      if (!entry) return defaultImageRender(tokens, idx, options, env, self)

      return renderPicture(entry, runtime.options, {
        alt: renderAlt(token, options, env, self),
        title: token.attrGet('title') ?? undefined
      })
    }

    md.renderer.rules.html_block = (tokens, idx, options, env, self) => {
      const html = defaultHtmlBlockRender(tokens, idx, options, env, self)
      return transformHtmlImageTags(html, runtime, env)
    }

    md.renderer.rules.html_inline = (tokens, idx, options, env, self) => {
      const html = defaultHtmlInlineRender(tokens, idx, options, env, self)
      return transformHtmlImageTags(html, runtime, env)
    }
  }
}

function renderAlt(token: Token, options: Parameters<Renderer['renderInlineAsText']>[1], env: unknown, self: Renderer): string {
  return self.renderInlineAsText(token.children ?? [], options, env)
}
