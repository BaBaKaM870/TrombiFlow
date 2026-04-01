import os
from datetime import datetime
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

from ..config.storage import UPLOAD_DIR

PAGE_W, PAGE_H = A4          # 595.28 x 841.89 pt
MARGIN   = 30
COLS     = 5
CELL_W   = int((PAGE_W - 2 * MARGIN) / COLS)
IMG_SIZE = 75
CELL_H   = IMG_SIZE + 22
FOOTER_H = 40


def generate_pdf(students: list[dict], options: dict | None = None) -> str:
    opts = options or {}
    title       = opts.get("title", "Trombinoscope")
    class_label = opts.get("class_label", "")
    output_path = str(Path(UPLOAD_DIR) / f"trombi-{int(datetime.now().timestamp() * 1000)}.pdf")

    c = canvas.Canvas(output_path, pagesize=A4)

    def draw_footer():
        c.setFont("Helvetica", 7)
        c.setFillColorRGB(0.47, 0.47, 0.47)
        date = datetime.now().strftime("%d/%m/%Y")
        text = (
            f"⚠ Données personnelles — Conformité RGPD (UE 2016/679). "
            f"Généré le {date} par TrombiFlow. Toute diffusion non autorisée est interdite."
        )
        c.drawCentredString(PAGE_W / 2, FOOTER_H / 2, text)

    # --- header ---
    c.setFont("Helvetica-Bold", 18)
    c.setFillColorRGB(0.13, 0.13, 0.13)
    header_y = PAGE_H - MARGIN - 18
    c.drawCentredString(PAGE_W / 2, header_y, title)
    header_y -= 26

    if class_label:
        c.setFont("Helvetica", 12)
        c.setFillColorRGB(0.33, 0.33, 0.33)
        c.drawCentredString(PAGE_W / 2, header_y, f"Classe : {class_label}")
        header_y -= 18

    header_y -= 10  # extra padding

    rows_first = max(1, int((PAGE_H - (PAGE_H - header_y) - MARGIN - FOOTER_H) / CELL_H))
    rows_other = max(1, int((PAGE_H - 2 * MARGIN - FOOTER_H) / CELL_H))

    page, row, col = 0, 0, 0

    def start_y():
        return PAGE_H - (PAGE_H - header_y) if page == 0 else PAGE_H - MARGIN

    for s in students:
        x = MARGIN + col * CELL_W + int((CELL_W - IMG_SIZE) / 2)
        y = start_y() - (row + 1) * CELL_H

        photo_path = None
        if s.get("photo_url"):
            candidate = os.path.join(os.getcwd(), s["photo_url"])
            if os.path.exists(candidate):
                photo_path = candidate

        if photo_path:
            try:
                c.drawImage(photo_path, x, y, width=IMG_SIZE, height=IMG_SIZE, preserveAspectRatio=False)
            except Exception:
                _draw_placeholder(c, x, y)
        else:
            _draw_placeholder(c, x, y)

        c.setFont("Helvetica", 7.5)
        c.setFillColorRGB(0.13, 0.13, 0.13)
        name = f"{s['first_name']} {s['last_name']}"
        c.drawCentredString(MARGIN + col * CELL_W + CELL_W / 2, y - 4, name)

        col += 1
        if col >= COLS:
            col = 0
            row += 1
            max_rows = rows_first if page == 0 else rows_other
            if row >= max_rows:
                draw_footer()
                c.showPage()
                page += 1
                row = 0

    draw_footer()
    c.save()
    return output_path


def _draw_placeholder(c: canvas.Canvas, x: float, y: float):
    c.setFillColorRGB(0.88, 0.88, 0.88)
    c.setStrokeColorRGB(0.73, 0.73, 0.73)
    c.rect(x, y, IMG_SIZE, IMG_SIZE, fill=1)
    c.setFont("Helvetica", 7)
    c.setFillColorRGB(0.53, 0.53, 0.53)
    c.drawCentredString(x + IMG_SIZE / 2, y + IMG_SIZE / 2 - 4, "photo")
