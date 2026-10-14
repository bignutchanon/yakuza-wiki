import { parseTiles } from './mahjong.js'

const cap = (at, end, text) => ({ at, end, text })
const hand = (text, id = 'hand-us') => ({ id, seat: 'us', groups: text.split(/\s+/).map(parseTiles), codes: parseTiles(text) })

export const timeline = [
  { id: 'intro', duration: 5, camera: 'overview', setup: { walls: true }, captions: [], reviewTimes: [2.5], events: [], overlay: { title: 'มาจองญี่ปุ่น', subtitle: 'พื้นฐานที่ต้องรู้ก่อนเล่นในเกม Yakuza' } },
  { id: 'tiles', duration: 14, camera: 'center', setup: { walls: false, hands: [], tileRows: true }, captions: [
    cap(.4, 4, 'ไพ่มี 34 แบบ แบบละ 4 ใบ รวม **136 ใบ**'),
    cap(4.4, 9.4, 'ไพ่เลขมี 3 ดอก ดอกละ 1–9: **ตัวอักษร · วงกลม · ไม้ไผ่**'),
    cap(9.4, 14, 'อีก 7 แบบคือ **ไพ่ลม** 4 ทิศ และ **ไพ่มังกร** 3 สี'),
  ], reviewTimes: [3, 7, 9, 11, 13], events: [
    { type: 'labels', at: 4.4, dur: 5, rows: ['ตัวอักษร', 'วงกลม', 'ไม้ไผ่', 'ลม · มังกร'] },
    { type: 'numbers', at: 4.4, dur: 5, row: 'm' },
    { type: 'honors', at: 9.4, dur: 4.6, text: 'ตะวันออก · ใต้ · ตะวันตก · เหนือ | ขาว · เขียว · แดง' },
    { type: 'chip', at: 4.4, dur: 5, text: 'ดูเลขคันจิด้านบน', anchor: 'row-m', kind: 'info' },
    { type: 'chip', at: 10.6, dur: 3.4, text: '1 ไม้ไผ่ = รูปนก', anchor: 'row-2-0', kind: 'info' },
  ] },
  { id: 'shape', duration: 16, camera: 'hand', setup: { walls: false, hands: [hand('234m 567p 88p 345s 666s')] }, captions: [
    cap(1.4, 5.4, 'เป้าหมาย: ทำมือ **14 ใบ** ให้เป็น **4 ชุด + 1 คู่**'),
    cap(5.6, 9.8, '**ชุดเรียง** = เลขเรียงกัน 3 ใบ ดอกเดียวกัน'),
    cap(9.8, 12.8, '**ชุดตอง** = ไพ่เหมือนกัน 3 ใบ'),
    cap(12.8, 16, '**คู่** = ไพ่เหมือนกัน 2 ใบ'),
  ], complete: [parseTiles('234m 567p 88p 345s 666s')], reviewTimes: [3, 7.5, 11.2, 14.3, 15.5], events: [
    { type: 'gap', at: 5, dur: .8, groups: [3, 3, 2, 3, 3] },
    { type: 'highlight', at: 5.6, dur: 3.8, groups: ['234m', '567p', '345s'], dim: .45 },
    { type: 'chip', at: 5.6, dur: 3.8, text: 'เรียง', anchors: ['group-0', 'group-1', 'group-3'], kind: 'label' },
    { type: 'highlight', at: 9.8, dur: 2.7, groups: ['666s'], dim: .45 },
    { type: 'chip', at: 9.8, dur: 2.7, text: 'ตอง', anchor: 'group-4', kind: 'label' },
    { type: 'highlight', at: 12.8, dur: 2.8, groups: ['88p'], dim: .45 },
    { type: 'chip', at: 12.8, dur: 2.8, text: 'คู่', anchor: 'group-2', kind: 'label' },
    { type: 'highlight', at: 14.4, dur: 1.6, groups: ['234m', '567p', '88p', '345s', '666s'], dim: 0 },
    { type: 'bigword', at: 14.4, dur: 1.6, text: '4 ชุด + 1 คู่ ✓' },
  ] },
  { id: 'turn', duration: 10, camera: 'handTable', setup: { walls: true, hands: [hand('234m 567p 88p 345s 6s 1z')] }, captions: [
    cap(.4, 5, 'แต่ละตา **จั่ว 1 ใบ** แล้ว **ทิ้ง 1 ใบ** — ในมือถือไว้ 13 ใบ'),
    cap(5, 10, 'ขาดอีกใบเดียวก็ครบ เรียกว่า **เท็นไป** (รอไพ่)'),
  ], tenpai: [{ tiles: parseTiles('234m 567p 88p 345s 66s'), waits: ['8p', '6s'] }], reviewTimes: [3, 6.5, 8], events: [
    { type: 'draw', at: 2, dur: .8, code: '6s', seat: 'us', from: { zone: 'wall', index: 3, layer: 1 }, to: { zone: 'hand', index: 13, count: 14, drawn: true } },
    { type: 'discard', at: 3.6, dur: 1, code: '1z', seat: 'us', from: { zone: 'hand', index: 13, count: 14 }, to: { zone: 'pond', seat: 'us', index: 0 }, sideways: false },
    { type: 'ghost', at: 5.6, dur: 4, examples: [{ code: '8p', pos: [-.75, .675, 1.4], rot: [0, 0, 0] }, { code: '6s', pos: [.75, .675, 1.4], rot: [0, 0, 0] }] },
    { type: 'chip', at: 5.6, dur: 4, text: 'รอ 8 วงกลม หรือ 6 ไม้ไผ่', anchor: 'waits', kind: 'info' },
  ] },
  { id: 'yaku', duration: 23.6, camera: 'handTable', setup: { walls: true, hands: [hand('234m 567p 88p 345s 66s')] }, captions: [
    cap(.2, 5.2, 'กฎสำคัญ: ครบรูปแล้วต้องมี **ยากุ** อย่างน้อย 1 อย่าง ถึงจะชนะได้'),
    cap(5.2, 10, 'ยากุที่ง่ายที่สุดคือ **ริอิจิ**: มือปิด (ไม่ได้ขอไพ่ใคร) + เท็นไป ก็ประกาศได้'),
    cap(10, 14, 'ประกาศแล้วต้อง **วาง 1,000 แต้ม** และหลังจากนั้น **ห้ามเปลี่ยนมือ**'),
    cap(14, 18, 'จั่วได้ใบที่ไม่ได้รอ ต้องทิ้งใบนั้นออกไปทันที'),
    cap(18, 23.6, 'ทริกในเกม: กดปุ่ม **ริอิจิ** ได้ทุกตาโดยไม่มีโทษ ถ้าเท็นไปแล้วเกมจะบอกไพ่ที่รอให้'),
  ], tenpai: [{ tiles: parseTiles('234m 567p 88p 345s 66s'), waits: ['8p', '6s'] }], reviewTimes: [2.5, 7.5, 11.5, 16.4, 20.5, 22.8], events: [
    { type: 'bigword', at: .6, dur: 4.4, text: 'ยากุ', detail: '= เงื่อนไขของมือที่ทำให้ได้แต้ม' },
    { type: 'draw', at: 6, dur: .6, code: '9m', seat: 'us', from: { zone: 'wall', index: 5, layer: 1 }, to: { zone: 'hand', index: 13, count: 14, drawn: true } },
    { type: 'discard', at: 6.8, dur: .8, code: '9m', seat: 'us', from: { zone: 'hand', index: 13, count: 14 }, to: { zone: 'pond', index: 0 }, sideways: true },
    { type: 'chip', at: 7.2, dur: 2.2, text: 'ริอิจิ!', anchor: 'pond-us-0', kind: 'label' },
    { type: 'stick', at: 7.6, dur: 11, visible: true },
    { type: 'lock', at: 10, dur: 4, visible: true },
    { type: 'draw', at: 14.6, dur: .6, code: '2p', seat: 'us', from: { zone: 'wall', index: 7, layer: 1 }, to: { zone: 'hand', index: 13, count: 14, drawn: true } },
    { type: 'discard', at: 16, dur: .8, code: '2p', seat: 'us', from: { zone: 'hand', index: 13, count: 14 }, to: { zone: 'pond', index: 1 }, sideways: false },
    { type: 'reset', at: 18, dur: .3 },
    { type: 'stick', at: 18.6, dur: .6, visible: false },
    { type: 'popup', at: 18.6, dur: 5, title: 'ไพ่ที่รอ', rows: [{ code: '8p', text: 'เหลือ 2 ใบ' }, { code: '6s', text: 'เหลือ 2 ใบ' }] },
  ] },
  { id: 'easy-yaku', duration: 13, camera: 'hand', setup: { walls: false, hands: [hand('234m 567p 88p 345s 666s'), hand('234m 55p 678p 345s 777z'), hand('22m 55m 33p 77p 44s 99s 66z')] }, captions: [
    cap(.2, 4.2, '**ไพ่ธรรมดาล้วน** (ทันยาโอ): ใช้แต่ไพ่เลข 2–8 — ไม่มี 1, 9, ลม, มังกร'),
    cap(4.2, 8.4, '**ยากุไฮ**: ตองมังกรสีไหนก็ได้ — ขอไพ่คนอื่นมาทำก็ยังนับ'),
    cap(8.4, 13, '**เจ็ดคู่** (ชีโทอิสึ): คู่ไม่ซ้ำกัน 7 คู่ — รูปพิเศษที่ไม่ต้องมี 4 ชุด'),
  ], complete: [parseTiles('234m 567p 88p 345s 666s'), parseTiles('234m 55p 678p 345s 777z'), parseTiles('22m 55m 33p 77p 44s 99s 66z')], reviewTimes: [2.5, 6.5, 10.5, 12.5], events: [
    { type: 'checkmarks', at: .2, dur: 4, hand: 0 },
    { type: 'highlight', at: 4.2, dur: 4.2, groups: ['777z'], dim: .45 },
    { type: 'highlight', at: 8.4, dur: 4.5, pairs: true, dim: .45 },
    { type: 'chip', at: .2, dur: 4, text: 'ไพ่ธรรมดาล้วน (ทันยาโอ)', anchor: 'hand', kind: 'label' },
    { type: 'chip', at: 4.2, dur: 4.2, text: 'ยากุไฮ', anchor: 'group-4', kind: 'label' },
    { type: 'chip', at: 8.4, dur: 4.5, text: 'เจ็ดคู่', anchor: 'hand', kind: 'label' },
  ] },
  { id: 'calls', duration: 18, camera: 'table', setup: { walls: true, hands: [hand('34m 46p 345s 99s 77z 1z 3z')], opponents: { right: '123m 456p 789s 123z', opposite: '234m 567p 89s 445z', left: '345m 678p 19s 667z' }, ponds: { us: ['1p'], right: ['3m'], opposite: ['6p'], left: ['2s'] } }, captions: [
    cap(.2, 4.2, '**ปง**: มีคู่อยู่ในมือ แล้วใครทิ้งใบเดียวกัน ขอมาทำเป็นตองได้'),
    cap(4.2, 7, 'เคล็ดลับ: ปงมังกรได้ยากุ **ยากุไฮ** ทันที'),
    cap(7, 11.4, '**ชี**: ขอมาต่อเป็นชุดเรียง — ได้เฉพาะไพ่ที่ **คนทางซ้าย** ทิ้ง'),
    cap(11.4, 14.4, '**คัง**: ไพ่เหมือนกัน 4 ใบ นับเป็น 1 ชุด แล้วจั่วชดเชย 1 ใบ'),
    cap(14.4, 18, 'ขอไพ่แล้วมือจะ **เปิด** — ริอิจิไม่ได้ ต้องมียากุอื่นแทน'),
  ], tenpai: [{ tiles: parseTiles('34m 345s 99s'), fixed: parseTiles('777z 456p'), waits: ['2m', '5m'] }], reviewTimes: [3, 5.8, 9, 12.8, 16.2], events: [
    { type: 'seats', at: 0, dur: 4 },
    { type: 'turnOrder', at: .8, dur: 3.2 },
    { type: 'discard', at: .8, dur: .7, code: '7z', seat: 'opposite', to: { zone: 'pond', seat: 'opposite', index: 1 } },
    { type: 'chip', at: 1.8, dur: 2.2, text: 'ปง!', anchor: 'hand', kind: 'label' },
    { type: 'call', at: 2.2, dur: 1, code: '7z', seat: 'opposite', from: { zone: 'pond', seat: 'opposite', index: 1 }, to: { zone: 'meld', seat: 'us', meldIndex: 0, meldCount: 3 }, calledIndex: 1, codes: ['7z', '7z', '7z'] },
    { type: 'discard', at: 3.4, dur: .6, code: '1z', seat: 'us', to: { zone: 'pond', seat: 'us', index: 1 } },
    { type: 'highlight', at: 4.2, dur: 2.8, groups: ['777z'], dim: .45 },
    { type: 'discard', at: 7.6, dur: .7, code: '5p', seat: 'left', to: { zone: 'pond', seat: 'left', index: 1 } },
    { type: 'chip', at: 8.8, dur: 2.1, text: 'ชี!', anchor: 'hand', kind: 'label' },
    { type: 'call', at: 9.2, dur: 1, code: '5p', seat: 'left', from: { zone: 'pond', seat: 'left', index: 1 }, to: { zone: 'meld', seat: 'us', meldIndex: 1, meldCount: 3 }, calledIndex: 0, codes: ['5p', '4p', '6p'] },
    { type: 'discard', at: 10.4, dur: .6, code: '3z', seat: 'us', to: { zone: 'pond', seat: 'us', index: 2 } },
    { type: 'exhibit', at: 11.6, dur: 3, codes: ['8s', '8s', '8s', '8s'], pos: [0, 2.2, 0] },
    { type: 'stick', at: 14.8, dur: 2.8, visible: true },
    { type: 'cross', at: 14.8, dur: 2.8, anchor: 'stick' },
  ] },
  { id: 'win', duration: 13, camera: 'table', setup: { walls: true, hands: [hand('234m 567p 88p 345s 66s')], opponents: { right: '123m 456p 789s 123z', opposite: '234m 567p 89s 445z', left: '345m 678p 19s 667z' }, ponds: { us: ['9m'] } }, captions: [
    cap(.2, 4.6, 'ชนะได้ 2 แบบ — **สึโม**: จั่วได้ใบที่รอเอง อีก 3 คนจ่าย'),
    cap(4.6, 8.6, '**รง**: คนอื่นทิ้งใบที่เรารอ — คนทิ้งจ่ายคนเดียว'),
    cap(8.6, 13, 'ระวัง **ฟุริเท็น**: ถ้าใบที่รอมีอยู่ในกองทิ้งของเราเอง จะรงไม่ได้ (สึโมยังได้)'),
  ], reviewTimes: [2.5, 6.5, 10.5, 12.5], events: [
    { type: 'stick', at: 0, dur: 13, visible: true },
    { type: 'draw', at: 1, dur: .8, code: '8p', seat: 'us', from: { zone: 'wall', index: 3, layer: 1 }, to: { zone: 'hand', index: 13, count: 14 }, glow: true },
    { type: 'reveal', at: 1.8, dur: .8, seat: 'us' },
    { type: 'chip', at: 2, dur: 2.6, text: 'สึโม!', anchor: 'hand', kind: 'label' },
    { type: 'arrow', at: 2.8, dur: 1.2, from: ['right', 'opposite', 'left'], to: 'us' },
    { type: 'reset', at: 4.6, dur: .4, state: 'riichi' },
    { type: 'discard', at: 5.2, dur: .8, code: '6s', seat: 'opposite', to: { zone: 'pond', seat: 'opposite', index: 1 } },
    { type: 'chip', at: 5.4, dur: 2.8, text: 'รง!', anchor: 'hand', kind: 'label' },
    { type: 'arrow', at: 5.6, dur: 1.2, from: ['opposite'], to: 'us' },
    { type: 'reset', at: 8.6, dur: .4, state: 'furiten' },
    { type: 'discard', at: 8.8, dur: .7, code: '6s', seat: 'us', to: { zone: 'pond', seat: 'us', index: 1 } },
    { type: 'glow', at: 8.8, dur: 4, code: '6s', zone: 'pond', seat: 'us', color: 'red' },
    { type: 'discard', at: 9.8, dur: .8, code: '8p', seat: 'left', to: { zone: 'pond', seat: 'left', index: 1 } },
    { type: 'chip', at: 10, dur: 2.8, text: 'รง', anchor: 'hand', kind: 'label' },
    { type: 'cross', at: 10.4, dur: 2.4, anchor: 'hand' },
  ] },
  { id: 'dora', duration: 11, camera: 'wall', setup: { walls: true, hands: [] }, captions: [
    cap(.2, 4.2, '**โดระ** = ไพ่โบนัส: ดูไพ่ที่เปิดบนกำแพง ใบ **ถัดไป** คือโดระ'),
    cap(4.2, 8, 'เลข 9 วนกลับเป็น 1 · ลม: ตะวันออก → ใต้ → ตะวันตก → เหนือ · มังกร: ขาว → เขียว → แดง'),
    cap(8, 11, 'โดระช่วยเพิ่มแต้ม แต่ **ไม่ใช่ยากุ** — มีแค่โดระชนะไม่ได้'),
  ], reviewTimes: [2.5, 5.8, 9, 10.5], events: [
    { type: 'indicator', at: .2, dur: 4, code: '3p', pos: [-6.12, 1.925, 9.4] },
    { type: 'ghost', at: .8, dur: 3.4, examples: [{ code: '4p', pos: [-3.9, 2.3, 9.4], rot: [0, 0, 0] }] },
    { type: 'arrow', at: .8, dur: 3.4, from: ['dora-indicator'], to: ['ghost-4p'] },
    { type: 'chip', at: .8, dur: 3.4, text: 'โดระ', anchor: 'ghost-4p', kind: 'label' },
    { type: 'doraExamples', at: 4.2, dur: 3.8, pairs: [['9m', '1m'], ['4z', '1z'], ['7z', '5z']], pos: [0, 2.2, 8] },
    { type: 'bigword', at: 8, dur: 3, text: 'โดระ ≠ ยากุ' },
  ] },
  { id: 'recap', duration: 8, camera: 'recap', setup: { walls: true, hands: [] }, captions: [], reviewTimes: [4.5, 7.5], events: [
    { type: 'recap', at: 0, dur: 8, items: ['ครบ 4 ชุด + 1 คู่', 'ต้องมียากุอย่างน้อย 1 อย่าง', 'มือปิดเท็นไปแล้ว ประกาศริอิจิ', 'ปงมังกร = ได้ยากุทันที', 'ระวังฟุริเท็น'], cta: 'ไกด์เต็ม + คำศัพท์ → yakuzathai.com/mahjong/' },
  ] },
]

