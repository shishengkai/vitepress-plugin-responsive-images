import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

let cachedCss: string | undefined

export function getVpDocPictureCss(): string {
  if (!cachedCss) {
    const dir = dirname(fileURLToPath(import.meta.url))
    cachedCss = readFileSync(join(dir, 'vp-doc-picture.css'), 'utf8')
  }

  return cachedCss
}

export function responsiveImagesHeadConfig(): [string, Record<string, string>, string] {
  return ['style', { 'data-vpri-picture-styles': '' }, getVpDocPictureCss()]
}
