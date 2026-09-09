#!/usr/bin/env python3
"""สร้าง src/data/substories/y3r.json จากไฟล์ของ Yakuza 3 Remastered โดยตรง

แหล่งข้อมูล (มาจากโปรเจกต์ม็อดแปลไทย D:\\Projects\\y3-remastered):
  extracted/boot_en/boot_en/substory.bin   ตารางเควสเสริมของตัวเกม (ชื่อ / ทำเล / ข้อความความคืบหน้า)
  translations/master_th.json              คำแปลไทยที่ม็อดใช้จริง (คีย์ = ข้อความอังกฤษต้นฉบับ)

โครงไฟล์ .bin ฟอร์แมต 20-07-03-19 (เอนจิ้นเก่า ใช้ร่วมกับ Y4/Y5):
  ส่วนหัว 16 ไบต์ (magic, จำนวนคอลัมน์, จำนวนแถว) + นิยามคอลัมน์ละ 64 ไบต์
  (ชื่อ 48 ไบต์, ชนิด, จำนวนสมาชิก, ขนาดบล็อกข้อมูล) แล้วตามด้วยบล็อกข้อมูลของแต่ละคอลัมน์เรียงกัน
  - ชนิด 1 = พูลสตริงก่อน แล้วต่อท้ายด้วยดัชนี 1 ไบต์ต่อแถว (TITLE, PLACE)
  - ชนิด 0 = สตริงลงท้ายด้วย null เรียงตามลำดับแถวตรง ๆ (EXPLANATION)

หนึ่งแถวคือหนึ่ง "ขั้นความคืบหน้า" ของเควส แถวที่มี TITLE คือแถวเปิดเควสใหม่
แถวที่ TITLE ว่างคือขั้นถัดไปของเควสก่อนหน้า ช่อง "[Removed]" คือเควสที่ถูกถอดออกจากเกม

ใช้:  python -X utf8 scripts/extract-substories-y3r.py [--mod-dir D:/Projects/y3-remastered]
"""
import argparse
import json
import re
import struct
from pathlib import Path

PLACE_TH = {'Okinawa': 'โอกินาว่า', 'Kamurocho': 'คามุโรโจ', '神室町': 'คามุโรโจ'}
REMOVED = '[Removed]'


def read_columns(data: bytes):
    """คืน {ชื่อคอลัมน์: (ชนิด, จำนวนสมาชิก, ขนาด, ออฟเซ็ตข้อมูล)} + จำนวนแถว"""
    col_count, row_count = struct.unpack_from('>II', data, 4)
    cols = {}
    offset = 16 + col_count * 64
    for i in range(col_count):
        base = 16 + i * 64
        name = next(p for p in data[base:base + 48].split(b'\x00') if p).decode()
        col_type, count, size = struct.unpack_from('>III', data, base + 48)
        cols[name] = (col_type, count, size, offset)
        offset += size
    return cols, row_count


def read_indexed_column(data: bytes, col, row_count: int):
    """คอลัมน์ชนิด 1 → (ดัชนีต่อแถว, พูลสตริง)"""
    _, _, size, offset = col
    blob = data[offset:offset + size]
    pool_end = size - row_count
    pool, i = [], 0
    while i < pool_end:
        j = blob.index(b'\x00', i)
        pool.append(blob[i:j].decode('utf-8', 'replace'))
        i = j + 1
    return list(blob[pool_end:]), pool


def read_text_column(data: bytes, col, row_count: int):
    """คอลัมน์ชนิด 0 → ข้อความของแต่ละแถวตามลำดับ"""
    _, _, size, offset = col
    parts = data[offset:offset + size].split(b'\x00')
    return [p.decode('utf-8', 'replace') for p in parts[:row_count]]


THAI = re.compile(r'[฀-๿]')


