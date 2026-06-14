from datetime import datetime
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

from PIL import Image as PILImage, ImageOps
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from ..config.storage import UPLOAD_DIR

PAGE_W, PAGE_H = A4
MARGIN_X = 40
TOP_Y = PAGE_H - 38
FOOTER_H = 34
CARD_H = 122
CARD_GAP = 12
PHOTO_SIZE = 72

NAVY = colors.HexColor("#0d1b2a")
NAVY_2 = colors.HexColor("#1a2e45")
CORAL = colors.HexColor("#e8593a")
MINT = colors.HexColor("#60d3c2")
CREAM = colors.HexColor("#faf7f2")
CREAM_2 = colors.HexColor("#f0ebe2")
TEXT = colors.HexColor("#1a1a2e")
MUTED = colors.HexColor("#6d7f95")
BORDER = colors.HexColor("#dfe5ec")


def generate_pdf(students: list[dict], options: dict | None = None) -> str:
    opts = options or {}
    title = opts.get("title", "Trombinoscope")
    class_label = opts.get("class_label", "")
    output_path = (
        Path(UPLOAD_DIR) / f"trombi-{int(datetime.now().timestamp() * 1000)}.pdf"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)

    c = canvas.Canvas(str(output_path), pagesize=A4)
    generated_at = datetime.now()
    page_number = 1
    y = _draw_header(c, title, class_label, len(students), generated_at)

    for index, student in enumerate(students, start=1):
        if y - CARD_H < FOOTER_H + 12:
            _draw_footer(c, page_number, generated_at)
            c.showPage()
            page_number += 1
            y = _draw_header(
                c, title, class_label, len(students), generated_at, compact=True
            )

        y -= CARD_H
        _draw_student_card(c, student, index, y, class_label)
        y -= CARD_GAP

    _draw_footer(c, page_number, generated_at)
    c.save()
    return str(output_path)


def _draw_header(
    c: canvas.Canvas,
    title: str,
    class_label: str,
    total_students: int,
    generated_at: datetime,
    compact: bool = False,
) -> float:
    header_h = 108 if not compact else 88
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - header_h, PAGE_W, header_h, fill=1, stroke=0)

    c.setFillColor(CORAL)
    c.rect(0, PAGE_H - header_h, 7, header_h, fill=1, stroke=0)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 22 if not compact else 19)
    c.drawString(MARGIN_X, TOP_Y, title)

    c.setFillColor(MINT)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN_X, TOP_Y - 18, "DOCUMENT INTERNE")

    c.setFillColor(colors.Color(1, 1, 1, alpha=0.72))
    c.setFont("Helvetica", 11)
    subtitle = f"Classe : {class_label}" if class_label else "Toutes les classes"
    c.drawString(MARGIN_X, TOP_Y - 36, subtitle)

    summary_w = 138
    summary_x = PAGE_W - MARGIN_X - summary_w
    summary_y = PAGE_H - 76
    c.setFillColor(colors.Color(1, 1, 1, alpha=0.08))
    c.roundRect(summary_x, summary_y, summary_w, 44, 12, fill=1, stroke=0)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 17)
    c.drawRightString(summary_x + summary_w - 14, summary_y + 22, str(total_students))
    c.setFillColor(colors.Color(1, 1, 1, alpha=0.68))
    c.setFont("Helvetica", 9)
    c.drawRightString(summary_x + summary_w - 14, summary_y + 10, "etudiants")

    c.setFillColor(CREAM)
    c.rect(0, 0, PAGE_W, PAGE_H - header_h, fill=1, stroke=0)

    if not compact:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(
            MARGIN_X,
            PAGE_H - header_h - 22,
            f"Genere le {generated_at.strftime('%d/%m/%Y a %H:%M')}",
        )
        return PAGE_H - header_h - 40

    return PAGE_H - header_h - 28


def _draw_student_card(
    c: canvas.Canvas, student: dict, index: int, y: float, class_label: str
):
    x = MARGIN_X
    w = PAGE_W - 2 * MARGIN_X

    c.setFillColor(colors.white)
    c.roundRect(x, y, w, CARD_H, 14, fill=1, stroke=0)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, CARD_H, 14, fill=0, stroke=1)

    photo_x = x + 22
    photo_y = y + (CARD_H - PHOTO_SIZE) / 2
    photo_cx = photo_x + PHOTO_SIZE / 2
    photo_cy = photo_y + PHOTO_SIZE / 2
    c.setFillColor(CREAM_2)
    c.circle(photo_cx, photo_cy, PHOTO_SIZE / 2, fill=1, stroke=0)

    image_reader = _get_image_reader(student.get("photo_url"))
    if image_reader:
        try:
            clipped = False
            c.saveState()
            clip = c.beginPath()
            clip.circle(photo_cx, photo_cy, PHOTO_SIZE / 2)
            c.clipPath(clip, stroke=0, fill=0)
            clipped = True
            c.drawImage(
                image_reader,
                photo_x,
                photo_y,
                width=PHOTO_SIZE,
                height=PHOTO_SIZE,
                mask="auto",
            )
            c.restoreState()
            clipped = False
            c.setStrokeColor(MINT)
            c.setLineWidth(1.6)
            c.circle(photo_cx, photo_cy, PHOTO_SIZE / 2, fill=0, stroke=1)
        except Exception:
            if clipped:
                c.restoreState()
            _draw_photo_placeholder(c, student, photo_x, photo_y)
    else:
        _draw_photo_placeholder(c, student, photo_x, photo_y)

    text_x = x + 116
    right_x = x + w - 22
    content_w = right_x - text_x
    name = (
        f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
        or "Etudiant"
    )
    email = student.get("email") or "Email non renseigne"
    cls = student.get("class_label") or class_label or "Classe non renseignee"
    student_id = student.get("id") or "-"
    created_at = _format_date(student.get("created_at"))

    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(text_x, y + CARD_H - 34, f"#{index:02d}")

    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 14)
    _draw_trimmed(
        c, name, text_x + 28, y + CARD_H - 38, content_w - 28, "Helvetica-Bold", 14
    )

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9)
    _draw_trimmed(
        c, email, text_x + 28, y + CARD_H - 56, content_w - 28, "Helvetica", 9
    )

    c.setStrokeColor(BORDER)
    c.setLineWidth(0.7)
    c.line(text_x, y + 52, right_x, y + 52)

    detail_gap = 9
    detail_w = (content_w - detail_gap * 2) / 3
    _draw_label_value(c, "Classe", cls, text_x, y + 16, detail_w)
    _draw_label_value(
        c,
        "Identifiant",
        f"#{student_id}",
        text_x + detail_w + detail_gap,
        y + 16,
        detail_w,
    )
    _draw_label_value(
        c,
        "Inscrit le",
        created_at,
        text_x + (detail_w + detail_gap) * 2,
        y + 16,
        detail_w,
    )


