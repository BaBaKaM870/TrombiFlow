import os
from datetime import datetime


def _esc(text: str) -> str:
    return (
        str(text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def generate_trombi_html(students: list[dict], options: dict | None = None) -> str:
    opts = options or {}
    title = opts.get("title", "Trombinoscope")
    class_label = opts.get("class_label", "")
    base_url = os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/")
    date = datetime.now().strftime("%d %B %Y")

    cards = []
    for s in students:
        photo = s.get("photo_url")
        if photo:
            src = photo if photo.startswith("http") else f"{base_url}/{photo}"
        else:
            src = f"{base_url}/uploads/placeholder.png"
        email_line = f'<div class="email">{_esc(s["email"])}</div>' if s.get("email") else ""
        cards.append(f"""
    <div class="card">
      <img src="{_esc(src)}" alt="{_esc(s['first_name'])} {_esc(s['last_name'])}"
           onerror="this.style.background='#ddd';this.src=''"/>
      <div class="name">{_esc(s['first_name'])} {_esc(s['last_name'])}</div>
      {email_line}
    </div>""")

    subtitle = f'<p class="subtitle">Classe : {_esc(class_label)}</p>' if class_label else ""
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>{_esc(title)}{' — ' + _esc(class_label) if class_label else ''}</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: Arial, sans-serif; background: #f0f2f5; padding: 24px; color: #333; }}
    h1 {{ text-align: center; font-size: 1.8rem; margin-bottom: 6px; }}
    .subtitle {{ text-align: center; color: #666; margin-bottom: 24px; }}
    .grid {{ display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; max-width: 1200px; margin: 0 auto; }}
    .card {{ background: #fff; border-radius: 10px; padding: 14px 12px 10px; width: 150px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.1); }}
    .card img {{ width: 110px; height: 110px; border-radius: 50%; object-fit: cover; background: #ddd; display: block; margin: 0 auto 8px; }}
    .name {{ font-weight: 700; font-size: .8rem; line-height: 1.3; }}
    .email {{ font-size: .7rem; color: #888; margin-top: 4px; word-break: break-all; }}
    .footer {{ margin: 36px auto 0; max-width: 800px; padding: 14px 20px; background: #e8eaed; border-radius: 6px; font-size: .72rem; color: #555; text-align: center; line-height: 1.6; }}
  </style>
</head>
<body>
  <h1>{_esc(title)}</h1>
  {subtitle}
  <div class="grid">{''.join(cards)}</div>
  <div class="footer">
    ⚠️ <strong>Données personnelles — Conformité RGPD</strong><br/>
    Généré le {date} par TrombiFlow. Toute diffusion non autorisée est interdite.
  </div>
</body>
</html>"""
