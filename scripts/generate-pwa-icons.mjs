/**
 * public/pwa-icon.svg → PNG 아이콘 생성 (PWA·파비콘·iOS)
 * 사용: npm install -D sharp && node scripts/generate-pwa-icons.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pub = path.join(root, 'public')
const svgPath = path.join(pub, 'pwa-icon.svg')

async function main () {
  const { default: sharp } = await import('sharp')
  const svg = fs.readFileSync(svgPath)

  const out = [
    ['pwa-192x192.png', 192],
    ['pwa-512x512.png', 512],
    ['apple-touch-icon.png', 180],
    ['favicon-32x32.png', 32],
    ['favicon-48x48.png', 48],
  ]

  for (const [name, size] of out) {
    await sharp(svg).resize(size, size).png().toFile(path.join(pub, name))
    console.log('Wrote', name)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
