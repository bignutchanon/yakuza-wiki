#!/usr/bin/env python3
"""ตรวจไฟล์เควสเสริม (src/data/substories/*.json) และผลลัพธ์ที่ build ออกมา

ตรวจสามชั้น:
  1. โครงข้อมูล — ฟิลด์ครบ ชนิดถูก ไม่มีชื่อว่าง ไม่มีเลขซ้ำในกลุ่มเดียวกัน
  2. เทียบกับตาราง markdown เดิมใน git (ค่าเริ่มต้น: 7b70e55 ก่อนย้ายมาเป็น JSON)
     ทุกเควสในตารางเดิมต้องยังอยู่ครบ ค่าทุกช่องต้องตรงกัน
  3. เทียบกับ HTML ที่ build แล้วใน out/ (ถ้ามี) — ชื่อเควสทุกอันต้องโผล่ในหน้าจริง
     และบล็อก "เควสเสริมที่เปิดในบทนี้" ในหน้าบทต้องมีจำนวนเท่าที่คำนวณจาก unlock

ใช้:  python -X utf8 scripts/check-substories.py [--base <git-ref>] [--skip-html]
คืน exit code 1 ถ้าเจอปัญหา
"""
import argparse
import html
import json
import re
import subprocess
import sys
from pathlib import Path

DATA = Path('src/data/substories')
OUT = Path('out')
FIELDS = {'n': str, 'name': str, 'sub': str, 'place': str, 'unlock': str, 'summary': str, 'group': str}
SEPARATOR = re.compile(r'^\|[\s\-:|]+\|$')
CHAPTER = re.compile(r'บทที่\s*(\d+)')

problems: list[str] = []


def fail(msg: str) -> None:
    problems.append(msg)


def strip_markdown(text: str) -> str:
    """ตารางเดิมเป็น markdown ส่วน JSON เก็บข้อความล้วน — ตัดสัญลักษณ์ก่อนเทียบ"""
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'\1', text)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    text = re.sub(r'<br\s*/?>', ' ', text)
    return re.sub(r'\s{2,}', ' ', text).strip()


def load_json_data() -> dict[str, list[dict]]:
    return {p.stem: json.loads(p.read_text(encoding='utf-8'))['quests'] for p in sorted(DATA.glob('*.json'))}


def check_shape(game: str, quests: list[dict]) -> None:
    seen: set[tuple[str, str]] = set()
    for i, q in enumerate(quests):
        for field, kind in FIELDS.items():
            if not isinstance(q.get(field), kind):
                fail(f'{game}[{i}]: ฟิลด์ {field} หายหรือผิดชนิด')
        if not isinstance(q.get('steps'), list):
            fail(f'{game}[{i}]: steps ต้องเป็น list')
        if not q.get('name', '').strip():
            fail(f'{game}[{i}]: ชื่อเควสว่าง')
        key = (q.get('group', ''), q.get('n', ''))
        if key in seen:
            fail(f'{game}: เลข {q.get("n")} ซ้ำในกลุ่ม "{q.get("group")}"')
        seen.add(key)


def old_tables(ref: str) -> dict[str, list[dict]]:
    """อ่านตาราง markdown เดิมจาก git ref ที่ระบุ"""
    files = subprocess.run(
        ['git', 'ls-tree', '-r', '--name-only', ref, 'src/content/'],
        capture_output=True, text=True, check=True,
    ).stdout.split('\n')

    out: dict[str, list[dict]] = {}
    for path in files:
        if not path.endswith('/substories.md'):
            continue
        game = path.split('/')[-2]
        text = subprocess.run(['git', 'show', f'{ref}:{path}'], capture_output=True, text=True, check=True).stdout
        rows = []
        heading = ''
        for line in text.split('\n'):
            line = line.strip()
            if line.startswith('## '):
                heading = re.sub(r'\s*\(\s*\d+\s*เควส\s*\)\s*$', '', line[3:]).strip()
                continue
            if not line.startswith('|') or SEPARATOR.match(line):
                continue
            cells = [strip_markdown(c) for c in line.strip('|').split('|')]
            if len(cells) < 5 or not re.match(r'^[0-9]', cells[0]):
                continue
            rows.append(
                {
                    'n': cells[0],
                    'name': cells[1],
                    'place': cells[2],
                    'unlock': '' if cells[3] == '-' else cells[3],
                    'summary': '' if cells[4] == '-' else cells[4],
                    'group': heading,
                }
            )
        if rows:
            out[game] = rows
    return out


def english_name(text: str) -> str:
    """ดึงชื่ออังกฤษออกจากรูปแบบ "ชื่อไทย (English Name)" ที่ตารางเดิมของ y3r ใช้"""
    m = re.search(r'\(([^()]+)\)\s*$', text)
    return (m.group(1) if m else text).strip()


def check_y3r_against_old(quests: list[dict], rows: list[dict]) -> None:
    """y3r ถูกสร้างใหม่จากไฟล์เกม (เลขและรูปแบบชื่อจึงต่างจากตารางเดิมโดยตั้งใจ)
    ตรวจแค่ว่าเควสครบชุดเดิมไม่ขาดไม่เกิน โดยเทียบด้วยชื่ออังกฤษ
    """
    old_names = {english_name(r['name']) for r in rows}
    new_names = {(q['sub'] or q['name']).strip() for q in quests}
    for name in sorted(old_names - new_names):
        fail(f'y3r: เควส "{name}" หายไปจากรายการใหม่')
    for name in sorted(new_names - old_names):
        fail(f'y3r: เควส "{name}" โผล่มาใหม่ ไม่มีในรายการเดิม')


