"""
从参考图 public/images/prototype/team_exec_card.png 中裁剪出 4 位核心团队成员头像。
输出: public/images/about/team/team_member_{idx}.png (108x108 方形, 供页面圆形裁剪使用)
"""

from PIL import Image
import os

SRC = "public/images/prototype/team_exec_card.png"
OUT_DIR = "public/images/about/team"
CARD_HEIGHT = 108  # 433 / 4 ≈ 108
SIZE = 108


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    img = Image.open(SRC).convert("RGBA")
    width, height = img.size

    # 按垂直方向均分为 4 张卡片
    card_h = height // 4

    for i in range(4):
        y_top = i * card_h
        y_bottom = (i + 1) * card_h if i < 3 else height

        # 取卡片左侧人物区域 (x: 0 ~ card_h, 保证正方形)
        crop_w = min(card_h, width)
        crop_box = (0, y_top, crop_w, y_bottom)
        portrait = img.crop(crop_box)

        # 缩放到统一尺寸
        portrait = portrait.resize((SIZE, SIZE), Image.Resampling.LANCZOS)

        out_path = os.path.join(OUT_DIR, f"team_member_{i + 1}.png")
        portrait.save(out_path, "PNG")
        print(f"Saved {out_path}")


if __name__ == "__main__":
    main()