def _draw_label_value(
    c: canvas.Canvas, label: str, value: str, x: float, y: float, width: float
):
    c.setFillColor(CREAM)
    c.roundRect(x, y, width, 28, 8, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 6.6)
    c.drawString(x + 9, y + 17, label.upper())
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 8)
    _draw_trimmed(c, value, x + 9, y + 7, width - 18, "Helvetica", 8)


def _draw_footer(c: canvas.Canvas, page_number: int, generated_at: datetime):
    c.setFillColor(CREAM)
    c.rect(0, 0, PAGE_W, FOOTER_H, fill=1, stroke=0)
    c.setStrokeColor(BORDER)
    c.line(MARGIN_X, FOOTER_H, PAGE_W - MARGIN_X, FOOTER_H)

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawString(
        MARGIN_X,
        16,
        f"Donnees personnelles - Conformite RGPD. Genere le {generated_at.strftime('%d/%m/%Y')} par TrombiFlow.",
    )
    c.drawRightString(PAGE_W - MARGIN_X, 16, f"Page {page_number}")


def _draw_photo_placeholder(c: canvas.Canvas, student: dict, x: float, y: float):
    initials = (
        f"{student.get('first_name', '')[:1]}{student.get('last_name', '')[:1]}".strip().upper()
        or "ET"
    )
    c.setFillColor(CREAM_2)
    c.circle(x + PHOTO_SIZE / 2, y + PHOTO_SIZE / 2, PHOTO_SIZE / 2, fill=1, stroke=0)
    c.setStrokeColor(MINT)
    c.setLineWidth(1.6)
    c.circle(x + PHOTO_SIZE / 2, y + PHOTO_SIZE / 2, PHOTO_SIZE / 2, fill=0, stroke=1)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(x + PHOTO_SIZE / 2, y + PHOTO_SIZE / 2 - 5, initials)


def _draw_trimmed(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    max_width: float,
    font_name: str,
    font_size: float,
):
    text = str(text or "")
    if c.stringWidth(text, font_name, font_size) <= max_width:
        c.drawString(x, y, text)
        return

    suffix = "..."
    while text and c.stringWidth(text + suffix, font_name, font_size) > max_width:
        text = text[:-1]
    c.drawString(x, y, text + suffix if text else suffix)


def _format_date(value) -> str:
    if not value:
        return "Non renseigne"
    if isinstance(value, datetime):
        return value.strftime("%d/%m/%Y")
    text = str(value)
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).strftime("%d/%m/%Y")
    except ValueError:
        return text[:10]


def _get_image_reader(photo_url: str | None):
    image_bytes = _read_image_bytes(photo_url)
    if not image_bytes:
        return None

    try:
        with PILImage.open(BytesIO(image_bytes)) as img:
            img = ImageOps.exif_transpose(img).convert("RGB")
            side = min(img.size)
            left = (img.width - side) // 2
            top = (img.height - side) // 2
            img = img.crop((left, top, left + side, top + side)).resize((240, 240))
            buffer = BytesIO()
            img.save(buffer, format="JPEG", quality=88)
            buffer.seek(0)
            return ImageReader(buffer)
    except Exception:
        return None


def _read_image_bytes(photo_url: str | None) -> bytes | None:
    if not photo_url or photo_url.startswith(("data:", "blob:")):
        return None

    if photo_url.startswith(("http://", "https://")):
        try:
            with urlopen(photo_url, timeout=4) as response:
                content_type = response.headers.get("Content-Type", "")
                if content_type and not content_type.startswith("image/"):
                    return None
                return response.read(5 * 1024 * 1024)
        except Exception:
            return None

    normalized = photo_url.lstrip("/").replace("\\", "/")
    candidates = [
        Path(UPLOAD_DIR) / Path(normalized).name,
        Path.cwd() / normalized,
    ]

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate.read_bytes()

    return None
