"""把招商手册 PDF 第 11-14 页转成图片预览, 方便确定分割方案。"""
import sys
from pathlib import Path

try:
    import pypdfium2 as pdfium
except ImportError:
    print("Installing pypdfium2...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdfium2", "-q"])
    import pypdfium2 as pdfium

PDF_PATH = r"d:\VibeTest\bigsound\file\招商手册1212 .pdf"
OUT_DIR = Path(r"d:\VibeTest\bigsound\aigpic\pdf_preview")
OUT_DIR.mkdir(parents=True, exist_ok=True)

pdf = pdfium.PdfDocument(PDF_PATH)
total = len(pdf)
print(f"PDF 总页数: {total}")

# 渲染 11-14 页 (索引 10-13)
for page_num in [11, 12, 13, 14]:
    page = pdf[page_num - 1]
    # 用 2x 渲染保证清晰度
    pil_image = page.render(scale=2).to_pil()
    out_path = OUT_DIR / f"page_{page_num:02d}.png"
    pil_image.save(out_path, "PNG")
    print(f"第 {page_num} 页: {pil_image.size} -> {out_path}")

pdf.close()
print("Done.")
