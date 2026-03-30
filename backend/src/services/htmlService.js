function generateTrombiHTML(students, options = {}) {
  const { title = 'Trombinoscope', class_label = '' } = options;
  const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const cards = students.map((s) => {
    const src = s.photo_url
      ? (s.photo_url.startsWith('http') ? s.photo_url : `${baseUrl}/${s.photo_url}`)
      : `${baseUrl}/uploads/placeholder.png`;
    return `
    <div class="card">
      <img src="${esc(src)}" alt="${esc(s.first_name)} ${esc(s.last_name)}" onerror="this.style.background='#ddd';this.src=''"/>
      <div class="name">${esc(s.first_name)} ${esc(s.last_name)}</div>
      ${s.email ? `<div class="email">${esc(s.email)}</div>` : ''}
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${esc(title)}${class_label ? ' — ' + esc(class_label) : ''}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f0f2f5; padding: 24px; color: #333; }
    h1 { text-align: center; font-size: 1.8rem; margin-bottom: 6px; }
    .subtitle { text-align: center; color: #666; margin-bottom: 24px; }
    .grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; max-width: 1200px; margin: 0 auto; }
    .card { background: #fff; border-radius: 10px; padding: 14px 12px 10px; width: 150px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    .card img { width: 110px; height: 110px; border-radius: 50%; object-fit: cover; background: #ddd; display: block; margin: 0 auto 8px; }
    .name { font-weight: 700; font-size: .8rem; line-height: 1.3; }
    .email { font-size: .7rem; color: #888; margin-top: 4px; word-break: break-all; }
    .footer { margin: 36px auto 0; max-width: 800px; padding: 14px 20px; background: #e8eaed; border-radius: 6px; font-size: .72rem; color: #555; text-align: center; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${esc(title)}</h1>
  ${class_label ? `<p class="subtitle">Classe : ${esc(class_label)}</p>` : ''}
  <div class="grid">${cards}</div>
  <div class="footer">
    ⚠️ <strong>Données personnelles — Conformité RGPD</strong><br/>
    Généré le ${date} par TrombiFlow. Toute diffusion non autorisée est interdite.
  </div>
</body>
</html>`;
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = { generateTrombiHTML };