function captionReadingLength(text) {
  return [...text.replace(/\*\*/g, '')].filter((char) => !/\s/u.test(char) && !/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/u.test(char)).length
}

for (const scene of timeline) {
  const ordered = [...scene.captions].sort((a, b) => a.at - b.at)
  for (const caption of ordered) {
    const min = 1.2 + 0.075 * captionReadingLength(caption.text) + 0.3
    const extra = Math.max(0, min - (caption.end - caption.at))
    if (extra) {
      const oldEnd = caption.end
      caption.end += extra
      for (const later of ordered) {
        if (later !== caption && later.at >= oldEnd) {
          later.at += extra
          later.end += extra
        }
      }
      for (const event of scene.events) if (event.at >= oldEnd) event.at += extra
      scene.reviewTimes = scene.reviewTimes.map((time) => time >= oldEnd ? time + extra : time)
      scene.duration += extra
    }
  }
}

export function sceneOffsets() {
  let offset = 0
  return timeline.map((scene) => {
    const row = { scene, start: offset, end: offset + scene.duration }
    offset = row.end
    return row
  })
}

const offsets = sceneOffsets()
export const timelineInfo = {
  duration: offsets.at(-1).end,
  fps: 30,
  posterTime: 2.5,
  reviewTimes: offsets.flatMap(({ scene, start }) => scene.reviewTimes.map((t) => start + t)).sort((a, b) => a - b),
}

export function sceneAt(time) {
  const t = Math.max(0, Math.min(timelineInfo.duration, time))
  return offsets.find(({ start, end }) => t >= start && t < end) ?? offsets.at(-1)
}
