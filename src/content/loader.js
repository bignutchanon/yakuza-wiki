// โหลดเนื้อหา markdown ทั้งหมดตอน build — ไฟล์เนื้อหาคือ source of truth ของรายชื่อบท
// โครงไฟล์: src/content/<gameId>/ch-NN.md และ src/content/<gameId>/substories.md
//
// frontmatter ที่รองรับ:
//   n: เลขบท (เฉพาะ ch-*.md)
//   title: ชื่อบทภาษาอังกฤษ (ทางการ)
//   thai: ชื่อบทภาษาไทย
//   part: ชื่อพาร์ท (ภาคที่แบ่งเป็นพาร์ท เช่น Yakuza 4/5)

const raw = import.meta.glob('./*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!m) return { meta: {}, body: text }
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i === -1) continue
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { meta, body: text.slice(m[0].length) }
}

const byGame = {}
for (const [path, text] of Object.entries(raw)) {
  const [, gameId, file] = path.match(/^\.\/([^/]+)\/([^/]+)\.md$/) || []
  if (!gameId) continue
  const { meta, body } = parseFrontmatter(text)
  byGame[gameId] ??= { chapters: [], substories: null }
  if (file === 'substories') {
    byGame[gameId].substories = { meta, body }
  } else if (file.startsWith('ch-')) {
    byGame[gameId].chapters.push({
      n: Number(meta.n ?? file.replace('ch-', '')),
      title: meta.title || '',
      thai: meta.thai || '',
      part: meta.part || '',
      body,
    })
  }
}
for (const g of Object.values(byGame)) g.chapters.sort((a, b) => a.n - b.n)

export const contentFor = (gameId) =>
  byGame[gameId] || { chapters: [], substories: null }
