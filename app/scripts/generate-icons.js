/**
 * Generate PWA icons from logo.svg
 * This script converts the SVG logo to various PNG sizes required for PWA
 * 
 * Requirements:
 * - sharp package for image conversion
 * - Run: npm install --save-dev sharp
 */

import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const iconSizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 48, name: 'icon-48x48.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 1024, name: 'icon-1024x1024.png' }
]

const logoPath = resolve(__dirname, '../public/logo.svg')
const iconsDir = resolve(__dirname, '../public/icons')

async function generateIcons() {
  try {
    console.log('📦 開始生成 PWA 圖標...')
    console.log(`📁 Logo 路徑: ${logoPath}`)
    console.log(`📁 輸出目錄: ${iconsDir}`)

    // 讀取 SVG
    const svgBuffer = readFileSync(logoPath)
    console.log('✅ Logo SVG 讀取成功')

    // 生成各種尺寸的圖標
    for (const { size, name } of iconSizes) {
      const outputPath = resolve(iconsDir, name)
      
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // 透明背景
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath)
      
      console.log(`✅ 生成: ${name} (${size}x${size})`)
    }

    // 生成 favicon.ico (16x16, 32x32, 48x48 組合)
    const faviconPath = resolve(__dirname, '../public/favicon.ico')
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'))
    
    console.log('✅ 生成: favicon.png')
    console.log('\n🎉 所有圖標生成完成！')
    console.log(`📂 圖標位置: ${iconsDir}`)
    
  } catch (error) {
    console.error('❌ 生成圖標時發生錯誤:', error)
    process.exit(1)
  }
}

generateIcons()

