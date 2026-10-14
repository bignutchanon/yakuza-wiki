# สร้าง asset ฉาก 3D หน้าแรก ("เดินในคามุโรโจ") จากภาพในเกม — รันครั้งเดียวตอนเพิ่ม/เปลี่ยนฉาก ไม่ได้รันตอน build
#
# ต่อฉากได้ 2-3 ไฟล์ใน public/hero/tour/:
#   <id>-maps.png  RGB 1024 px (ไม่ใช้ alpha — เบราว์เซอร์อาจ premultiply ทำค่าใน RGB หายตอนอัปเป็น texture)
#                  R = ความลึกชั้นหลัง (เติมส่วนที่ชั้นหน้าบังไว้แล้ว) · G = ความลึกชั้นหน้า (ขยายออกนอกขอบกันขอบยืด)
#                  B = 0.5·รู + 0.5·ชั้นหน้า: ถอดใน shader ด้วย fgAlpha = clamp(B*2-1) · hole = clamp(B*2)
#                  (รู = ชั้นหน้าที่ขยายขอบ = ส่วนที่ชั้นหลังต้องใช้สีจาก fill) · ความลึกเป็น disparity สัมพัทธ์ ขาว = ใกล้
#   <id>-fill.webp ภาพเล็กที่เติมสีส่วนที่ถูกชั้นหน้าบัง (โผล่ให้เห็นเมื่อกล้องขยับ)
#   <id>.webp      ภาพสีเต็ม (เฉพาะฉากที่ยังไม่มีไฟล์ใน public/hero/)
#
# ต้องมี: pip install onnxruntime numpy pillow + โมเดล Depth Anything V2 Small (ONNX)
#   https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx
# ใช้: python scripts/hero-depth.py <model.onnx> <src_dir>
#   <src_dir> = โฟลเดอร์ที่มีภาพต้นฉบับของฉากใหม่ (ดูชื่อไฟล์ใน SCENES)
import os
import sys

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'hero', 'tour')

# id, ภาพต้นฉบับ (path เทียบ repo หรือชื่อไฟล์ใน <src_dir>), ต้องแปลงเป็น webp ไหม, เกณฑ์ความลึกที่ถือเป็นชั้นหน้า (0-1)
SCENES = [
    ('k3-gate', 'public/hero/kamurocho-gate.jpg', False, 0.62),
    ('y5-gate', 'public/hero/kamurocho-gate-y5.jpg', False, 0.72),
    ('y3r-arch', 'y3r-2.jpg', True, 0.65),
    ('y5-street', 'y5-7.jpg', True, 0.70),
]

MEAN = np.array([0.485, 0.456, 0.406], np.float32)
STD = np.array([0.229, 0.224, 0.225], np.float32)
MAP_W = 1024


def infer_depth(sess, im):
    """disparity สัมพัทธ์ 0-1 (ขาว = ใกล้) ที่ความกว้าง MAP_W"""
    w0, h0 = im.size
    h = 14 * 55  # 770 — ละเอียดกว่าค่าเริ่มต้น 518 ของโมเดล ขอบวัตถุคมขึ้น
    w = 14 * round(h * w0 / h0 / 14)
    x = (np.asarray(im.resize((w, h), Image.BICUBIC), np.float32) / 255 - MEAN) / STD
    d = sess.run(None, {sess.get_inputs()[0].name: x.transpose(2, 0, 1)[None]})[0][0]
    lo, hi = np.percentile(d, 0.5), np.percentile(d, 99.5)
    d = np.clip((d - lo) / (hi - lo), 0, 1)
    size = (MAP_W, round(MAP_W * h0 / w0))
    return np.asarray(Image.fromarray(d.astype(np.float32), 'F').resize(size, Image.BICUBIC))


def resize(a, shape):
    """ขยาย/ย่ออาร์เรย์ float (H, W, C) แบบ bilinear"""
    return np.stack([np.asarray(Image.fromarray(a[..., c], 'F').resize((shape[1], shape[0]), Image.BILINEAR))
                     for c in range(a.shape[2])], -1)


