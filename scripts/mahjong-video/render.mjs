import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { startServer } from './serve.mjs'
import { timelineInfo, sceneAt } from './src/timeline.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(root, '../..')
const out = path.join(root, 'out')
const flags = new Set(process.argv.slice(2).filter((arg) => arg.startsWith('--')))
const value = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 ? Number(process.argv[i + 1]) : fallback }
const scale = value('--scale', 1)
const from = value('--from', 0)
const to = value('--to', timelineInfo.duration)
const fps = timelineInfo.fps
const stillOnly = flags.has('--stills')
const tilesOnly = flags.has('--tiles')
const encodeOnly = flags.has('--encode-only')
const review = timelineInfo.reviewTimes.map((time, i) => ({ time, i, scene: sceneAt(time).scene.id }))

fs.mkdirSync(out, { recursive: true }); fs.mkdirSync(path.join(out, 'stills'), { recursive: true })

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options })
    let stdout = ''; let stderr = ''
    child.stdout?.on('data', (chunk) => { stdout += chunk })
    child.stderr?.on('data', (chunk) => { stderr += chunk })
    child.once('error', reject)
    child.once('close', (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${command} exit ${code}: ${stderr}`)))
  })
}

async function capture() {
  const server = await startServer()
  let browser
  try {
    browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--use-angle=d3d11','--ignore-gpu-blocklist','--enable-unsafe-swiftshader'] })
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } })
    const pageErrors = []
    page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()) })
    page.on('pageerror', (error) => pageErrors.push(error.stack || error.message))
    await page.goto(server.url, { waitUntil: 'networkidle0' })
    await page.evaluate(() => window.ready)
    const context = await page.evaluate(() => {
      const gl = document.querySelector('#gl').getContext('webgl2')
      return gl ? gl.getParameter(gl.RENDERER) : null
    })
    if (!context) throw new Error('WebGL2 context unavailable (Chrome headless GPU/WebGL initialization failed)')
    console.error(`WebGL renderer: ${context}`)
    const draw = async (time, dest, screenshotScale = 1) => {
      await page.evaluate((t) => window.renderAt(t), time)
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080, scale: screenshotScale }, optimizeForSpeed: true })
      if (pageErrors.length || (await page.evaluate(() => window.renderErrors.length))) throw new Error(`หน้าเวทีรายงาน error: ${[...pageErrors, ...(await page.evaluate(() => window.renderErrors))].join('\n')}`)
      if (dest) fs.writeFileSync(dest, png)
      return png
    }
    if (tilesOnly) {
      await exportTiles(page); return
    }
    if (stillOnly) {
      for (const { time, i, scene } of review) {
        if (time < from || time > to) continue
        const name = `${String(i + 1).padStart(2, '0')}-${scene}-${time.toFixed(1)}.png`
        await draw(time, path.join(out, 'stills', name), scale)
      }
      const files = fs.readdirSync(path.join(out, 'stills')).filter((name) => name.endsWith('.png')).sort()
      if (files.length) {
        const inputs = files.flatMap((name) => ['-i', path.join(out, 'stills', name)])
        await run('ffmpeg', ['-y', ...inputs, '-filter_complex', `concat=n=${files.length}:v=1:a=0,scale=480:-1,tile=4x${Math.ceil(files.length / 4)}`, '-frames:v', '1', path.join(out, 'contact.png')])
      }
      return
    }
    if (!encodeOnly) {
      const ffmpeg = spawn('ffmpeg', ['-y','-f','image2pipe','-framerate',String(fps),'-c:v','png','-i','-','-c:v','libx264','-preset','veryfast','-crf','12','-pix_fmt','yuv420p',path.join(out,'master.mp4')], { stdio: ['pipe','ignore','pipe'] })
      let ffmpegError = ''; ffmpeg.stderr.on('data', (chunk) => { ffmpegError += chunk })
      const frames = Math.ceil((to - from) * fps); const started = process.hrtime.bigint()
      try {
        for (let i = 0; i < frames; i++) {
          const time = from + i / fps
          const png = await draw(time, null, scale)
          if (!ffmpeg.stdin.write(png)) await new Promise((resolve, reject) => { ffmpeg.stdin.once('drain', resolve); ffmpeg.stdin.once('error', reject) })
          if ((i + 1) % 100 === 0) {
            const elapsed = Number(process.hrtime.bigint() - started) / 1e9; const remaining = elapsed / (i + 1) * (frames - i - 1)
            console.error(`เฟรม ${i + 1}/${frames} · เหลือประมาณ ${Math.ceil(remaining / 60)} นาที`)
          }
        }
      } catch (error) { ffmpeg.stdin.destroy(); ffmpeg.kill(); throw error }
      ffmpeg.stdin.end()
      await new Promise((resolve, reject) => { ffmpeg.once('error', reject); ffmpeg.once('close', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg master exit ${code}: ${ffmpegError}`))) })
      await draw(timelineInfo.posterTime, path.join(out, 'poster.png'))
    }
    await encodeOutputs()
    await writeManifest()
    await exportTiles(page)
  } finally {
    if (browser) await browser.close()
    await server.close()
  }
}

