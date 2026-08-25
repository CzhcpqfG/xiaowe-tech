"""把招商手册 PDF P11-P14 每页按 2×2 网格分割成 4 个模块, 保存到 public/images/prototype/招商手册_split/。

页面尺寸: 8520 × 5320 (横向, 16:10)
默认 2×2 等分: 每模块 4260 × 2660
P13 顶部略高: 水平分割线从 50% 下移到 52% (顶部 2766, 底部 2554)
"""
from pathlib import Path
from PIL import Image

SRC_DIR = Path(r"d:\VibeTest\bigsound\aigpic\pdf_preview")
OUT_DIR = Path(r"d:\VibeTest\bigsound\public\images\prototype\招商手册_split")
OUT_DIR.mkdir(parents=True, exist_ok=True)

PAGES = [11, 12, 13, 14]

# 模块命名 (按阅读顺序: 左上 → 右上 → 左下 → 右下)
MODULE_NAMES = [
    "module1_topleft",
    "module2_topright",
    "module3_bottomleft",
    "module4_bottomright",
]

# 每页的水平分割比例 (顶部高度占比), 默认 0.5
# P13 顶部略高: 0.52
H_SPLIT_RATIO = {
    11: 0.50,
    12: 0.50,
    13: 0.52,  # 顶部略微高一点
    14: 0.50,
}

for page_num in PAGES:
    src_path = SRC_DIR / f"page_{page_num:02d}.png"
    img = Image.open(src_path)
    w, h = img.size  # 8520 × 5320
    half_w = w // 2
    split_h = int(h * H_SPLIT_RATIO[page_num])

    # 4 个模块的 crop box (left, upper, right, lower)
    boxes = [
        (0, 0, half_w, split_h),                 # 左上
        (half_w, 0, w, split_h),                 # 右上
        (0, split_h, half_w, h),                 # 左下
        (half_w, split_h, w, h),                 # 右下
    ]

    for mod_name, box in zip(MODULE_NAMES, boxes):
        crop = img.crop(box)
        out_path = OUT_DIR / f"p{page_num:02d}_{mod_name}.png"
        crop.save(out_path, "PNG", optimize=True)
        print(f"P{page_num} {mod_name}: {crop.size} -> {out_path.name}")

print(f"\nDone. 共 {len(PAGES) * 4} 张图, 保存到: {OUT_DIR}")
