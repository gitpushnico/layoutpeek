import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dir, '..')

// Vite IIFE output: dist/layoutpeek (no extension when fileName returns no format suffix)
const jsPath = resolve(root, 'dist', 'layoutpeek')
const js = readFileSync(jsPath, 'utf-8').trim()

const bookmarklet = `javascript:${encodeURIComponent(js)}`

// Write plain text version
writeFileSync(resolve(root, 'dist', 'bookmarklet.txt'), bookmarklet)

// Patch landing page with the new bookmarklet href
const landingPath = resolve(root, 'landing', 'index.html')
let html = readFileSync(landingPath, 'utf-8')
html = html.replace(
  /id="lp-bookmarklet"\s+href="[^"]*"/,
  `id="lp-bookmarklet" href="${bookmarklet}"`,
)
html = html.replace(
  /href="[^"]*"\s+id="lp-bookmarklet"/,
  `href="${bookmarklet}" id="lp-bookmarklet"`,
)
writeFileSync(landingPath, html)

const kb = (bookmarklet.length / 1024).toFixed(1)
console.log(`\nLayoutPeek bookmarklet generated`)
console.log(`Size: ${kb}KB (${bookmarklet.length} chars)`)
console.log(`Output: dist/bookmarklet.txt`)
console.log(`Landing: landing/index.html updated\n`)
