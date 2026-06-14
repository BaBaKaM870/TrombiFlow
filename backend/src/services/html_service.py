import os
from datetime import datetime
from pathlib import Path

from ..config.storage import UPLOAD_DIR


def _esc(text: str) -> str:
    return (
        str(text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


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


def _photo_src(photo: str | None, base_url: str) -> str:
    if not photo:
        return ""
    if photo.startswith(("http://", "https://", "data:")):
        return photo
    return f"{base_url}/{photo.lstrip('/')}"


def generate_trombi_html(students: list[dict], options: dict | None = None) -> str:
    opts = options or {}
    title = opts.get("title", "Trombinoscope")
    class_label = opts.get("class_label", "")
    base_url = os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/")
    generated_at = datetime.now()

    cards = []
    for index, student in enumerate(students, start=1):
        first_name = student.get("first_name", "")
        last_name = student.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip() or "Etudiant"
        initials = f"{first_name[:1]}{last_name[:1]}".strip().upper() or "ET"
        photo = _photo_src(student.get("photo_url"), base_url)
        class_name = (
            student.get("class_label") or class_label or "Classe non renseignee"
        )
        email = student.get("email") or "Email non renseigne"
        student_id = student.get("id") or "-"
        created_at = _format_date(student.get("created_at"))

        photo_markup = (
            f"""
          <img class="student-photo" src="{_esc(photo)}" alt="Photo de {_esc(full_name)}"
               onerror="this.remove(); this.parentElement.classList.add('is-empty'); this.parentElement.querySelector('.photo-initials').hidden=false;"/>
          <span class="photo-initials" hidden>{_esc(initials)}</span>"""
            if photo
            else f'<span class="photo-initials">{_esc(initials)}</span>'
        )

        cards.append(f"""
      <article class="student-card">
        <div class="student-photo-wrap">
          {photo_markup}
        </div>

        <div class="student-main">
          <div class="student-topline">
            <span class="student-index">#{index:02d}</span>
            <h2>{_esc(full_name)}</h2>
          </div>
          <a class="student-email" href="mailto:{_esc(email)}">{_esc(email)}</a>

          <div class="student-details">
            <div class="detail-cell">
              <span>Classe</span>
              <strong>{_esc(class_name)}</strong>
            </div>
            <div class="detail-cell">
              <span>Identifiant</span>
              <strong>#{_esc(student_id)}</strong>
            </div>
            <div class="detail-cell">
              <span>Inscrit le</span>
              <strong>{_esc(created_at)}</strong>
            </div>
          </div>
        </div>
      </article>""")

    subtitle = f"Classe : {_esc(class_label)}" if class_label else "Toutes les classes"
    generated_label = generated_at.strftime("%d/%m/%Y a %H:%M")

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{_esc(title)} - {_esc(class_label) if class_label else 'Toutes les classes'}</title>
  <style>
    :root {{
      --navy: #0d1b2a;
      --navy-2: #1a2e45;
      --coral: #e8593a;
      --mint: #60d3c2;
      --cream: #faf7f2;
      --cream-2: #f0ebe2;
      --text: #1a1a2e;
      --muted: #6d7f95;
      --border: #dfe5ec;
      --shadow: 0 22px 60px rgba(13, 27, 42, 0.12);
    }}

    *, *::before, *::after {{ box-sizing: border-box; }}

    body {{
      margin: 0;
      font-family: Inter, "Segoe UI", Arial, sans-serif;
      color: var(--text);
      background:
        radial-gradient(520px 280px at 12% 0%, rgba(96, 211, 194, 0.18), transparent 68%),
        linear-gradient(180deg, #f7f3ec 0%, #ffffff 48%, #eef9f7 100%);
    }}

    .page {{
      min-height: 100vh;
      padding-bottom: 40px;
    }}

    .hero {{
      position: relative;
      overflow: hidden;
      padding: 42px clamp(24px, 6vw, 72px);
      color: white;
      background: var(--navy);
    }}

    .hero::before {{
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: 8px;
      background: var(--coral);
    }}

    .hero-inner {{
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      align-items: center;
      max-width: 1080px;
      margin: 0 auto;
    }}

    .eyebrow {{
      display: inline-flex;
      color: var(--mint);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }}

    h1 {{
      margin: 0;
      font-size: clamp(34px, 5vw, 54px);
      line-height: 0.95;
      letter-spacing: 0;
    }}

    .subtitle {{
      margin: 14px 0 0;
      color: rgba(255,255,255,0.72);
      font-size: 16px;
    }}

    .summary {{
      min-width: 170px;
      padding: 18px 22px;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 18px;
      background: rgba(255,255,255,0.08);
      text-align: right;
    }}

    .summary strong {{
      display: block;
      font-size: 34px;
      line-height: 1;
    }}

    .summary span {{
      color: rgba(255,255,255,0.68);
      font-size: 12px;
    }}

    .content {{
      width: min(1080px, calc(100% - 40px));
      margin: 28px auto 0;
    }}

    .generated {{
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 18px;
    }}

    .student-list {{
      display: grid;
      gap: 16px;
    }}

    .student-card {{
      display: grid;
      grid-template-columns: 104px 1fr;
      gap: 22px;
      align-items: center;
      padding: 22px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: rgba(255,255,255,0.94);
      box-shadow: var(--shadow);
      page-break-inside: avoid;
    }}

    .student-photo-wrap {{
      width: 88px;
      height: 88px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      overflow: hidden;
      border: 3px solid rgba(96,211,194,0.52);
      background: var(--cream-2);
      box-shadow: 0 12px 28px rgba(13,27,42,0.14);
    }}

    .student-photo {{
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }}

    .photo-initials {{
      color: var(--muted);
      font-size: 22px;
      font-weight: 800;
    }}

    .student-main {{
      min-width: 0;
    }}

    .student-topline {{
      display: flex;
      align-items: baseline;
      gap: 14px;
      min-width: 0;
    }}

    .student-index {{
      color: var(--coral);
      font-size: 12px;
      font-weight: 900;
      flex: 0 0 auto;
    }}

    h2 {{
      margin: 0;
      color: var(--text);
      font-size: 22px;
      line-height: 1.15;
      overflow-wrap: anywhere;
    }}

    .student-email {{
      display: inline-block;
      margin-top: 5px;
      color: #587096;
      font-size: 14px;
      text-decoration: none;
      overflow-wrap: anywhere;
    }}

    .student-details {{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid var(--border);
    }}

    .detail-cell {{
      min-height: 54px;
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--cream);
    }}

    .detail-cell span {{
      display: block;
      color: var(--muted);
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }}

    .detail-cell strong {{
      display: block;
      color: var(--navy);
      font-size: 13px;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }}

    .footer {{
      width: min(1080px, calc(100% - 40px));
      margin: 28px auto 0;
      padding: 16px 20px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: rgba(255,255,255,0.76);
      color: var(--muted);
      font-size: 12px;
      line-height: 1.6;
      text-align: center;
    }}

    @media (max-width: 760px) {{
      .hero-inner {{ grid-template-columns: 1fr; }}
      .summary {{ text-align: left; width: fit-content; }}
      .student-card {{ grid-template-columns: 1fr; justify-items: center; text-align: center; }}
      .student-main {{ width: 100%; }}
      .student-topline {{ justify-content: center; }}
      .student-details {{ grid-template-columns: 1fr; text-align: left; }}
    }}

    @media print {{
      body {{ background: white; }}
      .hero {{ padding: 28px 36px; }}
      .content, .footer {{ width: calc(100% - 56px); }}
      .student-card {{
        box-shadow: none;
        border-color: #ccd5df;
      }}
      .footer {{ page-break-inside: avoid; }}
    }}
  </style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <div class="hero-inner">
        <div>
          <span class="eyebrow">Document interne</span>
          <h1>{_esc(title)}</h1>
          <p class="subtitle">{subtitle}</p>
        </div>
        <div class="summary" aria-label="Nombre d'etudiants">
          <strong>{len(students)}</strong>
          <span>etudiants</span>
        </div>
      </div>
    </header>

    <section class="content">
      <div class="generated">Genere le {generated_label}</div>
      <div class="student-list">
        {''.join(cards)}
      </div>
    </section>

    <footer class="footer">
      <strong>Donnees personnelles - Conformite RGPD.</strong><br/>
      Genere par TrombiFlow. Toute diffusion non autorisee est interdite.
    </footer>
  </main>
</body>
</html>"""


def save_trombi_html(students: list[dict], options: dict | None = None) -> str:
    output_path = (
        Path(UPLOAD_DIR) / f"trombi-{int(datetime.now().timestamp() * 1000)}.html"
    )
    html = generate_trombi_html(students, options)
    output_path.write_text(html, encoding="utf-8")
    return str(output_path)