async function exportTiles(page) {
  const faces = await page.evaluate(() => window.exportTileFaces())
  const tileDir = path.join(repo, 'public', 'mahjong', 'tiles')
  fs.mkdirSync(tileDir, { recursive: true })
  for (const { code, dataUrl } of faces) fs.writeFileSync(path.join(tileDir, `${code}.webp`), Buffer.from(dataUrl.split(',')[1], 'base64'))
  console.error(`Exported ${faces.length} tile faces.`)
}

async function writeManifest() {
  const probe = await run('ffprobe', ['-v','error','-print_format','json','-show_format','-show_streams',path.join(out,'final.mp4')])
  const report = JSON.parse(probe.stdout); const video = report.streams.find((stream) => stream.codec_type === 'video')
  const manifest = { src:'/video/mahjong-basics.mp4', poster:'/video/mahjong-basics-poster.webp', width:video.width, height:video.height, posterWidth:1280, posterHeight:720, duration:Number(report.format.duration), bytes:Number(report.format.size) }
  fs.writeFileSync(path.join(repo,'src/data/videos/mahjong-basics.json'), `${JSON.stringify(manifest,null,2)}\n`)
}

async function encodeOutputs() {
  let quality = 23
  while (quality <= 30) {
    await run('ffmpeg', ['-y','-i',path.join(out,'master.mp4'),'-c:v','libx264','-preset','slow','-tune','animation','-crf',String(quality),'-pix_fmt','yuv420p','-profile:v','high','-level:v','4.1','-movflags','+faststart','-an',path.join(out,'final.mp4')])
    if (fs.statSync(path.join(out,'final.mp4')).size <= 8 * 1024 * 1024) break
    quality++
  }
  if (quality > 30) throw new Error(`MP4 เกิน 8 MB ที่ CRF 30 (${fs.statSync(path.join(out,'final.mp4')).size} bytes)`)
  let webpQuality = 82
  while (webpQuality >= 52) {
    await run('ffmpeg', ['-y','-i',path.join(out,'poster.png'),'-vf','scale=1280:720:flags=lanczos','-frames:v','1','-c:v','libwebp','-quality',String(webpQuality),path.join(out,'poster.webp')])
    if (fs.statSync(path.join(out,'poster.webp')).size <= 150 * 1024) break
    webpQuality -= 5
  }
  if (webpQuality < 52) throw new Error('โปสเตอร์เกิน 150 KB แม้ลดคุณภาพถึง 52')
  fs.mkdirSync(path.join(repo,'public/video'), { recursive: true })
  fs.copyFileSync(path.join(out,'final.mp4'),path.join(repo,'public/video/mahjong-basics.mp4'))
  fs.copyFileSync(path.join(out,'poster.webp'),path.join(repo,'public/video/mahjong-basics-poster.webp'))
}

if (encodeOnly) { await encodeOutputs(); await writeManifest() }
else await capture()
