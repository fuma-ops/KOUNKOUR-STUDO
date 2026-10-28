// Posts Facebook de la page KounKour : image au modèle KounKour (texte et logo de l'organisme
// posés sur le fond) + texte du post, à partir des vraies données de la fiche.
//
//   RADAR_KEY=… node scripts/social/post.mjs apercu [n] [dossier]   images + textes, rien n'est publié
//   RADAR_KEY=… node scripts/social/post.mjs publier [n]            publie sur la page (jamais deux fois)
//
// Types : « nouveau » (publié depuis moins de 36 h) puis « dernier » (date limite dans 0 à 2 jours).
// Fonds personnalisés : déposer scripts/social/templates/<type>.png (1080 × 1350) ; sinon le fond
// KounKour intégré est utilisé. Les zones de texte sont les mêmes dans les deux cas.
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const URL = 'https://aqnxeiylhgxfvhbkftbx.supabase.co/rest/v1';
const ANON = 'sb_publishable_4tlFDcDCPj4lfV92NARBLg_VdBLPInr';
const SITE = 'https://kounkour.com';
const GRAPH = 'https://graph.facebook.com/v26.0';
const KEY = process.env.RADAR_KEY;
const PW = existsSync('/opt/node22/lib/node_modules/playwright/index.mjs') ? '/opt/node22/lib/node_modules/playwright/index.mjs' : 'playwright';

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' });
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
const dateFr = (d) => { const [y, m, j] = d.split('-').map(Number); return `${j} ${MOIS[m - 1]} ${y}`; };
const dateAr = (d) => { const [y, m, j] = d.split('-').map(Number); return `${j} ${MOIS_AR[m - 1]} ${y}`; };
const daysLeft = (d) => Math.round((Date.parse(d) - Date.parse(today)) / 86400000);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function rest(path, robot = false, body) {
  const headers = { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' };
  if (robot) headers['x-radar-key'] = KEY;
  const r = await fetch(URL + path, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${path} → ${r.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}

// ---------------------------------------------------------------------------
// Choix des concours
// ---------------------------------------------------------------------------
const COLS = 'id,slug,title_fr,title_ar,deadline_date,published_at,positions,diploma_fr,region_fr,status,administrations(name_fr,name_ar,logo_url)';
async function pick(kind, n) {
  const posted = new Set(await rest('/rpc/social_posted', true, { p_kind: kind }));
  const open = await rest(`/contests?select=${COLS}&status=in.(publie,mis_a_jour)&deadline_date=gte.${today}&limit=1000`);
  let list;
  if (kind === 'nouveau') {
    const since = Date.now() - 36 * 3600000;
    list = open.filter((c) => c.published_at && Date.parse(c.published_at) >= since && daysLeft(c.deadline_date) >= 3);
  } else {
    list = open.filter((c) => { const d = daysLeft(c.deadline_date); return d >= 0 && d <= 2; });
  }
  return list.filter((c) => !posted.has(c.id)).sort((a, b) => (b.positions || 0) - (a.positions || 0)).slice(0, n);
}

// ---------------------------------------------------------------------------
// Image
// ---------------------------------------------------------------------------
async function dataUri(url) {
  if (!url) return null;
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!r.ok) return null;
    const type = r.headers.get('content-type') || 'image/png';
    if (!type.startsWith('image/')) return null;
    return `data:${type};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
  } catch {
    return null;
  }
}
// Sans logo officiel : le sigle entre parenthèses (« (ONMT) »), sinon les initiales des mots principaux.
const initials = (name) => {
  const sigle = (name || '').match(/\(([A-Z][A-Z0-9-]{1,7})\)/);
  if (sigle) return sigle[1];
  return (name || '').replace(/\(.*?\)/g, '').split(/[\s'’-]+/).filter((w) => w.length > 1 && !/^(de|des|du|la|le|les|et|pour|au|aux|l|d)$/i.test(w)).slice(0, 4).map((w) => w[0].toUpperCase()).join('');
};

const BADGE = { nouveau: 'NOUVEAU CONCOURS', dernier: 'DERNIERS JOURS' };
function html(c, kind, logo) {
  const org = c.administrations?.name_fr || '';
  const tpl = join(HERE, 'templates', `${kind}.png`);
  const bg = existsSync(tpl) ? `url('file://${tpl}') center/cover no-repeat` : 'linear-gradient(160deg,#2A0B1C 0%,#8D174B 55%,#5A0F31 100%)';
  const d = daysLeft(c.deadline_date);
  const deadline = kind === 'dernier' ? (d <= 0 ? "Aujourd'hui" : d === 1 ? 'Demain' : `Dans ${d} jours`) : dateFr(c.deadline_date);
  const title = c.title_fr || '';
  const size = title.length > 95 ? 50 : title.length > 70 ? 58 : 66;
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file://${join(HERE, 'fonts', 'fonts.css')}"><style>
*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;font-family:'Plus Jakarta Sans',sans-serif;background:${bg};color:#fff;position:relative;overflow:hidden}
.pattern{position:absolute;inset:0;opacity:.07;background-image:url("data:image/svg+xml,%3Csvg width='96' height='96' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-width='0.9'%3E%3Cpath d='M24 0 L29 19 L48 24 L29 29 L24 48 L19 29 L0 24 L19 19 Z'/%3E%3Ccircle cx='24' cy='24' r='4'/%3E%3C/g%3E%3C/svg%3E");background-size:96px 96px}
.top{position:absolute;top:64px;left:72px;right:72px;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:18px;font-weight:800;font-size:44px;letter-spacing:-.5px}
.k{width:72px;height:72px;border-radius:20px;background:#fff;color:#8B174B;display:flex;align-items:center;justify-content:center;font-size:46px;font-weight:800;position:relative}
.k:after{content:'';position:absolute;top:9px;right:9px;width:14px;height:14px;border-radius:50%;background:#F4C2D7}
.badge{background:${kind === 'dernier' ? '#FFD166' : '#fff'};color:${kind === 'dernier' ? '#5A0F31' : '#8D174B'};font-weight:800;font-size:28px;letter-spacing:2px;padding:16px 26px;border-radius:999px}
.card{position:absolute;left:72px;right:72px;top:210px;background:#fff;color:#242126;border-radius:44px;padding:56px 56px 48px;box-shadow:0 30px 80px rgba(0,0,0,.25)}
.org{display:flex;align-items:center;gap:28px;padding-bottom:36px;border-bottom:3px solid #F1E5EC}
.logo{width:150px;height:150px;border-radius:30px;border:3px solid #F1E5EC;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;background:#fff}
.logo img{max-width:124px;max-height:124px;object-fit:contain}
.logo .ini{font-size:46px;letter-spacing:-1px;font-weight:800;color:#8D174B}
.orgname{font-size:32px;font-weight:700;color:#6E6773;line-height:1.25;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
h1{margin-top:40px;font-size:${size}px;line-height:1.14;font-weight:800;color:#8D174B;letter-spacing:-1px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.stats{display:flex;gap:24px;margin-top:44px}
.stat{flex:1;background:#FDF2F7;border-radius:28px;padding:28px 30px}
.stat .l{font-size:26px;font-weight:700;color:#6E6773}
.stat .v{font-size:56px;font-weight:800;color:#242126;margin-top:6px;line-height:1.05}
.stat.hot{background:${kind === 'dernier' ? '#FFF4D6' : '#FDF2F7'}}
.bottom{position:absolute;left:72px;right:72px;bottom:70px;text-align:center}
.cta{font-size:36px;font-weight:800}
.url{display:inline-block;margin-top:22px;background:#fff;color:#8D174B;font-size:40px;font-weight:800;padding:20px 46px;border-radius:999px}
.ar{font-family:'Alexandria',sans-serif;direction:rtl;font-size:30px;font-weight:700;opacity:.9;margin-top:18px}
</style></head><body><div class="pattern"></div>
<div class="top"><div class="brand"><div class="k">K</div>KounKour</div><div class="badge">${BADGE[kind]}</div></div>
<div class="card">
  <div class="org"><div class="logo">${logo ? `<img src="${logo}">` : `<span class="ini">${esc(initials(org) || 'K')}</span>`}</div><div class="orgname">${esc(org)}</div></div>
  <h1>${esc(title)}</h1>
  <div class="stats">
    <div class="stat"><div class="l">Postes</div><div class="v">${c.positions ? c.positions : '—'}</div></div>
    <div class="stat hot"><div class="l">Date limite</div><div class="v" style="font-size:${deadline.length > 12 ? 44 : 56}px">${esc(deadline)}</div></div>
  </div>
</div>
<div class="bottom"><div class="cta">Conditions, dossier et préparation gratuite</div><div class="url">kounkour.com</div><div class="ar">الشروط والملف والتحضير المجاني</div></div>
</body></html>`;
}

function caption(c, kind) {
  const org = c.administrations?.name_fr || '';
  const url = `${SITE}/concours/${c.slug}?utm_source=facebook&utm_medium=social&utm_campaign=${kind}`;
  const d = daysLeft(c.deadline_date);
  const head = kind === 'dernier'
    ? `⏰ ${d <= 0 ? "Dernier jour aujourd'hui" : d === 1 ? 'Clôture demain' : `Plus que ${d} jours`} pour postuler !`
    : '📢 Nouveau concours';
  const lines = [
    head,
    '',
    `📌 ${c.title_fr}`,
    org ? `🏛️ ${org}` : '',
    c.positions ? `👥 ${c.positions} poste${c.positions > 1 ? 's' : ''}` : '',
    c.diploma_fr ? `🎓 ${c.diploma_fr.length > 140 ? c.diploma_fr.slice(0, 139) + '…' : c.diploma_fr}` : '',
    `⏳ Date limite : ${dateFr(c.deadline_date)}`,
    '',
    `👉 Conditions, pièces du dossier et préparation gratuite : ${url}`,
    '',
    // Arabe : titre arabe de la fiche s'il existe, sinon l'organisme et le nombre de postes (jamais de traduction inventée).
    `🇲🇦 ${kind === 'dernier' ? 'آخر الأيام للترشح' : 'مباراة جديدة'} : ${c.title_ar || [c.administrations?.name_ar || c.administrations?.name_fr, c.positions ? `${c.positions} ${c.positions > 10 ? 'منصبا' : 'مناصب'}` : ''].filter(Boolean).join(' – ')}`,
    `⏳ آخر أجل : ${dateAr(c.deadline_date)}`,
    '',
    '#concours #emploi #Maroc #emploipublic #مباراة #توظيف #KounKour',
  ];
  return lines.filter((l, i, a) => l !== '' || (a[i - 1] !== '' && i > 0)).join('\n');
}

async function render(items, outDir) {
  const { chromium } = await import(PW);
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const res = [];
  for (const { c, kind } of items) {
    const logo = await dataUri(c.administrations?.logo_url);
    const f = join(outDir, `${kind}-${c.slug.slice(0, 60)}`);
    writeFileSync(`${f}.html`, html(c, kind, logo));
    await page.goto(`file://${resolve(f)}.html`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${f}.png` });
    writeFileSync(`${f}.txt`, caption(c, kind));
    res.push({ c, kind, png: `${f}.png`, text: caption(c, kind) });
  }
  await b.close();
  return res;
}

async function publish(item, secret) {
  const fd = new FormData();
  fd.append('source', new Blob([readFileSync(item.png)], { type: 'image/png' }), 'post.png');
  fd.append('message', item.text);
  fd.append('access_token', secret.token);
  const r = await fetch(`${GRAPH}/${secret.page_id}/photos`, { method: 'POST', body: fd });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  await rest('/rpc/social_record', true, { p_contest: item.c.id, p_kind: item.kind, p_post: j.post_id || j.id });
  return j.post_id || j.id;
}

const [cmd, a1, a2] = process.argv.slice(2);
if (!KEY) {
  console.error('RADAR_KEY manquante');
  process.exit(1);
}
if (cmd !== 'apercu' && cmd !== 'publier') {
  console.error('usage : post.mjs apercu [n] [dossier] | publier [n]');
  process.exit(1);
}
const n = Math.max(1, Math.min(10, Number(a1) || 3));
const outDir = a2 || join(HERE, '..', '..', '.social-out');
mkdirSync(outDir, { recursive: true });
// Priorité aux derniers jours (1 au plus), puis les nouveaux concours.
// SOCIAL_SLUG=<slug> : un seul concours précis (post de test).
const only = process.env.SOCIAL_SLUG;
let items;
if (only) {
  const [c] = await rest(`/contests?select=${COLS}&slug=eq.${encodeURIComponent(only)}`);
  if (!c) throw new Error(`concours introuvable : ${only}`);
  items = [{ c, kind: daysLeft(c.deadline_date) <= 2 ? 'dernier' : 'nouveau' }];
} else {
  const last = await pick('dernier', 1);
  const fresh = await pick('nouveau', n - last.length);
  items = [...last.map((c) => ({ c, kind: 'dernier' })), ...fresh.map((c) => ({ c, kind: 'nouveau' }))];
}
const done = await render(items, outDir);
if (cmd === 'apercu') {
  console.log(JSON.stringify(done.map((x) => ({ type: x.kind, concours: x.c.title_fr, image: x.png })), null, 2));
} else {
  const secret = await rest('/rpc/social_secret', true, {});
  const out = [];
  for (const x of done) {
    try {
      out.push({ type: x.kind, concours: x.c.title_fr, post: await publish(x, secret) });
    } catch (e) {
      out.push({ type: x.kind, concours: x.c.title_fr, erreur: String(e.message || e) });
    }
  }
  console.log(JSON.stringify(out, null, 2));
}
