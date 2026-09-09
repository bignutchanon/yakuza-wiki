#!/usr/bin/env python3
"""ย้ายตารางเควสเสริมใน src/content/<gameId>/substories.md ไปเป็น src/data/substories/<gameId>.json

ทำสองอย่างพร้อมกัน:
  1. อ่านตารางทุกตารางในไฟล์ (คอลัมน์ # / ชื่อ / สถานที่ / ปลดล็อก / สรุป) ออกมาเป็น JSON
     หัวข้อ "## ..." ที่อยู่เหนือตารางกลายเป็นชื่อกลุ่มของเควสในตารางนั้น (เช่น สายของคิริว, ชุน อากิยามะ)
  2. เขียน substories.md ใหม่ให้เหลือแต่คำนำและหัวข้อที่เป็นคำอธิบายล้วน (เช่น "เควสเด็ดห้ามพลาด")
     เพราะตัวรายการจะถูก render เป็นการ์ดจาก JSON แทน

ใช้:  python -X utf8 scripts/substories-md-to-json.py [gameId ...]   (ไม่ใส่ = ทุกภาคที่มีตาราง)
"""
import json
import re
import sys
from pathlib import Path

CONTENT = Path('src/content')
DATA = Path('src/data/substories')
SEPARATOR = re.compile(r'^\|[\s\-:|]+\|$')


def strip_markdown(text: str) -> str:
    """ตัดสัญลักษณ์ markdown ในช่องตารางออก เพราะการ์ดแสดงข้อความล้วน ไม่ได้ผ่านตัว render markdown"""
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'', text)       # ลิงก์ -> เหลือข้อความ
    text = re.sub(r'\*\*([^*]+)\*\*', r'', text)              # ตัวหนา
    text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'', text)     # ตัวเอียง
    text = re.sub(r'`([^`]+)`', r'', text)
    text = re.sub(r'<br\s*/?>', ' ', text)
    return re.sub(r'\s{2,}', ' ', text).strip()


def split_row(line: str) -> list[str]:
    return [strip_markdown(c) for c in line.strip().strip('|').split('|')]


def convert(game_id: str) -> tuple[int, int] | None:
    path = CONTENT / game_id / 'substories.md'
    text = path.read_text(encoding='utf-8')
    lines = text.split('\n')

    quests: list[dict] = []
    kept: list[str] = []  # บรรทัดที่จะเหลือไว้ใน markdown
    heading = ''  # หัวข้อ ## ล่าสุด
    in_table = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith('## '):
            # ชื่อกลุ่มไม่ต้องมี "(N เควส)" ต่อท้าย เพราะปุ่มกรองโชว์จำนวนให้อยู่แล้ว
            heading = re.sub(r'\s*\(\s*\d+\s*เควส\s*\)\s*$', '', stripped[3:]).strip()
            kept.append(line)
            in_table = False
            continue

        if stripped.startswith('|'):
            cells = split_row(stripped)
            if SEPARATOR.match(stripped) or not re.match(r'^[0-9]', cells[0]):
                in_table = True  # หัวตาราง/เส้นคั่น — ทิ้งไปพร้อมตาราง
                continue
            if len(cells) >= 5:
                no, name, place, unlock, summary = cells[:5]
                quests.append(
                    {
                        'n': no,
                        'name': name,
                        'sub': '',
                        'place': place,
                        'unlock': unlock if unlock != '-' else '',
                        'summary': summary if summary != '-' else '',
                        'steps': [],
                        'group': heading,
                    }
                )
                in_table = True
                continue

        # บรรทัดว่างที่ตามหลังตารางทันที ตัดทิ้งไปด้วยเพื่อไม่ให้เหลือช่องว่างซ้อน
        if in_table and not stripped:
            continue
        in_table = False
        kept.append(line)

    if not quests:
        return None

    # หัวข้อที่เหลือแต่ชื่อ (ตารางถูกย้ายออกไปหมด) ให้ตัดทิ้ง
    cleaned: list[str] = []
    for i, line in enumerate(kept):
        if line.strip().startswith('## '):
            rest = [x for x in kept[i + 1 :] if x.strip()]
            if not rest or rest[0].strip().startswith('## '):
                continue
        cleaned.append(line)

    body = re.sub(r'\n{3,}', '\n\n', '\n'.join(cleaned)).strip() + '\n'
    path.write_text(body, encoding='utf-8')

    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / f'{game_id}.json').write_text(
        json.dumps(
            {
                'game': game_id,
                'source': 'ตารางเดิมในไกด์ของเว็บ (แปลงเป็น JSON เมื่อเปลี่ยนหน้าเป็นการ์ด)',
                'quests': quests,
            },
            ensure_ascii=False,
            indent=1,
        )
        + '\n',
        encoding='utf-8',
    )
    groups = len({q['group'] for q in quests if q['group']})
    return len(quests), groups


def main() -> None:
    ids = sys.argv[1:] or sorted(p.parent.name for p in CONTENT.glob('*/substories.md'))
    for game_id in ids:
        result = convert(game_id)
        if result is None:
            print(f'{game_id}: ไม่มีตารางให้แปลง ข้ามไป')
        else:
            print(f'{game_id}: {result[0]} เควส · {result[1]} กลุ่ม')


if __name__ == '__main__':
    main()
