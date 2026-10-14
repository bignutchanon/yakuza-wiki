const HONORS: Record<string, string> = {
  '1z': 'ลมตะวันออก', '2z': 'ลมใต้', '3z': 'ลมตะวันตก', '4z': 'ลมเหนือ',
  '5z': 'มังกรขาว', '6z': 'มังกรเขียว', '7z': 'มังกรแดง',
}
const SUITS: Record<string, string> = { m: 'ตัวอักษร', p: 'วงกลม', s: 'ไม้ไผ่' }
// รูปแบบย่อแบบ Tenhou ที่ brief ใช้: "234m" = 2m 3m 4m · "1234567z" = ลม/มังกรครบ 7 แบบ
// ทั้งก้อนต้องตรงรูปแบบ ไม่งั้น build พัง (กันพิมพ์ผิดหลุดขึ้นเว็บ)
function parseGroup(source: string): string[] {
  if (!/^(?:[1-9]+[mps]|[1-7]+z)+$/.test(source)) throw new Error(`โค้ดไพ่ไม่ถูกต้อง: ${source}`)
  return [...source.matchAll(/(\d+)([mpsz])/g)].flatMap(([, digits, suit]) => [...digits].map((d) => d + suit))
}

function describeGroup(tokens: string[]): string {
  if (tokens.every((code) => !code.endsWith('z') && code[1] === tokens[0][1])) {
    return `${tokens.map((code) => code[0]).join('-')} ${SUITS[tokens[0][1]]}`
  }
  return tokens.map((code) => code.endsWith('z') ? HONORS[code] : `${code[0]} ${SUITS[code[1]]}`).join(' · ')
}

export function expandTiles(markdown: string, mode: 'html' | 'text'): string {
  return markdown.replace(/^\{\{tiles:([^}\r\n]+)\}\}(?=\r?$)/gm, (_match, raw: string) => {
    const groups = raw.trim().split(/\s+/).map(parseGroup)
    if (!groups.length) throw new Error('ชุดไพ่ต้องมีอย่างน้อยหนึ่งกลุ่ม')
    if (mode === 'text') return `[ไพ่: ${groups.map(describeGroup).join(' | ')}]`
    const label = groups.map(describeGroup).join(', ')
    return `<span class="tile-row" role="img" aria-label="ไพ่: ${label}">${groups.map((group) => `<span class="tile-group">${group.map((code) => `<img src="/mahjong/tiles/${code}.webp" alt="" width="36" height="48" loading="lazy" decoding="async">`).join('')}</span>`).join(' ')}</span>`
  }).replace(/\{\{tiles:[^}\n]*\}\}/g, (bad) => { throw new Error(`รูปแบบไพ่ไม่ถูกต้อง: ${bad}`) })
}
