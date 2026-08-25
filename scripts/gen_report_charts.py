# -*- coding: utf-8 -*-
"""
阶段交付报告 - 品牌配图生成脚本
品牌色系：健康科技绿
输出到 docs/_report_assets/
"""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, Rectangle
from matplotlib.colors import LinearSegmentedColormap
import matplotlib.font_manager as fm

# ---------- 字体配置 ----------
for f in ["Microsoft YaHei", "SimHei", "Source Han Sans SC", "Noto Sans CJK SC"]:
    try:
        fm.findfont(fm.FontProperties(family=f), fallback_to_default=False)
    except Exception:
        pass
plt.rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei", "DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

# ---------- 品牌色 ----------
PRIMARY = "#0B6E3F"      # 深绿 主色
ACCENT = "#16A34A"       # 鲜绿 强调
ACCENT2 = "#22C55E"      # 亮绿
LIGHT = "#E8F5EE"        # 浅绿底
MINT = "#DCFCE7"         # 薄荷
GOLD = "#CA8A04"         # 金色 标配强调
INK = "#1F2937"          # 深墨正文
GRAY = "#6B7280"         # 中灰
BORDER = "#D1D5DB"       # 浅灰边框
WHITE = "#FFFFFF"

OUT = os.path.join(os.path.dirname(__file__), "..", "docs", "_report_assets")
OUT = os.path.abspath(OUT)
os.makedirs(OUT, exist_ok=True)


def rrect(ax, x, y, w, h, fc, ec="none", lw=0, rad=0.02, alpha=1, zorder=1):
    p = FancyBboxPatch((x, y), w, h,
                       boxstyle=f"round,pad=0,rounding_size={rad}",
                       fc=fc, ec=ec, lw=lw, alpha=alpha, zorder=zorder,
                       mutation_aspect=1)
    ax.add_patch(p)
    return p


def save(fig, name, transparent=False):
    path = os.path.join(OUT, name)
    fig.savefig(path, dpi=180, bbox_inches="tight",
                facecolor=fig.get_facecolor() if not transparent else "none",
                transparent=transparent)
    plt.close(fig)
    print("saved:", path)


# ============================================================
# 1. 封面装饰图 cover_banner.png
# ============================================================
def gen_cover_banner():
    fig, ax = plt.subplots(figsize=(16, 5.2))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 5.2)
    ax.axis("off")

    # 背景渐变 深绿 -> 鲜绿
    cmap = LinearSegmentedColormap.from_list("brand", [PRIMARY, ACCENT, ACCENT2])
    grad = np.linspace(0, 1, 256).reshape(1, -1)
    ax.imshow(grad, extent=[0, 16, 0, 5.2], aspect="auto", cmap=cmap, zorder=0)

    # 半透明声波/心电图线条（呼应助听器+健康科技）
    xs = np.linspace(0, 16, 800)
    np.random.seed(7)
    for i, (amp, freq, ph, alpha, y0) in enumerate([
        (0.35, 1.1, 0.0, 0.10, 1.3),
        (0.25, 1.7, 1.2, 0.08, 2.6),
        (0.30, 0.8, 2.4, 0.07, 3.9),
        (0.20, 2.3, 0.6, 0.06, 4.5),
    ]):
        y = y0 + amp * np.sin(xs * freq + ph) * np.exp(-((xs - 8) / 9) ** 2 * 0.3)
        ax.plot(xs, y, color=WHITE, alpha=alpha, lw=2.2, zorder=2)

    # 装饰圆点
    for (cx, cy, r, a) in [(1.2, 4.3, 0.18, 0.18), (14.6, 0.9, 0.25, 0.16),
                           (13.0, 4.0, 0.12, 0.22), (2.5, 0.7, 0.10, 0.20),
                           (8.0, 4.7, 0.08, 0.15)]:
        ax.add_patch(Circle((cx, cy), r, color=WHITE, alpha=a, zorder=3))

    # 右侧大圆装饰（半透明）
    ax.add_patch(Circle((15.2, 2.6), 1.6, color=WHITE, alpha=0.06, zorder=2))
    ax.add_patch(Circle((15.6, 2.0), 1.0, color=WHITE, alpha=0.05, zorder=2))

    fig.patch.set_facecolor(PRIMARY)
    save(fig, "cover_banner.png")