def push_pull(values, known):
    """เติมค่าในช่องที่ไม่รู้ค่า (known=False) จากเพื่อนบ้าน — ย่อลงทีละครึ่งแล้วขยายกลับแบบ bilinear (pull-push)"""
    vals = (values if values.ndim == 3 else values[..., None]).astype(np.float32)
    v, w = vals * known[..., None], known.astype(np.float32)
    levels = []
    while min(w.shape) > 4:
        levels.append((v, w))
        h2, w2 = (w.shape[0] + 1) // 2, (w.shape[1] + 1) // 2
        v = np.pad(v, ((0, h2 * 2 - v.shape[0]), (0, w2 * 2 - v.shape[1]), (0, 0)))
        w = np.pad(w, ((0, h2 * 2 - w.shape[0]), (0, w2 * 2 - w.shape[1])))
        v, w = v.reshape(h2, 2, w2, 2, -1).sum((1, 3)), w.reshape(h2, 2, w2, 2).sum((1, 3))
    filled = v / np.maximum(w, 1e-6)[..., None]
    for v_l, w_l in reversed(levels):
        a = np.clip(w_l, 0, 1)[..., None]
        filled = v_l / np.maximum(w_l, 1e-6)[..., None] * a + resize(filled, w_l.shape) * (1 - a)
    return filled if values.ndim == 3 else filled[..., 0]


def grey_dilate(a, radius):
    """ค่ามากสุดในวง 3x3 ซ้ำ radius รอบ (PIL ทำ rank filter กับภาพ float ไม่ได้)"""
    for _ in range(radius):
        p = np.pad(a, 1, mode='edge')
        a = np.max([p[y:y + a.shape[0], x:x + a.shape[1]] for y in range(3) for x in range(3)], axis=0)
    return a


def blur(a, sigma):
    """gaussian blur แยกแกนด้วย numpy (PIL GaussianBlur ไม่รับภาพ float)"""
    r = int(sigma * 3)
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    p = np.pad(a, r, mode='edge')
    p = np.apply_along_axis(lambda v: np.convolve(v, k, mode='valid'), 1, p)
    return np.apply_along_axis(lambda v: np.convolve(v, k, mode='valid'), 0, p)


def build(sess, scene_id, src_path, to_webp, threshold):
    im = Image.open(src_path).convert('RGB')
    d = infer_depth(sess, im)
    h, w = d.shape

    # มาสก์ชั้นหน้า: ใกล้กว่าเกณฑ์ หดขอบ 1 px กันขอบฟ้าติดไปกับวัตถุ แล้วทำขอบนุ่ม
    fg = Image.fromarray(((d > threshold) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))
    fg_soft = np.asarray(fg.filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255
    # พื้นที่ที่ต้องเติมของชั้นหลัง = ชั้นหน้าขยายออกอีกนิด (ครอบขอบที่ปนกัน)
    hole = np.asarray(fg.filter(ImageFilter.MaxFilter(9)), np.float32) / 255 > 0.5

    bg_depth = push_pull(d, ~hole)
    # ชั้นหลังห้ามอยู่ใกล้กว่าความลึกเดิม (กันชั้นหลังทะลุออกหน้าชั้นหน้า) และเกลี่ยรอยเติมให้เนียน
    bg_depth = np.minimum(bg_depth, d)
    bg_depth = blur(bg_depth, 2)
    fg_depth = np.where(fg_soft > 0.01, d, 0)
    fg_depth = np.maximum(fg_depth, grey_dilate(fg_depth, 6))  # ขยายความลึกชั้นหน้าออกนอกขอบ สามเหลี่ยมตรงขอบจะไม่ยืด

    hole_soft = blur(hole.astype(np.float32), 1.5)
    maps = np.stack([bg_depth, fg_depth, 0.5 * hole_soft + 0.5 * fg_soft], -1)
    os.makedirs(OUT, exist_ok=True)
    Image.fromarray((np.clip(maps, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGB').save(
        os.path.join(OUT, f'{scene_id}-maps.png'), optimize=True)

    # สีที่เติม: เฉพาะส่วนที่ชั้นหน้าบัง ใช้ความละเอียดต่ำพอ (เห็นแค่ตอนกล้องขยับ)
    small = im.resize((w, h), Image.BICUBIC)
    col = np.asarray(small, np.float32) / 255
    filled = push_pull(col, ~hole)
    Image.fromarray((np.clip(filled, 0, 1) * 255 + 0.5).astype(np.uint8)).resize((640, round(640 * h / w)), Image.BICUBIC).save(
        os.path.join(OUT, f'{scene_id}-fill.webp'), quality=72)

    if to_webp:
        im.save(os.path.join(OUT, f'{scene_id}.webp'), quality=80, method=6)
    print(f'{scene_id}: {im.size} maps {w}x{h} fg {fg_soft.mean():.1%} hole {hole.mean():.1%}')


def main():
    model, src_dir = sys.argv[1], sys.argv[2]
    sess = ort.InferenceSession(model, providers=['CPUExecutionProvider'])
    for scene_id, src, to_webp, threshold in SCENES:
        path = os.path.join(ROOT, src) if src.startswith('public/') else os.path.join(src_dir, src)
        build(sess, scene_id, path, to_webp, threshold)


if __name__ == '__main__':
    main()
