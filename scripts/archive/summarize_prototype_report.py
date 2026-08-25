#!/usr/bin/env python3
"""Summarize prototype extraction report for human review."""
import json
from pathlib import Path

ROOT = Path('D:/VibeTest/bigsound')
report = json.loads((ROOT / 'scripts' / 'prototype_extraction_report.json').read_text(encoding='utf-8'))

print('# PROTOTYPE FILE SUMMARY\n')

for fname, data in report.items():
    print(f'## {fname}\n')
    if data.get('type') == 'excel':
        sheets = data['sheets']
        print(f'- Type: Excel, {len(sheets)} sheets')
        for sname, rows in sheets.items():
            print(f'\n### Sheet: {sname}')
            if isinstance(rows, str):
                print(rows)
                continue
            print(f'Dimensions: {len(rows)} rows x {len(rows[0]) if rows else 0} cols')
            # Print first 15 non-empty rows (merged into readable lines)
            shown = 0
            for r in rows[:30]:
                line = ' | '.join(str(c).strip() for c in r if str(c).strip())
                if line:
                    print(f'  {line[:180]}')
                    shown += 1
                    if shown >= 15:
                        break
    elif data.get('type') == 'pdf':
        pages = data.get('pages', [])
        print(f'- Type: PDF, {len(pages)} pages extracted')
        for p in pages[:15]:
            text = p.get('text', '').replace('\n', ' ')[:200]
            print(f'  P{p["page"]}: {text}{"..." if len(p.get("text",""))>200 else ""}')
    elif data.get('type') == 'pptx':
        slides = data.get('slides', [])
        print(f'- Type: PPTX, {len(slides)} slides extracted')
        for s in slides[:20]:
            text = s.get('text', '').replace('\n', ' ')[:200]
            print(f'  S{s["slide"]}: {text}{"..." if len(s.get("text",""))>200 else ""}')
    else:
        print(f'- Type: {data.get("type")}')

    imgs = data.get('extracted_images', [])
    if imgs:
        print(f'\n- Extracted {len(imgs)} images')
        for img in imgs[:20]:
            print(f'  - {img}')
    print('\n' + '-'*60 + '\n')