# ============================================================
# 2. 核心数据看板 dashboard.png
# ============================================================
def gen_dashboard():
    cards = [
        ("12", "个", "页面总数", "首页+9子页面"),
        ("39", "个", "可访问 URL", "13路由 × 3语言"),
        ("1.4万", "行", "工程代码", "71 个源文件"),
        ("139", "张", "资源图片", "产品/Hero/资质/场景"),
        ("31+", "张", "品牌定制配图", "全场景覆盖"),
        ("24", "页", "静态预渲染", "AI爬虫无障碍抓取"),
    ]
    fig, ax = plt.subplots(figsize=(13.5, 7.6))
    ax.set_xlim(0, 13.5)
    ax.set_ylim(0, 7.6)
    ax.axis("off")
    fig.patch.set_facecolor(WHITE)

    # 标题
    ax.text(0.4, 7.05, "核心交付数据一览", fontsize=22, fontweight="bold", color=INK)
    ax.add_patch(Rectangle((0.42, 6.62), 1.7, 0.07, color=ACCENT, zorder=3))

    cw, ch = 4.05, 2.85
    gx, gy = 0.35, 0.25
    x0, y0 = 0.4, 3.4
    for i, (num, unit, title, desc) in enumerate(cards):
        r, c = divmod(i, 3)
        x = x0 + c * (cw + gx)
        y = y0 - r * (ch + gy)
        # 卡片底
        rrect(ax, x, y, cw, ch, LIGHT, rad=0.12, zorder=2)
        # 顶部色条
        rrect(ax, x, y + ch - 0.16, cw, 0.16, ACCENT, rad=0.08, zorder=3)
        # 数字（居中偏上）
        ax.text(x + cw / 2, y + ch - 1.00, num, fontsize=40, fontweight="bold",
                color=PRIMARY, va="center", ha="center")
        # 单位（小字紧贴数字下方，作为下标）
        ax.text(x + cw / 2, y + ch - 1.55, unit, fontsize=13, color=GRAY,
                va="center", ha="center")
        # 标题
        ax.text(x + cw / 2, y + 0.80, title, fontsize=15.5, fontweight="bold",
                color=INK, va="center", ha="center")
        # 说明
        ax.text(x + cw / 2, y + 0.32, desc, fontsize=11.5, color=GRAY,
                va="center", ha="center")
    save(fig, "dashboard.png")


# ============================================================
# 3. SEO + GEO 双栈对比图 seo_geo.png
# ============================================================
def gen_seo_geo():
    fig, ax = plt.subplots(figsize=(13.5, 7.4))
    ax.set_xlim(0, 13.5)
    ax.set_ylim(0, 7.4)
    ax.axis("off")
    fig.patch.set_facecolor(WHITE)

    ax.text(0.4, 6.95, "SEO + GEO 双栈优化能力", fontsize=21, fontweight="bold", color=INK)
    ax.add_patch(Rectangle((0.42, 6.52), 1.7, 0.07, color=ACCENT, zorder=3))

    # 两栏标题块
    rrect(ax, 0.4, 5.55, 6.1, 0.8, PRIMARY, rad=0.06, zorder=2)
    ax.text(3.45, 5.95, "SEO · 传统搜索引擎", fontsize=15, fontweight="bold",
            color=WHITE, ha="center", va="center")
    ax.text(3.45, 5.68, "百度 / Google / Bing", fontsize=10.5, color="#D1FAE5",
            ha="center", va="center")

    rrect(ax, 7.0, 5.55, 6.1, 0.8, GOLD, rad=0.06, zorder=2)
    ax.text(10.05, 5.95, "GEO · AI 搜索引擎", fontsize=15, fontweight="bold",
            color=WHITE, ha="center", va="center")
    ax.text(10.05, 5.68, "豆包 / ChatGPT / Perplexity / Claude", fontsize=10.5,
            color="#FEF3C7", ha="center", va="center")

    seo_items = [
        ("36 套", "动态元信息", "3语种×12页面独立 title/description/keywords"),
        ("4 条", "多语言防重复", "alternate 链接避免重复内容惩罚"),
        ("全覆盖", "社交分享卡片", "微信/微博/Facebook/LinkedIn"),
        ("24 URL", "站点地图", "按权重与频率分配抓取节奏"),
        ("精细", "爬虫协议", "允许全站，禁低价值页"),
    ]
    geo_items = [
        ("37 条", "FAQ 问答矩阵", "6大分类高频问题，AI可直接引用"),
        ("37 条", "FAQ 结构化数据", "AI爬虫抓取问答对作为答案来源"),
        ("13 个", "AI 爬虫友好协议", "GPTBot/PerplexityBot/ClaudeBot等"),
        ("1 套", "AI 摘要+品牌知识库", "完整知识图谱供AI拉取"),
        ("24 页", "静态预渲染", "AI爬虫无需执行JS即可抓取"),
        ("3 处", "核心页内嵌FAQ", "首页/产品/招商各注入4条"),
    ]

    def col(x, items, accent):
        y = 5.15
        for i, (num, title, desc) in enumerate(items):
            yy = y - i * 0.92
            rrect(ax, x, yy - 0.72, 6.1, 0.78, LIGHT, rad=0.08, zorder=2)
            # 左侧色块
            rrect(ax, x, yy - 0.72, 0.12, 0.78, accent, rad=0.04, zorder=3)
            ax.text(x + 0.35, yy - 0.06, num, fontsize=15, fontweight="bold",
                    color=accent, va="center")
            ax.text(x + 1.75, yy - 0.08, title, fontsize=12.5, fontweight="bold",
                    color=INK, va="center")
            ax.text(x + 0.35, yy - 0.52, desc, fontsize=10, color=GRAY, va="center")

    col(0.4, seo_items, PRIMARY)
    col(7.0, geo_items, GOLD)
    save(fig, "seo_geo.png")


