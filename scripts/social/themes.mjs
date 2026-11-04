// Six mises en page « photo en fond » pour les posts d'un seul concours (nouveau, derniers jours, liste).
// Le propriétaire a validé les 6 designs le 04/11/2026 et veut qu'ils alternent : un design par post, à tour de rôle.
import { join } from 'node:path';

const HERE = new URL('.', import.meta.url).pathname;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Photo de fond selon le métier (images KounKour générées pour la page, scripts/social/bg/k1..k9.jpg).
const BG = [
  [/\bSRM\b|multiservices|ouvrier|électricien|plombier|soudeur|chauffeur|conducteur/i, 'k1'],
  [/ONCF|ferroviaire|\btrain\b|cheminot/i, 'k2'],
  [/téléconseill|centre d.appels?|relation client|chargé.? de clientèle/i, 'k3'],
  [/professeur de l.enseignement (primaire|secondaire)|enseignant|instituteur|formateur|CRMEF|éducat/i, 'k9'],
  [/ingénieur|architecte/i, 'k7'],
  [/technicien|agent de maîtrise|topograph/i, 'k4'],
  [/comptab|financ|audit|économ|trésor|fiscal/i, 'k5'],
  [/administrateur|cadre|attaché|secrétaire|adjoint|rédacteur|juriste|gestionnaire/i, 'k6'],
];
export function backgroundFor(text) {
  const hit = BG.find(([re]) => re.test(text || ''));
  return join(HERE, 'bg', `${hit ? hit[1] : 'k8'}.jpg`);
}
export const THEME_COUNT = 6;

// Taille du titre selon sa longueur (le titre ne doit jamais déborder).
const fit = (t, sizes) => { const n = t.length; return n > 90 ? sizes[3] : n > 65 ? sizes[2] : n > 40 ? sizes[1] : sizes[0]; };

