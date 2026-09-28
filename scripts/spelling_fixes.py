"""ตัวสะกดชื่อเฉพาะที่รวมให้เป็นแบบเดียวทั้งเว็บ (28 ก.ย. 2026)

ก่อนหน้านี้แต่ละภาคสะกดชื่อเดียวกันต่างกัน (เช่น มาจิมะ/มาจิม่า) เพราะเขียนคนละรอบ คนละแหล่ง
ตัวที่เลือกยึด glossary ของโปรเจกต์ม็อดแปล (ข้อความที่ผู้เล่นเห็นในเกม) ถ้า glossary ขัดกันเองให้ยึดตัวที่เว็บใช้มากกว่า

ใช้สองที่: สคริปต์นี้รันตรง ๆ = แก้ไฟล์ใน src/ · `check-substories.py` import `FIXES`
ไปแปลงตารางเควสเดิมใน git ก่อนเทียบ (ไม่งั้นเควสที่มีชื่อพวกนี้จะถูกนับว่าข้อความเปลี่ยน)

python -X utf8 scripts/spelling_fixes.py [ไฟล์ที่ต้องข้าม ...]
"""
import sys
from pathlib import Path

# ลำดับสำคัญ: แบบยาวก่อนแบบสั้น
FIXES: list[tuple[str, str]] = [
    ('ไทกะ ไซจิม่า', 'ไทกะ ซาเอะจิมะ'),  # Taiga Saejima — คำล็อกใน CLAUDE.md
    ('ไทกะ ไซจิมะ', 'ไทกะ ซาเอะจิมะ'),
    ('ไซจิม่า', 'ซาเอะจิมะ'),
    ('ไซจิมะ', 'ซาเอะจิมะ'),
    ('คาสึกะ', 'คาซึกะ'),  # Kasuga — คำล็อก + glossary Y7
    ('มาจิมะ', 'มาจิม่า'),  # Majima — glossary ม็อดใช้ มาจิม่า เกือบทั้งหมด
    ('โดจิมะ', 'โดจิม่า'),  # Dojima — คำล็อก "ไดโกะ โดจิม่า"
    ('คาชิวากิ', 'คาชิวางิ'),  # Kashiwagi — glossary Y3 + ทั้งเว็บ (มีแค่ glossary K2 ที่ใช้ -กิ)
    ('คนขายดอกไม้แห่งไซ', 'ฟลอริสต์แห่งไซ'),  # Florist of Sai — glossary Y3/K2
    ('เดอะฟลอริสต์', 'ฟลอริสต์'),
    ('มาโคโตะ ดาเตะ', 'มาโกโตะ ดาเตะ'),  # Makoto Date — glossary Y3/K2 (มาโคโตะ มาคิมูระ ของ Y0 คนละคน ไม่แตะ)
]


def fix(text: str) -> str:
    for old, new in FIXES:
        text = text.replace(old, new)
    return text


def main() -> None:
    skip = {Path(p).resolve() for p in sys.argv[1:]}
    root = Path(__file__).resolve().parent.parent / 'src'
    files = [*root.glob('content/**/*.md'), root / 'data' / 'games.ts', *root.glob('data/substories/*.json')]
    changed = 0
    for f in files:
        if f.resolve() in skip:
            continue
        text = f.read_text(encoding='utf-8')
        new = fix(text)
        if new != text:
            f.write_text(new, encoding='utf-8', newline='')
            changed += 1
            print(f.relative_to(root))
    print(f'แก้ {changed} ไฟล์')


if __name__ == '__main__':
    main()