# ============================================================
# 4. 交付价值矩阵 value_matrix.png
# ============================================================
def gen_value_matrix():
    items = [
        ("GEO 优化（AI搜索引擎命中）", "增值加价", "标配交付"),
        ("FAQ 独立页面模块", "增值加价", "标配交付"),
        ("AI 摘要文档 + 品牌知识库", "行业基本不提供", "标配交付"),
        ("静态预渲染", "增值加价", "标配交付"),
        ("多语言国际化（3 语）", "按语种加价", "标配交付"),
        ("品牌定制配图", "按张数加价", "标配交付"),
        ("品牌宣传片", "单独报价", "标配交付"),
        ("招商手册图表代码化复刻", "行业基本不提供", "标配交付"),
        ("数据与视图分离（可维护性）", "增值加价", "标配交付"),
    ]
    fig, ax = plt.subplots(figsize=(13.5, 8.4))
    ax.set_xlim(0, 13.5)
    ax.set_ylim(0, 8.4)
    ax.axis("off")
    fig.patch.set_facecolor(WHITE)

    ax.text(0.4, 7.95, "交付价值矩阵：同行增值加价 vs 本次标配交付",
            fontsize=20, fontweight="bold", color=INK)
    ax.add_patch(Rectangle((0.42, 7.5), 1.7, 0.07, color=ACCENT, zorder=3))

    # 表头
    rrect(ax, 0.4, 6.85, 7.3, 0.62, INK, rad=0.05, zorder=2)
    ax.text(0.7, 7.16, "交付维度", fontsize=12.5, fontweight="bold", color=WHITE, va="center")
    rrect(ax, 7.85, 6.85, 2.4, 0.62, "#9CA3AF", rad=0.05, zorder=2)
    ax.text(9.05, 7.16, "同行通常定位", fontsize=12, fontweight="bold", color=WHITE,
            va="center", ha="center")
    rrect(ax, 10.4, 6.85, 2.7, 0.62, GOLD, rad=0.05, zorder=2)
    ax.text(11.75, 7.16, "本次交付定位", fontsize=12, fontweight="bold", color=WHITE,
            va="center", ha="center")

    y = 6.55
    rh = 0.62
    for i, (name, peer, ours) in enumerate(items):
        yy = y - i * (rh + 0.06)
        bg = LIGHT if i % 2 == 0 else WHITE
        rrect(ax, 0.4, yy - rh, 12.7, rh, bg, rad=0.04, zorder=2)
        ax.text(0.7, yy - rh / 2, name, fontsize=11.8, color=INK, va="center",
                fontweight="bold")
        # peer
        ax.text(9.05, yy - rh / 2, peer, fontsize=10.5, color=GRAY, va="center",
                ha="center")
        # ours badge
        rrect(ax, 10.75, yy - rh / 2 - 0.19, 2.0, 0.38, GOLD, rad=0.06, zorder=3)
        ax.text(11.75, yy - rh / 2, ours, fontsize=10.5, fontweight="bold",
                color=WHITE, va="center", ha="center")
    save(fig, "value_matrix.png")


# ============================================================
# 5. 品牌配图用途分布 brand_assets.png
# ============================================================
def gen_brand_assets():
    data = [
        ("资质荣誉图", 10),
        ("首页 Hero 产品入口图", 7),
        ("招商场景图", 6),
        ("招聘分类图", 6),
        ("首页 Hero 迭代优化图", 3),
        ("企业文化图", 3),
        ("招商 Hero 图（三语种）", 3),
    ]
    fig, ax = plt.subplots(figsize=(12.5, 6.6))
    fig.patch.set_facecolor(WHITE)
    ax.set_facecolor(WHITE)

    labels = [d[0] for d in data]
    vals = [d[1] for d in data]
    y = np.arange(len(data))[::-1]

    # 渐变色条
    cmap = LinearSegmentedColormap.from_list("g", [ACCENT2, ACCENT, PRIMARY])
    colors = [cmap(i / (len(data) - 1)) for i in range(len(data))]

    bars = ax.barh(y, vals, color=colors, height=0.62, zorder=3)
    for i, (b, v) in enumerate(zip(bars, vals)):
        ax.text(v + 0.18, b.get_y() + b.get_height() / 2, f"{v} 张",
                va="center", fontsize=12.5, fontweight="bold", color=PRIMARY)

    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=12, color=INK)
    ax.set_xlim(0, max(vals) + 2.2)
    ax.set_xlabel("配图数量（张）", fontsize=11, color=GRAY)
    ax.set_title("品牌定制配图用途分布（共 31+ 张）", fontsize=18,
                 fontweight="bold", color=INK, loc="left", pad=16)

    for s in ["top", "right", "left"]:
        ax.spines[s].set_visible(False)
    ax.spines["bottom"].set_color(BORDER)
    ax.tick_params(axis="x", colors=GRAY, labelsize=10)
    ax.tick_params(axis="y", length=0)
    ax.grid(axis="x", color=BORDER, lw=0.6, alpha=0.6, zorder=0)
    save(fig, "brand_assets.png")


if __name__ == "__main__":
    gen_cover_banner()
    gen_dashboard()
    gen_seo_geo()
    gen_value_matrix()
    gen_brand_assets()
    print("ALL DONE")