// d = { badge, title, org, logo (html), postes, stat2L, stat2V, cta, ctaAr, bg, fontsCss }
export function themedHtml(theme, d) {
  const [head, ...rest] = d.title.split(' – ');
  const tail = rest.join(' · ');
  const T = esc(d.title);
  const H = `<em>${esc(head)}</em>${tail ? `<br>${esc(tail)}` : ''}`;
  const P = d.postes ? `${d.postes} poste${d.postes > 1 ? 's' : ''}` : null;
  const base = `*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;position:relative;overflow:hidden;color:#fff;font-family:'Plus Jakarta Sans',sans-serif}
.bg{position:absolute;inset:0;background:url('file://${d.bg}') center/cover}
.k{display:inline-grid;place-items:center;width:60px;height:60px;border-radius:16px;background:#fff;color:#8D174B;font-weight:800;font-size:40px}
.brand{display:flex;align-items:center;gap:14px;font-weight:800;font-size:42px}
.lg{border-radius:50%;background:#fff;display:grid;place-items:center;overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,.35)}
.lg .logo{border:0!important;background:transparent!important;width:100%!important;height:100%!important;display:grid;place-items:center}
.lg img{max-width:72%;max-height:72%;object-fit:contain}.lg .ini{font-size:38px;font-weight:800;color:#8D174B}
.ar{font-family:'Alexandria',sans-serif;direction:rtl}
.pill{display:inline-block;background:#fff;color:#8D174B;font-weight:800;font-size:42px;padding:18px 44px;border-radius:999px}
h1{font-weight:800;letter-spacing:-1.5px;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden}h1 em{font-style:normal;color:#FFD23F}`;
  const lg = (size) => `<div class="lg" style="width:${size}px;height:${size}px">${d.logo}</div>`;
  const page = (css, body) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file://${d.fontsCss}"><style>${base}${css}</style></head><body><div class="bg"></div>${body}</body></html>`;
  const chipsRow = (cls) => `<div class="${cls}">${P ? `<div>👤 ${esc(P)}</div>` : ''}<div class="hot">${/limite/i.test(d.stat2L) ? '⏳' : '📅'} ${esc(d.stat2L)} : ${esc(d.stat2V)}</div></div>`;
  const bottom = `<div class="pill">kounkour.com</div><div class="ar" style="font-size:32px;font-weight:700;margin-top:14px">${esc(d.ctaAr)}</div>`;

  switch (theme % THEME_COUNT) {
    case 0: // A · photo + gros titre aligné à gauche
      return page(`.sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(40,5,25,.55) 0%,rgba(40,5,25,.3) 30%,rgba(40,5,25,.88) 58%,rgba(30,3,18,.97) 100%)}
.top{position:absolute;top:60px;left:64px;right:64px;display:flex;justify-content:space-between;align-items:center}
.badge{background:#FFD23F;color:#3a0a22;font-weight:800;font-size:28px;letter-spacing:2px;padding:14px 24px;border-radius:14px}
.org{position:absolute;top:500px;left:64px;right:64px;display:flex;align-items:center;gap:22px;font-size:32px;font-weight:700}
h1{position:absolute;top:640px;left:64px;right:64px;line-height:1.05;-webkit-line-clamp:5;font-size:${fit(d.title, [86, 74, 62, 52])}px}
.stats{position:absolute;left:64px;right:64px;top:1020px;display:flex;gap:22px}
.st{flex:1;border-radius:26px;padding:22px 28px;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.25)}.st .l{font-size:26px;font-weight:700;opacity:.85}.st .v{font-size:50px;font-weight:800;line-height:1.05;margin-top:4px}
.st.hot{background:#FFD23F;color:#3a0a22;border-color:#FFD23F}
.bot{position:absolute;left:64px;right:64px;bottom:52px;display:flex;justify-content:space-between;align-items:center}`,
        `<div class="sh"></div><div class="top"><div class="brand"><span class="k">K</span>KounKour</div><div class="badge">📢 ${esc(d.badge)}</div></div>
<div class="org">${lg(104)}<div>${esc(d.org)}</div></div><h1>${H}</h1>
<div class="stats"><div class="st"><div class="l">Postes</div><div class="v">${esc(d.postes || '—')}</div></div><div class="st hot"><div class="l">${/limite/i.test(d.stat2L) ? '⏳' : '📅'} ${esc(d.stat2L)}</div><div class="v">${esc(d.stat2V)}</div></div></div>
<div class="bot"><div class="pill">kounkour.com</div><div class="ar" style="font-size:30px;font-weight:700">${esc(d.ctaAr)}</div></div>`);
    case 1: // B · affiche : photo en haut, tampon de date
      return page(`body{background:#8D174B}.bg{bottom:auto;height:560px;background-position:center 40%}
.fade{position:absolute;left:0;right:0;top:0;height:560px;background:linear-gradient(180deg,rgba(0,0,0,.25),rgba(141,23,75,.15) 60%,#8D174B)}
.top{position:absolute;top:56px;left:64px}
.stamp{position:absolute;right:56px;top:390px;width:280px;height:280px;border-radius:50%;background:#FFD23F;color:#3a0a22;display:grid;place-items:center;text-align:center;transform:rotate(-8deg);box-shadow:0 20px 50px rgba(0,0,0,.35);padding:20px}
.stamp b{display:block;font-size:26px;letter-spacing:2px}.stamp span{display:block;font-size:${d.stat2V.length > 10 ? 40 : 52}px;font-weight:800;line-height:1.05;margin-top:6px}
.tag{position:absolute;top:600px;left:64px;right:340px;font-size:32px;font-weight:800;color:#FFD23F;letter-spacing:3px}
h1{position:absolute;top:670px;left:64px;right:64px;line-height:1.06;-webkit-line-clamp:4;font-size:${fit(d.title, [80, 68, 58, 50])}px}h1 em{color:#fff}
.org{position:absolute;top:1010px;left:64px;right:64px;display:flex;align-items:center;gap:22px;background:rgba(255,255,255,.12);border-radius:26px;padding:16px 22px;font-size:30px;font-weight:700}
.bot{position:absolute;left:64px;right:64px;bottom:50px;text-align:center}`,
        `<div class="fade"></div><div class="top"><div class="brand"><span class="k">K</span>KounKour</div></div>
<div class="stamp"><div><b>${esc(d.stat2L.toUpperCase())}</b><span>${esc(d.stat2V)}</span></div></div>
<div class="tag">📢 ${esc(d.badge)}${P ? ` · ${esc(P.toUpperCase())}` : ''}</div><h1>${T}</h1>
<div class="org">${lg(88)}<div>${esc(d.org)}</div></div><div class="bot">${bottom}</div>`);
    case 2: // C · ticket
      return page(`body{background:#2A0B1C}.bg{filter:blur(18px) brightness(.45);transform:scale(1.1)}
.top{position:absolute;top:60px;left:64px;right:64px;display:flex;justify-content:space-between;align-items:center}
.badge{background:#fff;color:#8D174B;font-weight:800;font-size:26px;letter-spacing:2px;padding:14px 24px;border-radius:999px}
.tk{position:absolute;left:64px;right:64px;top:200px;bottom:240px;background:#fff;color:#242126;border-radius:40px;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.5)}
.tk .ph{height:290px;background:url('file://${d.bg}') center/cover;position:relative}.tk .ph .lg{position:absolute;left:40px;bottom:-54px;border-radius:28px}
.tk .org{margin:70px 40px 0;font-size:28px;font-weight:700;color:#6E6773}
.tk h1{margin:16px 40px 0;line-height:1.08;color:#8D174B;-webkit-line-clamp:4;font-size:${fit(d.title, [64, 56, 48, 42])}px}.tk h1 em{color:#8D174B}
.tk .cut{position:absolute;left:0;right:0;bottom:200px;border-top:4px dashed #E9D6E0}
.tk .stats{position:absolute;left:40px;right:40px;bottom:36px;display:flex;gap:20px}
.tk .st{flex:1;border-radius:24px;background:#FDF2F7;padding:20px 24px}.tk .st .l{font-size:24px;font-weight:700;color:#6E6773}.tk .st .v{font-size:44px;font-weight:800;margin-top:4px}
.tk .st.hot{background:#8D174B;color:#fff}.tk .st.hot .l{color:#F7D7E6}
.bot{position:absolute;left:64px;right:64px;bottom:60px;text-align:center}.bot .pill{background:#FFD23F;color:#3a0a22;font-size:38px}`,
        `<div class="top"><div class="brand"><span class="k">K</span>KounKour</div><div class="badge">${esc(d.badge)}</div></div>
<div class="tk"><div class="ph">${lg(116).replace('class="lg"', 'class="lg" style="border-radius:28px"')}</div><div class="org">${esc(d.org)}</div><h1>${H}</h1><div class="cut"></div>
<div class="stats"><div class="st"><div class="l">Postes</div><div class="v">${esc(d.postes || '—')}</div></div><div class="st hot"><div class="l">${esc(d.stat2L)}</div><div class="v">${esc(d.stat2V)}</div></div></div></div>
<div class="bot"><div class="pill">${esc(d.cta)} 👉 kounkour.com</div></div>`);
    case 3: // D · titre centré, vignette sombre
      return page(`body{text-align:center}.sh{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 48%,rgba(30,3,18,.55) 0%,rgba(30,3,18,.82) 60%,rgba(20,2,12,.95) 100%)}
.brand{position:absolute;top:56px;left:0;right:0;justify-content:center}
.badge{position:absolute;top:150px;left:0;right:0}.badge span{background:#FFD23F;color:#3a0a22;font-weight:800;font-size:28px;letter-spacing:3px;padding:12px 26px;border-radius:12px}
.mid{position:absolute;left:70px;right:70px;top:260px}.mid .lg{margin:0 auto}
.org{font-size:32px;font-weight:700;margin-top:20px;opacity:.92}
h1{line-height:1.05;margin-top:34px;-webkit-line-clamp:5;font-size:${fit(d.title, [88, 76, 64, 54])}px}
.chips{margin-top:44px;display:flex;justify-content:center;gap:18px;flex-wrap:wrap}.chips div{font-size:36px;font-weight:800;padding:16px 28px;border-radius:20px;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.3)}.chips .hot{background:#FFD23F;color:#3a0a22;border-color:#FFD23F}
.bot{position:absolute;left:0;right:0;bottom:56px}`,
        `<div class="sh"></div><div class="brand"><span class="k">K</span>KounKour</div><div class="badge"><span>📢 ${esc(d.badge)}</span></div>
<div class="mid">${lg(124)}<div class="org">${esc(d.org)}</div><h1>${H}</h1>${chipsRow('chips')}</div><div class="bot">${bottom}</div>`);
    case 4: // E · titre centré, duotone magenta, date en cercle
      return page(`body{text-align:center}.bg{filter:grayscale(1) contrast(1.1)}.sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(141,23,75,.86),rgba(90,15,49,.9))}
.frame{position:absolute;inset:44px;border:4px solid rgba(255,210,63,.85);border-radius:40px}
.brand{position:absolute;top:76px;left:0;right:0;justify-content:center}
.lab{position:absolute;top:156px;left:80px;right:80px;font-size:30px;font-weight:800;letter-spacing:5px;color:#FFD23F}
.mid{position:absolute;left:90px;right:90px;top:220px}.mid .lg{margin:0 auto}
h1{line-height:1.03;margin-top:28px;-webkit-line-clamp:4;font-size:${fit(d.title, [86, 72, 60, 50])}px}h1 em{color:#fff}
.org{font-size:32px;font-weight:700;margin-top:22px;opacity:.9}
.date{width:250px;height:250px;border-radius:50%;background:#FFD23F;color:#3a0a22;margin:32px auto 0;display:grid;place-items:center;box-shadow:0 20px 50px rgba(0,0,0,.35);padding:18px}
.date b{display:block;font-size:24px;letter-spacing:2px}.date span{display:block;font-size:${d.stat2V.length > 10 ? 38 : 50}px;font-weight:800;line-height:1.05;margin-top:6px}
.bot{position:absolute;left:0;right:0;bottom:84px}`,
        `<div class="sh"></div><div class="frame"></div><div class="brand"><span class="k">K</span>KounKour</div>
<div class="lab">${esc(d.badge)}${P ? ` · ${esc(P.toUpperCase())}` : ''}</div>
<div class="mid">${lg(116)}<h1>${T}</h1><div class="org">${esc(d.org)}</div><div class="date"><div><b>${esc(d.stat2L.toUpperCase())}</b><span>${esc(d.stat2V)}</span></div></div></div>
<div class="bot">${bottom}</div>`);
    default: // F · bandeau titre centré sur photo claire
      return page(`body{text-align:center}.sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45) 0%,rgba(0,0,0,.1) 30%,rgba(0,0,0,.15) 70%,rgba(0,0,0,.6) 100%)}
.brand{position:absolute;top:56px;left:0;right:0;justify-content:center}
.band{position:absolute;left:0;right:0;top:390px;padding:84px 70px 50px;background:rgba(141,23,75,.93);box-shadow:0 30px 70px rgba(0,0,0,.35)}
.band .lab{font-size:28px;font-weight:800;letter-spacing:4px;color:#FFD23F}
h1{line-height:1.05;margin-top:16px;-webkit-line-clamp:4;font-size:${fit(d.title, [84, 72, 60, 50])}px}h1 em{color:#fff}
.band .org{font-size:30px;font-weight:700;margin-top:18px;opacity:.9}
.lgw{position:absolute;top:320px;left:0;right:0}.lgw .lg{margin:0 auto}
.chips{position:absolute;left:40px;right:40px;bottom:250px;display:flex;justify-content:center;gap:18px;flex-wrap:wrap}.chips div{font-size:38px;font-weight:800;padding:18px 30px;border-radius:22px;background:#fff;color:#2a0a1c;box-shadow:0 14px 30px rgba(0,0,0,.3)}.chips .hot{background:#FFD23F;color:#3a0a22}
.bot{position:absolute;left:0;right:0;bottom:56px}.bot .ar{text-shadow:0 2px 12px rgba(0,0,0,.6)}`,
        `<div class="sh"></div><div class="brand"><span class="k">K</span>KounKour</div>
<div class="band"><div class="lab">📢 ${esc(d.badge)}</div><h1>${T}</h1><div class="org">${esc(d.org)}</div></div>
<div class="lgw">${lg(132)}</div>${chipsRow('chips')}<div class="bot">${bottom}</div>`);
  }
}
