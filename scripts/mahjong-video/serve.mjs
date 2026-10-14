import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.ttf':'font/ttf', '.json':'application/json' }

export async function startServer(port = 0) {
  const server = http.createServer((req, res) => {
    let pathname
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname) } catch { res.writeHead(400).end(); return }
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1)
    const file = path.resolve(root, relative)
    if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end('Not found'); return }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' })
    fs.createReadStream(file).pipe(res)
  })
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve) })
  const address = server.address()
  return { server, url: `http://127.0.0.1:${address.port}/`, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const instance = await startServer(Number(process.env.PORT) || 0)
  console.log(`Mahjong stage: ${instance.url}`)
}