def join_lines(text: str) -> str:
    """รวมบรรทัดที่เกมขึ้นบรรทัดใหม่เพื่อจัดกล่องข้อความให้เป็นบรรทัดเดียว

    รอยขึ้นบรรทัดในไฟล์เกมมาจากการจัดกล่องข้อความ ไม่ใช่การเว้นวรรคของภาษา
    ภาษาไทยไม่เว้นวรรคระหว่างคำ ถ้าสองฝั่งรอยต่อเป็นอักษรไทยทั้งคู่จึงต่อกันตรง ๆ
    (ไม่งั้นจะได้ช่องว่างผ่ากลางคำ เช่น "ไม่รู้ว่าเธอจะ ยอมรับ")
    ส่วนช่องว่างที่ผู้แปลเว้นไว้กลางบรรทัดยังอยู่ครบตามเดิม
    """
    text = text.replace('\r\n', '\n')
    out = []
    for i, part in enumerate(text.split('\n')):
        if i == 0:
            out.append(part)
            continue
        left, right = out[-1].rstrip(), part.lstrip()
        thai_join = bool(left and right and THAI.search(left[-1]) and THAI.search(right[:1]))
        glue = '' if thai_join else ' '
        out[-1] = left
        out.append(glue + right)
    return ''.join(out)


def tidy(text: str) -> str:
    """รวมเป็นบรรทัดเดียว ตัดแท็กจัดรูปแบบของเกมทิ้ง"""
    text = re.sub(r'<[^>]+>', '', join_lines(text))
    return re.sub(r'[ \t]+', ' ', text).strip()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--mod-dir', default='D:/Projects/y3-remastered')
    ap.add_argument('--out', default='src/data/substories/y3r.json')
    args = ap.parse_args()

    mod = Path(args.mod_dir)
    data = (mod / 'extracted/boot_en/boot_en/substory.bin').read_bytes()
    thai = json.loads((mod / 'translations/master_th.json').read_text(encoding='utf-8'))

    def translate(text: str) -> str:
        return thai.get(text) or thai.get(text.replace('\r\n', '\n')) or ''

    cols, row_count = read_columns(data)
    title_idx, title_pool = read_indexed_column(data, cols['TITLE'], row_count)
    place_idx, place_pool = read_indexed_column(data, cols['PLACE'], row_count)
    explanations = read_text_column(data, cols['EXPLANATION'], row_count)

    quests, current = [], None
    for row in range(row_count):
        title = title_pool[title_idx[row]]
        if title:
            place = place_pool[place_idx[row]]
            th = thai.get(title, '')
            current = {
                'n': 0,
                # ชื่อที่โชว์บนการ์ด: ใช้ไทยถ้าม็อดแปลชื่อนั้น ไม่งั้นใช้อังกฤษ (เช่น Amon)
                'name': th or title,
                'sub': title if th else '',
                'place': PLACE_TH.get(place, place),
                # ไฟล์เควสของเกมไม่ได้เก็บว่าเปิดในบทไหน จึงยังไม่มีข้อมูลปลดล็อก
                'unlock': '',
                'summary': '',
                'steps': [],
                'group': '',
            }
            quests.append(current)
        step = explanations[row].strip()
        if current is not None and step:
            current['steps'].append(tidy(translate(step) or step))

    quests = [q for q in quests if q['sub'] != REMOVED and q['name'] != REMOVED]
    for i, quest in enumerate(quests, 1):
        quest['n'] = str(i)
        # ขั้นแรกคือคำโปรยของเควส ที่เหลือเก็บไว้ในบล็อกพับของการ์ด
        if quest['steps']:
            quest['summary'] = quest['steps'][0]
            quest['steps'] = quest['steps'][1:]

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        json.dumps(
            {
                'game': 'y3r',
                'source': 'ตารางเควสเสริมในไฟล์เกม (substory.bin) + คำแปลไทยของม็อด',
                'quests': quests,
            },
            ensure_ascii=False,
            indent=1,
        )
        + '\n',
        encoding='utf-8',
    )
    steps = sum(len(q['steps']) + 1 for q in quests)
    missing_th = [q['name'] for q in quests if not q['sub']]
    print(f'{out}: {len(quests)} เควส · {steps} ขั้นตอน · ไม่มีชื่อไทย {len(missing_th)} ({", ".join(missing_th) or "-"})')


if __name__ == '__main__':
    main()