def check_against_old(game: str, quests: list[dict], rows: list[dict]) -> None:
    if len(quests) != len(rows):
        fail(f'{game}: จำนวนเควสไม่เท่าเดิม (เดิม {len(rows)} · ตอนนี้ {len(quests)})')
    for old, new in zip(rows, quests):
        for field in ('n', 'name', 'place', 'unlock', 'summary', 'group'):
            if old[field] != new.get(field):
                fail(
                    f'{game} เควส {old["n"]} "{old["name"]}": ช่อง {field} เปลี่ยนไป\n'
                    f'    เดิม: {old[field]!r}\n    ตอนนี้: {new.get(field)!r}'
                )


def page_text(path: Path) -> str:
    raw = path.read_text(encoding='utf-8')
    raw = re.sub(r'<script[\s\S]*?</script>', ' ', raw)
    return html.unescape(re.sub(r'<[^>]+>', ' ', raw))


def check_html(game: str, quests: list[dict]) -> None:
    page = OUT / 'game' / game / 'substories' / 'index.html'
    if not page.exists():
        fail(f'{game}: ไม่มีหน้า {page} ใน out/ (build ก่อนตรวจ)')
        return
    text = page_text(page)
    missing = [q['name'] for q in quests if q['name'] not in text]
    if missing:
        fail(f'{game}: ชื่อเควสไม่โผล่ในหน้าที่ build แล้ว {len(missing)} รายการ เช่น {missing[:3]}')

    raw = page.read_text(encoding='utf-8')
    body = raw.split('self.__next_f')[0]  # HTML จริง ไม่รวม payload ของ React

    cards = body.count('class="sub-card"')
    if cards != len(quests):
        fail(f'{game}: การ์ดในหน้า {cards} ใบ ควรเป็น {len(quests)}')

    # ปุ่มกรองต้องตรงกับค่าที่การ์ดถืออยู่ ไม่งั้นกดแล้วไม่เจออะไรเลย
    facet_values = re.findall(r'data-facet="([^"]*)"', body)
    chips = re.findall(r'<button type="button" class="sub-chip[^"]*"[^>]*>([^<]*)<', body)
    chip_labels = {c.strip() for c in chips if c.strip() and c.strip() != 'ทั้งหมด'}
    orphans = {v for v in facet_values if v} - chip_labels
    if chip_labels and orphans:
        fail(f'{game}: การ์ดมีค่ากรอง {sorted(orphans)[:3]} ที่ไม่มีปุ่มให้กด')
    if len(facet_values) != len(quests):
        fail(f'{game}: การ์ดที่มี data-facet {len(facet_values)} ใบ ควรเป็น {len(quests)}')

    # หน้าบท: บล็อก "เควสเสริมที่เปิดในบทนี้" ต้องมีทุกบทที่มีเควสผูกอยู่
    per_chapter: dict[int, int] = {}
    for q in quests:
        for n in {int(m) for m in CHAPTER.findall(q['unlock'])}:
            per_chapter[n] = per_chapter.get(n, 0) + 1
    for chapter, count in sorted(per_chapter.items()):
        ch_page = OUT / 'game' / game / 'ch' / str(chapter) / 'index.html'
        if not ch_page.exists():
            continue  # เควสอ้างถึงบทที่เว็บยังไม่มีหน้าสรุป
        ch_body = ch_page.read_text(encoding='utf-8').split('self.__next_f')[0]
        shown = ch_body.count('ch-side-name')
        if shown != count:
            fail(f'{game} บทที่ {chapter}: บล็อกเควสเสริมโชว์ {shown} รายการ ควรเป็น {count}')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='7b70e55', help='git ref ที่มีตาราง markdown เดิมไว้เทียบ')
    ap.add_argument('--skip-html', action='store_true', help='ไม่ต้องตรวจไฟล์ใน out/')
    args = ap.parse_args()

    data = load_json_data()
    print(f'ไฟล์ JSON {len(data)} ภาค · {sum(len(v) for v in data.values())} เควส')

    for game, quests in data.items():
        check_shape(game, quests)

    old = old_tables(args.base)
    for game, rows in old.items():
        if game == 'y3':
            continue  # หน้า Kiwami 3 ตั้งใจถอดรายการของรีมาสเตอร์ออก (ดู CLAUDE.md)
        if game not in data:
            fail(f'{game}: ตารางเดิมมี {len(rows)} เควส แต่ตอนนี้ไม่มีไฟล์ JSON')
        elif game == 'y3r':
            check_y3r_against_old(data[game], rows)
        else:
            check_against_old(game, data[game], rows)

    if not args.skip_html:
        for game, quests in data.items():
            check_html(game, quests)

    if problems:
        print(f'\nพบปัญหา {len(problems)} จุด:')
        for p in problems:
            print(f'  - {p}')
        sys.exit(1)
    print('ผ่านทุกด่าน')


if __name__ == '__main__':
    main()
