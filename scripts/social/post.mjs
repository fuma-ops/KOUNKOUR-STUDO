// Posts Facebook de la page KounKour : image au modèle KounKour (texte et logo de l'organisme
// posés sur le fond) + texte du post, à partir des vraies données des fiches.
//
//   RADAR_KEY=… node scripts/social/post.mjs apercu [max] [dossier]   images, textes et reel ; rien n'est publié
//   RADAR_KEY=… node scripts/social/post.mjs publier [max]            publie sur la page (jamais deux fois)
//
// Le programme du jour (une seule commande, lancée chaque jour vers 10 h) — choix du propriétaire
// du 05/11/2026 : les reels rapportent plus de vues que les images, on garde l'image seulement
// pour les listes et résultats.
//   « nouveau »      un REEL par concours publié depuis moins de 72 h (récapitulatif par organisme
//                    dès 3 concours) : photo du métier, postes, date limite, une vraie question de
//                    préparation dont la réponse s'affiche, puis kounkour.com ;
//   « dernier »      un REEL pour les concours qui ferment dans 0 à 2 jours (2 au plus) ;
//   « preparation »  un REEL question du jour pour un gros concours ouvert (1 par jour) ;
//   « liste »        une IMAGE par nouvelle liste de convoqués (écrit, oral) ou de résultats ;
//   « reel »         la vidéo « Concours du jour », à 18 h.
// Créneaux (heure du Maroc, demandés par le propriétaire) : 12 h–14 h et 18 h–20 h, toutes les
// 10 minutes ; au-delà, 20 h–22 h. SOCIAL_REELS_MAX (défaut 12) plafonne les reels du jour.
// Les vidéos du jour sont listées dans <dossier>/tiktok-<date>.json pour l'envoi TikTok de 11 h.
// SOCIAL_SLUG=<slug> : un seul post « nouveau » pour ce concours (test). SOCIAL_REEL=0 : sans reel.
// Fonds personnalisés : déposer scripts/social/templates/<type>.png (1080 × 1350).
import { mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { prepFolderSlugsFor } from '../../src/utils/prepMatch.ts';
import { withTrack, TRACK_CREDIT } from './sounds.mjs';
import { keywordsFor } from './keywords.mjs';
import { themedHtml, backgroundFor } from './themes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const URL = 'https://aqnxeiylhgxfvhbkftbx.supabase.co/rest/v1';
const ANON = 'sb_publishable_4tlFDcDCPj4lfV92NARBLg_VdBLPInr';
const SITE = 'https://kounkour.com';
const GRAPH = 'https://graph.facebook.com/v26.0';
const RUPLOAD = 'https://rupload.facebook.com/video-upload/v26.0';
const KEY = process.env.RADAR_KEY;
const PW = existsSync('/opt/node22/lib/node_modules/playwright/index.mjs') ? '/opt/node22/lib/node_modules/playwright/index.mjs' : 'playwright';
const TZ = 'Africa/Casablanca';

const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
const dateFr = (d) => { const [y, m, j] = d.split('-').map(Number); return `${j} ${MOIS[m - 1]} ${y}`; };
const dateAr = (d) => { const [y, m, j] = d.split('-').map(Number); return `${j} ${MOIS_AR[m - 1]} ${y}`; };
const localDay = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
const daysLeft = (d) => Math.round((Date.parse(d) - Date.parse(today)) / 86400000);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const cut = (s, n) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s || '');
const link = (path, campaign) => `${SITE}${path}?utm_source=facebook&utm_medium=social&utm_campaign=${campaign}`;
// Petit hachage stable : la même fiche donne toujours la même question d'exemple.
const hash = (s) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

async function rest(path, robot = false, body) {
  const headers = { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' };
  if (robot) headers['x-radar-key'] = KEY;
  const r = await fetch(URL + path, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${path} → ${r.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}
const posted = async (kind) => new Set(await rest('/rpc/social_posted', true, { p_kind: kind }));

// ---------------------------------------------------------------------------
// Choix du jour
// ---------------------------------------------------------------------------
const COLS = 'id,slug,title_fr,title_ar,deadline_date,exam_date,published_at,positions,diploma_fr,grade_fr,region_fr,status,administrations(name_fr,name_ar,logo_url)';
// 72 h : ce qui n'a pas trouvé de place un jour passe le lendemain (rien n'est publié deux fois).
const SINCE = Date.now() - 72 * 3600000;
let openCache;
const openContests = async () => (openCache ??= await rest(`/contests?select=${COLS}&status=in.(publie,mis_a_jour)&deadline_date=gte.${today}&limit=1000`));

async function pickContests(kind, n) {
  const done = await posted(kind);
  const open = await openContests();
  const list = kind === 'nouveau'
    ? open.filter((c) => c.published_at && Date.parse(c.published_at) >= SINCE && daysLeft(c.deadline_date) >= 3)
    : open.filter((c) => { const d = daysLeft(c.deadline_date); return d >= 0 && d <= 2; });
  const todo = list.filter((c) => !done.has(c.id)).sort((a, b) => (b.positions || 0) - (a.positions || 0));
  if (kind !== 'nouveau') return todo.slice(0, n).map((c) => ({ kind, c, key: c.id }));
  return byOrg(todo.map((c) => ({ c, key: c.id })), (x) => x.c.administrations?.name_fr || x.c.id)
    .map((g) => (g.length >= 3 ? { kind, c: g[0].c, group: g, key: g[0].key, keys: g.map((x) => x.key) } : g.map((x) => ({ kind, ...x })))).flat().slice(0, n);
}
// Un organisme qui publie 3 concours (ou 3 listes du même type) ou plus : un seul post récapitulatif.
function byOrg(rows, keyOf) {
  const groups = new Map();
  for (const r of rows) {
    const k = keyOf(r);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  return [...groups.values()];
}

// Listes : la clé de dédoublonnage est l'id du document (une liste n'est annoncée qu'une fois).
const LIST = {
  convoques_ecrit: { badge: 'CONVOQUÉS À L’ÉCRIT', fr: '📋 Liste des convoqués à l’écrit publiée', ar: 'لائحة المدعوين لاجتياز الاختبار الكتابي', plural: 'listes de convoqués à l’écrit', arPlural: 'لوائح المدعوين لاجتياز الاختبار الكتابي', cta: 'Vérifiez si votre nom figure sur la liste' },
  convoques_oral: { badge: 'CONVOQUÉS À L’ORAL', fr: '🎤 Liste des convoqués à l’oral publiée', ar: 'لائحة المدعوين لاجتياز الاختبار الشفوي', plural: 'listes de convoqués à l’oral', arPlural: 'لوائح المدعوين لاجتياز الاختبار الشفوي', cta: 'Vérifiez si votre nom figure sur la liste' },
  resultats: { badge: 'RÉSULTATS', fr: '🏆 Résultats publiés', ar: 'نتائج المباراة', plural: 'listes de résultats', arPlural: 'لوائح النتائج', cta: 'Consultez la liste des admis' },
};
async function pickLists(n) {
  const done = await posted('liste');
  const docs = await rest(`/contest_documents?select=id,contest_id,doc_type,title_fr,title_ar,created_at&doc_type=in.(${Object.keys(LIST).join(',')})&created_at=gte.${new Date(SINCE).toISOString()}&order=created_at.asc&limit=200`);
  const fresh = docs.filter((d) => !done.has(d.id));
  if (!fresh.length) return [];
  const ids = [...new Set(fresh.map((d) => d.contest_id))];
  const contests = await rest(`/contests?select=${COLS}&id=in.(${ids.join(',')})`);
  const byId = new Map(contests.map((c) => [c.id, c]));
  const rows = fresh.filter((x) => byId.has(x.contest_id)).map((d) => ({ doc: d, c: byId.get(d.contest_id) }));
  const out = [];
  for (const g of byOrg(rows, (x) => `${x.c.administrations?.name_fr || x.c.id}|${x.doc.doc_type}`)) {
    if (g.length >= 3) out.push({ kind: 'liste', c: g[0].c, doc: g[0].doc, group: g, key: g[0].doc.id, keys: g.map((x) => x.doc.id) });
    else for (const x of g) out.push({ kind: 'liste', c: x.c, doc: x.doc, key: x.doc.id });
  }
  return out.slice(0, n);
}

// Préparation : dossiers reliés au concours (mêmes règles que la fiche) qui ont des QCM.
async function prepData() {
  const folders = await rest('/qcm_folders?select=slug,title_fr,match_terms&status=eq.published');
  const sets = await rest('/qcm_sets?select=id,slug,folder_slug,kind,title_fr,concours_label,exam_year,qcm_questions(id,question,options)&status=eq.published&limit=3000');
  const bySlug = {};
  for (const s of sets) if (s.folder_slug) (bySlug[s.folder_slug] ??= []).push(s);
  return { folders, bySlug };
}
// Question lisible sur une image : texte court, 3 à 5 options courtes, pas de figure.
// Hauteur estimée (px) dans le cadre de l'image : on ne garde que ce qui tient sans être coupé.
const quizHeight = (q) => 44 + Math.ceil(q.question.length / 44) * 44 + q.options.reduce((t, o) => t + 32 + Math.ceil(o.length / 52) * 33, 0);
const readable = (q) => q.question && q.question.length <= 180 && !/[\[\]{}<>]|figure|ci-dessous|ci-contre|tableau|schéma|image|graphique/i.test(q.question)
  && Array.isArray(q.options) && q.options.length >= 3 && q.options.length <= 5 && q.options.every((o) => typeof o === 'string' && o.length > 0 && o.length <= 100 && !/[\[\]{}<>]/.test(o))
  && quizHeight(q) <= 400;
function prepFor(c, data) {
  const slugs = prepFolderSlugsFor({ title: c.title_fr, grade: c.grade_fr, admin: c.administrations?.name_fr }, data.folders.map((f) => ({ slug: f.slug, matchTerms: f.match_terms })));
  for (const slug of slugs) {
    const sets = (data.bySlug[slug] || []).filter((s) => s.qcm_questions?.length);
    if (!sets.length) continue;
    // Anciens concours d'abord (plus parlant), sinon entraînement.
    const pool = (k) => sets.filter((s) => s.kind === k).flatMap((s) => s.qcm_questions.filter(readable).map((q) => ({ q, s })));
    const cands = pool('annales').length ? pool('annales') : [...pool('entrainement'), ...pool('sujet')];
    if (!cands.length) continue;
    const pick = cands[hash(c.id) % cands.length];
    const all = data.bySlug[slug] || [];
    return {
      folder: data.folders.find((f) => f.slug === slug),
      question: pick.q,
      set: pick.s,
      nQcm: sets.length,
      nQuestions: sets.reduce((t, s) => t + s.qcm_questions.length, 0),
      nSujets: all.filter((s) => s.kind === 'sujet').length,
    };
  }
  return null;
}
async function pickPrep(n, exclude) {
  const done = await posted('preparation');
  const data = await prepData();
  const out = [];
  // Concours qui laissent le temps de réviser, les plus gros recrutements d'abord.
  const open = (await openContests()).filter((c) => !done.has(c.id) && !exclude.has(c.id) && daysLeft(c.deadline_date) >= 3)
    .sort((a, b) => (b.positions || 0) - (a.positions || 0));
  for (const c of open) {
    if (out.length >= n) break;
    const prep = prepFor(c, data);
    if (prep) out.push({ kind: 'preparation', c, prep, key: c.id });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------
async function dataUri(url) {
  if (!url) return null;
  try {
    // logo_url est relatif au site (« /api/logo?a=<organisme> ») : on le résout sur kounkour.com.
    const r = await fetch(new globalThis.URL(url, SITE), { headers: { 'user-agent': 'Mozilla/5.0' } });
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
  return (name || '').replace(/\(.*?\)/g, '').split(/[^A-Za-zÀ-ÿ0-9]+/).filter((w) => w.length > 1 && !/^(de|des|du|la|le|les|et|pour|au|aux|l|d)$/i.test(w)).slice(0, 4).map((w) => w[0].toUpperCase()).join('');
};
const logoBox = (org, logo) => `<div class="logo">${logo ? `<img src="${logo}">` : `<span class="ini">${esc(initials(org) || 'K')}</span>`}</div>`;
const PATTERN = `url("data:image/svg+xml,%3Csvg width='96' height='96' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-width='0.9'%3E%3Cpath d='M24 0 L29 19 L48 24 L29 29 L24 48 L19 29 L0 24 L19 19 Z'/%3E%3Ccircle cx='24' cy='24' r='4'/%3E%3C/g%3E%3C/svg%3E")`;
const BASE_CSS = `*{box-sizing:border-box;margin:0}
.pattern{position:absolute;inset:0;opacity:.07;background-image:${PATTERN};background-size:96px 96px}
.brand{display:flex;align-items:center;gap:18px;font-weight:800;font-size:44px;letter-spacing:-.5px}
.k{width:72px;height:72px;border-radius:20px;background:#fff;color:#8B174B;display:flex;align-items:center;justify-content:center;font-size:46px;font-weight:800;position:relative}
.k:after{content:'';position:absolute;top:9px;right:9px;width:14px;height:14px;border-radius:50%;background:#F4C2D7}
.logo{width:150px;height:150px;border-radius:30px;border:3px solid #F1E5EC;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;background:#fff}
.logo img{max-width:124px;max-height:124px;object-fit:contain}
.logo .ini{font-size:46px;letter-spacing:-1px;font-weight:800;color:#8D174B}
.ar{font-family:'Alexandria',sans-serif;direction:rtl}`;

// Couleurs du badge par type de post.
const THEME = {
  nouveau: { badge: 'NOUVEAU CONCOURS', bg: '#fff', fg: '#8D174B', soft: '#FDF2F7' },
  dernier: { badge: 'DERNIERS JOURS', bg: '#FFD166', fg: '#5A0F31', soft: '#FFF4D6' },
  liste: { bg: '#B9F3D0', fg: '#0B4A2B', soft: '#E9FBF1' },
  preparation: { badge: 'PRÉPARATION GRATUITE', bg: '#C9E3FF', fg: '#0D3A6B', soft: '#EEF6FF' },
};

function html(item, logo, idx = 0) {
  const { c, kind } = item;
  const th = THEME[kind];
  const badge = kind === 'liste' ? LIST[item.doc.doc_type].badge : item.group ? 'NOUVEAUX CONCOURS' : th.badge;
  const org = c.administrations?.name_fr || '';
  const tpl = join(HERE, 'templates', `${kind}.png`);
  const bg = existsSync(tpl) ? `url('file://${tpl}') center/cover no-repeat` : 'linear-gradient(160deg,#2A0B1C 0%,#8D174B 55%,#5A0F31 100%)';
  const dense = kind === 'preparation' || !!item.group;
  const title = item.group ? `${item.group.length} ${kind === 'liste' ? LIST[item.doc.doc_type].plural : 'nouveaux concours'}` : c.title_fr || '';
  let body, cta, ctaAr;
  if (item.group) {
    const rows = item.group.slice(0, 5).map((x) => `<div class="opt"><b>✓</b><span>${esc(x.c.title_fr.replace(/ – [^–]*$/, ''))}</span></div>`).join('');
    const what = kind === 'liste' ? 'liste' : 'concours';
    const more = item.group.length > 5 ? `<div class="tag" style="margin-top:16px">+ ${item.group.length - 5} autre${item.group.length > 6 ? 's' : ''} ${what}${item.group.length > 6 && what === 'liste' ? 's' : ''}</div>` : '';
    const sum = kind === 'nouveau' ? item.group.reduce((t, x) => t + (x.c.positions || 0), 0) : 0;
    body = `<h1 style="font-size:50px;-webkit-line-clamp:2;margin-top:30px">${esc(title)}${sum ? ` · ${sum} postes` : ''}</h1><div class="quiz">${rows}${more}</div>`;
    cta = kind === 'liste' ? LIST[item.doc.doc_type].cta : 'Conditions, dossier et préparation gratuite';
    ctaAr = kind === 'liste' ? 'تحقق من اسمك في اللائحة' : 'الشروط والملف والتحضير المجاني';
  } else if (kind === 'preparation') {
    const { question, set } = item.prep;
    const tag = set.kind === 'annales' ? `Question d’un ancien concours${set.exam_year ? ` (${set.exam_year})` : ''}` : 'Question d’entraînement · pas un sujet officiel';
    const qSize = 36;
    body = `<h1 style="font-size:${title.length > 80 ? 38 : 44}px;-webkit-line-clamp:2;margin-top:30px">${esc(title)}</h1>
  <div class="quiz"><div class="tag">🧠 ${esc(tag)}</div><div class="q" style="font-size:${qSize}px">${esc(question.question)}</div>
  ${question.options.map((o, i) => `<div class="opt two"><b>${'ABCDE'[i]}</b><span>${esc(o)}</span></div>`).join('')}</div>`;
    cta = 'La réponse + QCM corrigés gratuits';
    ctaAr = 'الجواب وأسئلة مصححة مجانا';
  } else {
    const size = title.length > 95 ? 50 : title.length > 70 ? 58 : 66;
    let stat2L, stat2V;
    if (kind === 'liste') {
      const exam = item.doc.doc_type !== 'resultats' && c.exam_date && c.exam_date >= today ? c.exam_date : null;
      stat2L = exam ? 'Date de l’épreuve' : 'Publiée le';
      stat2V = dateFr(exam || localDay(item.doc.created_at)).replace(/ \d{4}$/, '');
    } else {
      stat2L = 'Date limite';
      // Toujours la date exacte, jamais « aujourd'hui / demain » (consigne du propriétaire, 04/11/2026).
      stat2V = dateFr(c.deadline_date);
    }
    body = `<h1 style="font-size:${size}px">${esc(title)}</h1>
  <div class="stats">
    <div class="stat"><div class="l">Postes</div><div class="v">${c.positions ? c.positions : '—'}</div></div>
    <div class="stat hot"><div class="l">${esc(stat2L)}</div><div class="v" style="font-size:${stat2V.length > 12 ? 44 : 56}px">${esc(stat2V)}</div></div>
  </div>`;
    cta = kind === 'liste' ? LIST[item.doc.doc_type].cta : 'Conditions, dossier et préparation gratuite';
    ctaAr = kind === 'liste' ? 'تحقق من اسمك في اللائحة' : 'الشروط والملف والتحضير المجاني';
    // Posts d'un seul concours : un des 6 designs « photo en fond », à tour de rôle (choix du propriétaire, 04/11/2026).
    return themedHtml(idx, { badge, title, org, logo: logoBox(org, logo), postes: c.positions || null, stat2L, stat2V, cta, ctaAr,
      bg: backgroundFor(`${c.title_fr || ''} ${c.grade_fr || ''} ${org}`), fontsCss: join(HERE, 'fonts', 'fonts.css') });
  }
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file://${join(HERE, 'fonts', 'fonts.css')}"><style>
${BASE_CSS}
body{width:1080px;height:1350px;font-family:'Plus Jakarta Sans',sans-serif;background:${bg};color:#fff;position:relative;overflow:hidden}
.top{position:absolute;top:64px;left:72px;right:72px;display:flex;align-items:center;justify-content:space-between}
.badge{background:${th.bg};color:${th.fg};font-weight:800;font-size:${badge.length > 18 ? 24 : 28}px;letter-spacing:2px;padding:16px 26px;border-radius:999px}
.card{position:absolute;left:72px;right:72px;top:210px;background:#fff;color:#242126;border-radius:44px;padding:${kind === 'preparation' ? '44px 50px 40px' : '56px 56px 48px'};box-shadow:0 30px 80px rgba(0,0,0,.25)}
.org{display:flex;align-items:center;gap:28px;padding-bottom:${kind === 'preparation' ? 26 : 36}px;border-bottom:3px solid #F1E5EC}
.orgname{font-size:${dense ? 28 : 32}px;font-weight:700;color:#6E6773;line-height:1.25;display:-webkit-box;-webkit-line-clamp:${dense ? 2 : 3};-webkit-box-orient:vertical;overflow:hidden}
h1{margin-top:40px;line-height:1.14;font-weight:800;color:#8D174B;letter-spacing:-1px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.stats{display:flex;gap:24px;margin-top:44px}
.stat{flex:1;background:#FDF2F7;border-radius:28px;padding:28px 30px}
.stat .l{font-size:26px;font-weight:700;color:#6E6773}
.stat .v{font-size:56px;font-weight:800;color:#242126;margin-top:6px;line-height:1.05}
.stat.hot{background:${th.soft}}
.quiz{margin-top:28px;background:${th.soft};border-radius:30px;padding:30px 32px}
.tag{font-size:24px;font-weight:800;color:${th.fg};letter-spacing:.3px}
.q{margin-top:14px;font-weight:800;line-height:1.22;color:#242126;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.opt{display:flex;align-items:center;gap:18px;margin-top:14px;background:#fff;border-radius:20px;padding:14px 20px;font-size:28px;font-weight:700;color:#3A3540}
.opt b{width:46px;height:46px;border-radius:14px;background:${th.fg};color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:24px}
.opt span{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.bottom{position:absolute;left:72px;right:72px;bottom:70px;text-align:center}
.cta{font-size:36px;font-weight:800}
.url{display:inline-block;margin-top:22px;background:#fff;color:#8D174B;font-size:40px;font-weight:800;padding:20px 46px;border-radius:999px}
.bottom .ar{font-size:30px;font-weight:700;opacity:.9;margin-top:18px}
${dense ? `.card{max-height:820px;overflow:hidden;padding:42px 48px 40px}.org{padding-bottom:24px}.logo{width:110px;height:110px;border-radius:24px}.logo img{max-width:90px;max-height:90px}.logo .ini{font-size:36px}
.quiz{margin-top:24px;padding:24px 28px}.opt{font-size:26px;padding:10px 18px;margin-top:12px}.opt b{width:40px;height:40px;font-size:22px}.opt.two span{-webkit-line-clamp:2;line-height:1.25}` : ''}
</style></head><body><div class="pattern"></div>
<div class="top"><div class="brand"><div class="k">K</div>KounKour</div><div class="badge">${esc(badge)}</div></div>
<div class="card">
  <div class="org">${logoBox(org, logo)}<div class="orgname">${esc(org)}</div></div>
  ${body}
</div>
<div class="bottom"><div class="cta">${esc(cta)}</div><div class="url">kounkour.com</div><div class="ar">${esc(ctaAr)}</div></div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Textes
// ---------------------------------------------------------------------------
// Mots-clés et hashtags selon le grade du concours (recherches réelles des candidats) : voir keywords.mjs.
// Appel à suivre la page (demande du propriétaire, 04/11/2026), juste avant les mots-clés.
const FOLLOW = '👍 تابعنا باش يوصلك الجديد ديال المباريات كل نهار';
const seo = (text, kind) => { const k = keywordsFor(text, kind); return `${FOLLOW}\n\n🔎 ${k.line}\n${k.tags}`; };
const tidy = (lines) => lines.filter((l, i, a) => l !== '' || (a[i - 1] !== '' && i > 0)).join('\n');
const arTitle = (c) => c.title_ar || [c.administrations?.name_ar || c.administrations?.name_fr, c.positions ? `${c.positions} ${c.positions > 10 ? 'منصبا' : 'مناصب'}` : ''].filter(Boolean).join(' – ');

function caption(item) {
  const { c, kind } = item;
  const org = c.administrations?.name_fr || '';
  if (item.group && kind === 'nouveau') {
    const sum = item.group.reduce((t, x) => t + (x.c.positions || 0), 0);
    return tidy([
      `📢 ${item.group.length} nouveaux concours${sum ? ` · ${sum} postes` : ''}`,
      org ? `🏛️ ${org}` : '',
      '',
      ...item.group.map((x) => `📌 ${cut(x.c.title_fr, 110)}\n⏳ Date limite : ${dateFr(x.c.deadline_date)}\n👉 ${SITE}/concours/${x.c.slug}`),
      '',
      `🇲🇦 ${item.group.length} مباريات جديدة – ${c.administrations?.name_ar || org}`,
      '',
      'Conditions, pièces du dossier et préparation gratuite sur kounkour.com',
      '',
      seo(item.group.map((x) => x.c.title_fr).join(' '), 'nouveau'),
    ]);
  }
  if (item.group) {
    const t = LIST[item.doc.doc_type];
    return tidy([
      `${t.fr.split(' ')[0]} Nouvelles listes : ${item.group.length} ${t.plural}`,
      org ? `🏛️ ${org}` : '',
      '',
      ...item.group.map((x) => `📌 ${cut(x.c.title_fr, 110)}\n👉 ${SITE}/concours/${x.c.slug}`),
      '',
      `🇲🇦 ${item.group.length} ${t.arPlural} – ${c.administrations?.name_ar || org}`,
      '',
      'Partagez avec les candidats concernés 🙏',
      '',
      seo(item.group.map((x) => x.c.title_fr).join(' '), 'liste'),
    ]);
  }
  if (kind === 'liste') {
    const t = LIST[item.doc.doc_type];
    const exam = item.doc.doc_type !== 'resultats' && c.exam_date && c.exam_date >= today ? c.exam_date : null;
    return tidy([
      t.fr,
      '',
      `📌 ${c.title_fr}`,
      org ? `🏛️ ${org}` : '',
      item.doc.title_fr ? `📄 ${item.doc.title_fr}` : '',
      exam ? `🗓️ Date de l’épreuve : ${dateFr(exam)}` : '',
      '',
      `👉 ${t.cta} : ${link(`/concours/${c.slug}`, `liste_${item.doc.doc_type}`)}`,
      '',
      `🇲🇦 ${item.doc.title_ar || t.ar} : ${arTitle(c)}`,
      '',
      'Partagez avec les candidats concernés 🙏',
      '',
      seo(`${c.title_fr} ${c.grade_fr || ''}`, 'liste'),
    ]);
  }
  if (kind === 'preparation') {
    const { question, set, folder, nQuestions, nQcm, nSujets } = item.prep;
    const offer = [`${nQuestions} questions QCM corrigées (${nQcm} série${nQcm > 1 ? 's' : ''})`, nSujets ? `${nSujets} concours blanc${nSujets > 1 ? 's' : ''} / sujet${nSujets > 1 ? 's' : ''} avec corrigé` : ''].filter(Boolean).join(' · ');
    return tidy([
      `📚 Préparation gratuite : ${c.title_fr}`,
      org ? `🏛️ ${org}` : '',
      `⏳ Date limite de candidature : ${dateFr(c.deadline_date)}`,
      '',
      `✅ Sur KounKour : ${offer}.`,
      '',
      set.kind === 'annales'
        ? `🧠 Question d’un ancien concours${set.concours_label ? ` (${set.concours_label}${set.exam_year ? `, ${set.exam_year}` : ''})` : ''} :`
        : '🧠 Question d’entraînement (exemple KounKour, ce n’est pas un sujet officiel) :',
      question.question,
      ...question.options.slice(0, 5).map((o, i) => `${'ABCDE'[i]}) ${o}`),
      '',
      '💬 Votre réponse en commentaire !',
      `👉 Correction expliquée et tous les QCM : ${link(`/preparation/${folder.slug}`, 'preparation')}`,
      '',
      `🇲🇦 تحضير مجاني للمباراة : ${arTitle(c)}`,
      'أسئلة QCM مصححة ومباريات تجريبية مجانا على KounKour',
      '',
      seo(`${c.title_fr} ${c.grade_fr || ''}`, 'preparation'),
    ]);
  }
  const d = daysLeft(c.deadline_date);
  const head = kind === 'dernier'
    ? `⏰ ${d <= 0 ? "Dernier jour aujourd'hui" : d === 1 ? 'Clôture demain' : `Plus que ${d} jours`} pour postuler !`
    : '📢 Nouveau concours';
  return tidy([
    head,
    '',
    `📌 ${c.title_fr}`,
    org ? `🏛️ ${org}` : '',
    c.positions ? `👥 ${c.positions} poste${c.positions > 1 ? 's' : ''}` : '',
    c.diploma_fr ? `🎓 ${cut(c.diploma_fr, 140)}` : '',
    `⏳ Date limite : ${dateFr(c.deadline_date)}`,
    '',
    `👉 Conditions, pièces du dossier et préparation gratuite : ${link(`/concours/${c.slug}`, kind)}`,
    '',
    // Arabe : titre arabe de la fiche s'il existe, sinon l'organisme et le nombre de postes (jamais de traduction inventée).
    `🇲🇦 ${kind === 'dernier' ? 'آخر الأيام للترشح' : 'مباراة جديدة'} : ${arTitle(c)}`,
    `⏳ آخر أجل : ${dateAr(c.deadline_date)}`,
    '',
    seo(`${c.title_fr} ${c.grade_fr || ''}`, kind),
  ]);
}

async function render(items, outDir, browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  const logos = new Map();
  let idx = Math.floor(Date.now() / 86400000); // le design change à chaque post et d'un jour à l'autre
  for (const item of items) {
    const url = item.c.administrations?.logo_url;
    if (!logos.has(url)) logos.set(url, await dataUri(url));
    const f = join(outDir, `${item.kind}-${item.c.slug.slice(0, 50)}-${item.key.slice(0, 6)}`);
    writeFileSync(`${f}.html`, html(item, logos.get(url), !item.group && item.kind !== 'preparation' ? idx++ : 0));
    await page.goto(`file://${resolve(f)}.html`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${f}.png` });
    item.png = `${f}.png`;
    item.text = caption(item);
    writeFileSync(`${f}.txt`, item.text);
  }
  await page.close();
  return items;
}

// ---------------------------------------------------------------------------
// Reel « Concours du jour » : 1080 × 1920, ~20 s, images calculées une à une puis ffmpeg.
// ---------------------------------------------------------------------------
const REEL_KEY = `00000000-0000-4000-8000-${today.replace(/-/g, '').padStart(12, '0')}`;
async function reel(items, outDir, browser) {
  // Les nouveaux concours du jour d'abord, sinon les plus gros recrutements encore ouverts.
  let picks = items.filter((x) => x.kind === 'nouveau').map((x) => x.c);
  if (picks.length < 3) {
    const more = (await openContests()).filter((c) => daysLeft(c.deadline_date) >= 2 && !picks.some((p) => p.id === c.id)).sort((a, b) => (b.positions || 0) - (a.positions || 0));
    picks = [...picks, ...more].slice(0, 5);
  }
  picks = picks.slice(0, 5);
  if (!picks.length) return null;
  const lists = items.filter((x) => x.kind === 'liste').reduce((t, x) => t + (x.keys?.length || 1), 0);
  const nOpen = (await openContests()).length;
  const cards = [];
  for (const c of picks) cards.push({ title: cut(c.title_fr, 110), org: c.administrations?.name_fr || '', logo: await dataUri(c.administrations?.logo_url), postes: c.positions || null, deadline: dateFr(c.deadline_date) });
  const dur = 2.6;
  const T = 2.4 + cards.length * dur + 3.2;
  const scene = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file://${join(HERE, 'fonts', 'fonts.css')}"><style>
${BASE_CSS}
body{width:1080px;height:1920px;font-family:'Plus Jakarta Sans',sans-serif;background:linear-gradient(165deg,#2A0B1C 0%,#8D174B 55%,#5A0F31 100%);color:#fff;position:relative;overflow:hidden}
.s{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 80px;opacity:0}
.top{position:absolute;top:110px;left:0;right:0;display:flex;justify-content:center}
.big{font-size:96px;font-weight:800;line-height:1.02;text-align:center;letter-spacing:-2px}
.sub{font-size:44px;font-weight:700;margin-top:34px;opacity:.9;text-align:center}
.pill{display:inline-block;margin-top:44px;background:#fff;color:#8D174B;font-size:38px;font-weight:800;padding:18px 40px;border-radius:999px}
.card{width:920px;background:#fff;color:#242126;border-radius:48px;padding:56px;box-shadow:0 40px 90px rgba(0,0,0,.3)}
.org{display:flex;align-items:center;gap:26px;padding-bottom:34px;border-bottom:3px solid #F1E5EC}
.orgname{font-size:32px;font-weight:700;color:#6E6773;line-height:1.25;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
h1{margin-top:38px;font-size:56px;line-height:1.14;font-weight:800;color:#8D174B;letter-spacing:-1px;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
.stats{display:flex;gap:22px;margin-top:40px}.stat{flex:1;background:#FDF2F7;border-radius:28px;padding:26px 28px}
.stat .l{font-size:26px;font-weight:700;color:#6E6773}.stat .v{font-size:46px;font-weight:800;margin-top:6px}
.num{position:absolute;top:300px;font-size:34px;font-weight:800;letter-spacing:3px;opacity:.85}
.bar{position:absolute;left:0;bottom:0;height:12px;background:#F4C2D7}
.s .ar{font-size:44px;font-weight:700;margin-top:30px;opacity:.9}
.cvb{font-size:60px;margin-bottom:46px}.cvb .k{width:96px;height:96px;font-size:62px;border-radius:26px}
.logos{display:flex;gap:22px;justify-content:center;margin-top:40px}.logos .logo{width:150px;height:150px;border-radius:32px;border:none;box-shadow:0 14px 34px rgba(0,0,0,.25)}
.logos .logo img{max-width:124px;max-height:124px}.logos .logo .ini{font-size:40px}
</style></head><body><div class="pattern"></div>
<div class="top"><div class="brand"><div class="k">K</div>KounKour</div></div>
<div class="s" id="s0"><div class="brand cvb"><div class="k">K</div>KounKour</div><div class="big">Les concours<br>du jour</div><div class="sub">${esc(dateFr(today))}</div>
<div class="logos">${cards.slice(0, 4).map((k) => logoBox(k.org, k.logo)).join('')}</div>
<div class="pill">${nOpen} concours ouverts${lists ? ` · ${lists} liste${lists > 1 ? 's' : ''} publiée${lists > 1 ? 's' : ''}` : ''}</div><div class="ar">مباريات اليوم</div></div>
${cards.map((k, i) => `<div class="s" id="s${i + 1}"><div class="num">${i + 1} / ${cards.length}</div><div class="card"><div class="org">${logoBox(k.org, k.logo)}<div class="orgname">${esc(k.org)}</div></div><h1>${esc(k.title)}</h1>
<div class="stats"><div class="stat"><div class="l">Postes</div><div class="v">${k.postes ?? '—'}</div></div><div class="stat"><div class="l">Date limite</div><div class="v">${esc(k.deadline.replace(/ \d{4}$/, ''))}</div></div></div></div></div>`).join('')}
<div class="s" id="s${cards.length + 1}"><div class="big" style="font-size:80px">Conditions, dossier<br>et préparation<br>gratuite</div><div class="pill" style="font-size:52px">kounkour.com</div><div class="ar">الشروط والملف والتحضير المجاني</div>
<div class="sub" style="font-size:36px">Ne ratez plus aucun concours : activez vos alertes</div><div class="ar" style="font-size:44px;margin-top:18px">👍 تابعنا باش يوصلك الجديد كل نهار</div></div>
<div class="bar" id="bar"></div>
<script>
const T=${T}, D=${dur}, N=${cards.length};
const ease=(x)=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3);
window.setT=(t)=>{
  const spans=[[0,2.4]];for(let i=0;i<N;i++)spans.push([2.4+i*D,2.4+(i+1)*D]);spans.push([2.4+N*D,T]);
  spans.forEach(([a,b],i)=>{const el=document.getElementById('s'+i);const inn=i===0?1:ease((t-a)/0.45), out=i===spans.length-1?0:ease((t-(b-0.35))/0.35);
    el.style.opacity=Math.max(0,inn-out);el.style.transform='translateY('+((1-inn)*90-out*60)+'px) scale('+(0.96+0.04*inn)+')';});
  document.getElementById('bar').style.width=(t/T*100)+'%';
  // Le logo du haut n'apparaît qu'après la couverture (elle a déjà le sien, au centre).
  document.querySelector('.top').style.opacity=ease((t-2.0)/0.4);
};
</script></body></html>`;
  const dir = join(outDir, 'reel-frames');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const f = join(outDir, `reel-${today}`);
  writeFileSync(`${f}.html`, scene);
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(`file://${resolve(f)}.html`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // Couverture (miniature) = première image : l'intro « Les concours du jour » complète.
  await page.evaluate(() => window.setT(0));
  await page.screenshot({ path: `${f}.cover.png` });
  const fps = 30;
  const frames = Math.round(T * fps);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.setT(t), i / fps);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 88 });
  }
  await page.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(dir, 'f%04d.jpg'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '20', '-movflags', '+faststart', `${f}-muet.mp4`]);
  // Fond sonore : le morceau choisi par le propriétaire (sounds.mjs).
  withTrack(`${f}-muet.mp4`, `${f}.mp4`, T);
  rmSync(`${f}-muet.mp4`, { force: true });
  rmSync(dir, { recursive: true, force: true });
  const text = tidy([
    `🎬 Les concours du jour – ${dateFr(today)}`,
    '',
    ...picks.map((c) => `📌 ${cut(c.title_fr, 90)} – date limite ${dateFr(c.deadline_date)}`),
    '',
    `👉 ${nOpen} concours ouverts, conditions et préparation gratuite : ${link('/', 'reel')}`,
    '🇲🇦 مباريات اليوم : الشروط والملف والتحضير المجاني على KounKour',
    '',
    TRACK_CREDIT,
    '',
    seo(picks.map((c) => c.title_fr).join(' '), 'reel'),
  ]);
  writeFileSync(`${f}.txt`, text);
  return { kind: 'reel', key: REEL_KEY, mp4: `${f}.mp4`, cover: `${f}.cover.png`, text };
}

// ---------------------------------------------------------------------------
// Reel par concours (1080 × 1920, ~15 s) : photo du métier + gros titre, une vraie question de
// préparation (réponse révélée), puis kounkour.com. Mêmes données que la fiche, rien d'inventé.
// ---------------------------------------------------------------------------
const REEL_FPS = 24;
const TAGS = { nouveau: '📢 مباراة جديدة', dernier: '⏳ آخر الأيام للترشح', preparation: '📚 تحضير مجاني' };
async function contestReel(item, outDir, browser, data) {
  const { c, kind, group } = item;
  const org = c.administrations?.name_fr || '';
  const orgAr = c.administrations?.name_ar || '';
  const logo = await dataUri(c.administrations?.logo_url);
  const bg = backgroundFor(`${c.title_fr || ''} ${c.grade_fr || ''} ${org}`);
  const prep = group ? null : item.prep || prepFor(c, data);
  const q = prep?.question;
  // Bonne(s) réponse(s) : la correction du site (qcm_submit_v2), comme quand un candidat valide.
  let right = [];
  if (q) {
    try {
      const corr = await rest('/rpc/qcm_submit_v2', false, { p_set_id: prep.set.id, p_answers: {} });
      const row = (corr || []).find((r) => r.question_id === q.id);
      right = (row?.correct_indexes || []).filter((i) => Number.isInteger(i) && i >= 0 && i < q.options.length);
    } catch { right = []; }
  }
  const quiz = q && right.length ? { q, right, set: prep.set } : null;
  const postes = group ? group.reduce((t, x) => t + (x.c.positions || 0), 0) : c.positions;
  const title = group ? `${group.length} مباريات جديدة · ${orgAr || org}` : c.title_fr;
  const tsize = (t) => (t.length > 95 ? 46 : t.length > 70 ? 52 : t.length > 45 ? 60 : 70);
  const tag = group ? '📢 مباريات جديدة' : TAGS[kind];
  const deadlineLine = group ? '' : `⏳ آخر أجل للترشيح: ${dateAr(c.deadline_date)}`;
  const quizHead = quiz ? (quiz.set.kind === 'annales' ? `🧠 سؤال من مباراة سابقة${quiz.set.exam_year ? ` (${quiz.set.exam_year})` : ''}` : '🧠 سؤال تدريبي (ماشي سؤال رسمي)') : '';
  const details = group
    ? group.slice(0, 4).map((x) => `<div class="row"><span>📌</span><bdi>${esc(cut(x.c.title_fr, 80))}</bdi></div>`).join('') + (group.length > 4 ? `<div class="row"><span>➕</span><bdi>${group.length - 4} ${group.length - 4 > 2 ? 'مباريات أخرى' : 'مباراة أخرى'}</bdi></div>` : '')
    : [c.diploma_fr ? `<div class="row"><span>🎓</span><bdi>${esc(cut(c.diploma_fr, 120))}</bdi></div>` : '',
       c.positions ? `<div class="row"><span>👥</span><bdi>${c.positions} ${c.positions > 10 ? 'منصبا' : c.positions > 2 ? 'مناصب' : c.positions === 2 ? 'منصبان' : 'منصب واحد'}</bdi></div>` : '',
       c.exam_date && c.exam_date >= today ? `<div class="row"><span>✍️</span><bdi>المباراة: ${dateAr(c.exam_date)}</bdi></div>` : '',
       c.region_fr ? `<div class="row"><span>📍</span><bdi>${esc(c.region_fr)}</bdi></div>` : ''].join('');
  const T = 15.5, A = 4.6, B = 11.8, REVEAL = 9.2;
  const scene = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file://${join(HERE, 'fonts', 'fonts.css')}"><style>
${BASE_CSS}
body{width:1080px;height:1920px;font-family:'Alexandria','Plus Jakarta Sans',sans-serif;background:#0b0b0d;color:#fff;position:relative;overflow:hidden}
#bg{position:absolute;left:0;right:0;top:0;height:1220px;background:url("file://${bg}") center 22%/cover}
#bg:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35) 0%,rgba(0,0,0,0) 25%,rgba(0,0,0,0) 65%,#0b0b0d 100%)}
#dim{position:absolute;inset:0;background:rgba(11,11,13,.82);opacity:0}
.top{position:absolute;top:90px;left:60px;right:60px;display:flex;justify-content:space-between;align-items:center;z-index:5}
.brand{font-family:'Plus Jakarta Sans';text-shadow:0 2px 12px rgba(0,0,0,.5)}
.tag{background:#E11D48;color:#fff;font-weight:800;font-size:40px;padding:14px 30px;border-radius:18px;direction:rtl}
.s{position:absolute;left:60px;right:60px;opacity:0;direction:rtl;text-align:center}
#s0{bottom:150px}
.org{display:flex;align-items:center;justify-content:center;gap:22px;font-size:34px;font-weight:700;color:#e5e5ea;margin-bottom:26px}
.org .logo{width:110px;height:110px;border-radius:24px}.org .logo img{max-width:92px;max-height:92px}.org .logo .ini{font-size:34px}
.title{font-weight:800;line-height:1.18;unicode-bidi:plaintext}
.num{font-size:150px;font-weight:800;color:#FFD23F;line-height:1.05;margin-top:18px;white-space:nowrap}
.dl{display:flex;align-items:center;gap:22px;margin-top:22px}.dl i{flex:1;height:5px;background:#FFD23F;border-radius:3px}.dl span{font-size:46px;font-weight:800;white-space:nowrap}
#s1{top:330px}
.qh{display:inline-block;background:#FFD23F;color:#2b1a00;font-weight:800;font-size:40px;padding:12px 28px;border-radius:16px}
.qcard{background:#fff;color:#241a22;border-radius:36px;padding:50px 48px 40px;margin-top:40px;text-align:start}
.qq{font-size:52px;font-weight:800;line-height:1.3;unicode-bidi:plaintext;text-align:start}
.opt{display:flex;gap:20px;align-items:center;margin-top:20px;border:3px solid #eee;border-radius:24px;padding:24px 26px;font-size:44px;font-weight:700;unicode-bidi:plaintext;transition:none}
.opt b{flex:none;width:62px;height:62px;border-radius:50%;background:#FCE7F3;color:#8D174B;display:grid;place-items:center;font-size:34px}
.opt.ok{border-color:#16A34A;background:#DCFCE7}.opt.ok b{background:#16A34A;color:#fff}
.ask{margin-top:30px;font-size:44px;font-weight:800}
.row{display:flex;gap:22px;align-items:flex-start;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.18);border-radius:26px;padding:30px 32px;margin-top:26px;font-size:46px;font-weight:700;text-align:start;line-height:1.3}
.row bdi{unicode-bidi:plaintext}
#s2{top:520px}
.cta{font-size:84px;font-weight:800;line-height:1.15}
.pill{display:inline-block;margin-top:50px;background:#fff;color:#8D174B;font-family:'Plus Jakarta Sans';font-size:64px;font-weight:800;padding:24px 56px;border-radius:999px}
.fol{display:inline-block;margin-top:56px;background:#FFD23F;color:#2b1a00;font-size:50px;font-weight:800;padding:20px 38px;border-radius:24px;line-height:1.3}
.bar{position:absolute;left:0;bottom:0;height:12px;background:#FFD23F;z-index:6}
</style></head><body><div id="bg"></div><div id="dim"></div>
<div class="top"><div class="brand"><div class="k">K</div>KounKour</div><div class="tag">${esc(tag)}</div></div>
<div class="s" id="s0"><div class="org">${logoBox(org, logo)}<span>${esc(cut(orgAr || org, 60))}</span></div>
<div class="title" style="font-size:${tsize(title)}px">${esc(cut(title, 120))}</div>
${postes ? `<div class="num"><bdi>${postes}</bdi> ${postes > 10 ? 'منصبا' : postes > 2 ? 'مناصب' : postes === 2 ? 'منصبان' : 'منصب'}</div>` : ''}
${deadlineLine ? `<div class="dl"><i></i><span>${esc(deadlineLine)}</span><i></i></div>` : ''}</div>
<div class="s" id="s1">${quiz
    ? `<div class="qh">${esc(quizHead)}</div><div class="qcard" dir="${/[\u0600-\u06FF]/.test(quiz.q.question) ? 'rtl' : 'ltr'}"><div class="qq">${esc(quiz.q.question)}</div>${quiz.q.options.slice(0, 5).map((o, i) => `<div class="opt" data-ok="${quiz.right.includes(i) ? 1 : 0}"><b>${'ABCDE'[i]}</b><bdi>${esc(o)}</bdi></div>`).join('')}</div><div class="ask" id="ask">جاوب فالتعليقات 👇</div>`
    : `<div class="qh">${group ? '📋 المباريات' : '📋 الشروط باختصار'}</div>${details}`}</div>
<div class="s" id="s2"><div class="cta">الشروط، الملف<br>والتحضير المجاني</div><div class="pill">kounkour.com</div><br><div class="fol">👍 تابعنا باش يوصلك<br>الجديد كل نهار</div></div>
<div class="bar" id="bar"></div>
<script>
const T=${T},A=${A},B=${B},R=${REVEAL};
const e=(x)=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3);
const show=(id,a,b,last)=>{const el=document.getElementById(id);const i=e((t0-a)/0.5),o=last?0:e((t0-(b-0.35))/0.35);el.style.opacity=Math.max(0,Math.min(i,1-o));el.style.transform='translateY('+((1-i)*70-o*40)+'px)';};
let t0=0;
window.setT=(t)=>{t0=t;
  document.getElementById('bg').style.transform='scale('+(1.02+0.08*t/T)+')';
  document.getElementById('dim').style.opacity=e((t-A+0.4)/0.5)*0.9;
  show('s0',0,A,false);show('s1',A,B,false);show('s2',B,T,true);
  document.querySelectorAll('.opt').forEach((o)=>o.classList.toggle('ok',t>=R&&o.dataset.ok==='1'));
  const ask=document.getElementById('ask');if(ask)ask.textContent=t>=R?'✅ الجواب الصحيح':'جاوب فالتعليقات 👇';
  document.getElementById('bar').style.width=(t/T*100)+'%';};
setT(0);
</script></body></html>`;
  const base = join(outDir, `reel-${kind}-${c.slug.slice(0, 40)}-${item.key.slice(0, 6)}`);
  const dir = `${base}-frames`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${base}.html`, scene);
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(`file://${resolve(base)}.html`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.setT(2.2));
  await page.screenshot({ path: `${base}.cover.png` });
  const frames = Math.round(T * REEL_FPS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.setT(t), i / REEL_FPS);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 86 });
  }
  await page.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(REEL_FPS), '-i', join(dir, 'f%04d.jpg'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '21', '-movflags', '+faststart', `${base}-muet.mp4`]);
  withTrack(`${base}-muet.mp4`, `${base}.mp4`, T);
  rmSync(`${base}-muet.mp4`, { force: true });
  rmSync(dir, { recursive: true, force: true });
  // Même texte que le post image (liens, arabe, mots-clés) + crédit musical obligatoire.
  const text = caption(item).replace(FOLLOW, `${TRACK_CREDIT}\n\n${FOLLOW}`);
  writeFileSync(`${base}.txt`, text);
  Object.assign(item, { mp4: `${base}.mp4`, cover: `${base}.cover.png`, text, isReel: true });
  return item;
}

// ---------------------------------------------------------------------------
// Publication
// ---------------------------------------------------------------------------
async function graph(path, params, secret) {
  const r = await fetch(`${GRAPH}${path}`, { method: 'POST', body: new URLSearchParams({ ...params, access_token: secret.token }) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j;
}
// when : null = tout de suite, sinon horodatage Unix (Facebook : entre 10 min et 30 jours).
async function publishPhoto(item, secret, when) {
  const fd = new FormData();
  fd.append('source', new Blob([readFileSync(item.png)], { type: 'image/png' }), 'post.png');
  fd.append('message', item.text);
  if (when) {
    fd.append('published', 'false');
    fd.append('scheduled_publish_time', String(when));
  }
  fd.append('access_token', secret.token);
  const r = await fetch(`${GRAPH}/${secret.page_id}/photos`, { method: 'POST', body: fd });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j.post_id || j.id;
}
async function publishReel(item, secret, when) {
  const { video_id } = await graph(`/${secret.page_id}/video_reels`, { upload_phase: 'start' }, secret);
  const buf = readFileSync(item.mp4);
  const up = await fetch(`${RUPLOAD}/${video_id}`, { method: 'POST', headers: { Authorization: `OAuth ${secret.token}`, offset: '0', file_size: String(buf.length) }, body: buf });
  const uj = await up.json();
  if (!up.ok || !uj.success) throw new Error(`envoi vidéo : ${JSON.stringify(uj).slice(0, 200)}`);
  await graph(`/${secret.page_id}/video_reels`, { upload_phase: 'finish', video_id, description: item.text, ...(when ? { video_state: 'SCHEDULED', scheduled_publish_time: String(when) } : { video_state: 'PUBLISHED' }) }, secret);
  // Miniature Facebook = la couverture (sinon une image prise au hasard dans la vidéo).
  if (item.cover && existsSync(item.cover)) {
    const fd = new FormData();
    fd.append('source', new Blob([readFileSync(item.cover)], { type: 'image/png' }), 'cover.png');
    fd.append('is_preferred', 'true');
    fd.append('access_token', secret.token);
    const r = await fetch(`${GRAPH}/${video_id}/thumbnails`, { method: 'POST', body: fd });
    const j = await r.json();
    if (!r.ok || j.error) console.error(`miniature : ${j.error?.message || r.status}`);
  }
  return video_id;
}

// Créneaux du propriétaire (05/11/2026) : 12 h–14 h et 18 h–20 h (toutes les 10 min), puis
// 20 h–22 h si besoin ; jamais moins de 12 min à l'avance (Facebook : 10 min minimum).
// `reserved` : créneaux gardés (le reel « Concours du jour » de 18 h).
function slots(count, reserved = []) {
  const now = Math.floor(Date.now() / 1000);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(now * 1000)).map((x) => [x.type, x.value]));
  const offset = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) / 1000 - now;
  const at = (h, m) => Date.UTC(+p.year, +p.month - 1, +p.day, h, m, 0) / 1000 - offset;
  const all = [];
  for (const [h0, h1] of [[12, 14], [18, 20], [20, 22]]) for (let m = h0 * 60; m < h1 * 60; m += 10) all.push(at(Math.floor(m / 60), m % 60));
  const free = all.filter((t) => t >= now + 12 * 60 && !reserved.includes(t));
  // Tard dans la journée : à la suite, toutes les 10 min.
  while (free.length < count) free.push(Math.max(now + 15 * 60, (free.at(-1) || now) + 600));
  return free.slice(0, count);
}
// 18 h aujourd'hui (heure du Maroc), ou null s'il est trop tard pour le programmer.
const at18 = () => {
  const now = Math.floor(Date.now() / 1000);
  const [h, m] = new Date().toLocaleTimeString('en-GB', { timeZone: TZ, hour12: false }).split(':').map(Number);
  const t = now - (now % 60) + ((18 - h) * 60 - m) * 60;
  return t >= now + 12 * 60 ? t : null;
};
// Ancien étalement (aperçu) : conservé pour l'affichage des horaires.
function schedule(count) {
  const now = Math.floor(Date.now() / 1000);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(now * 1000)).map((p) => [p.type, p.value]));
  const offset = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second) / 1000 - now;
  const end = Date.UTC(+parts.year, +parts.month - 1, +parts.day, 22, 0, 0) / 1000 - offset;
  const first = now + 20 * 60;
  const gap = count > 1 ? Math.min(3600, Math.max(900, Math.floor((end - first) / (count - 1)))) : 0;
  return Array.from({ length: count }, (_, i) => (i === 0 ? null : first + (i - 1) * gap));
}

// Ordre de passage : derniers jours, listes, puis nouveaux concours et préparation en alternance.
function interleave(a, b) {
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

const [cmd, a1, a2] = process.argv.slice(2);
if (!KEY) {
  console.error('RADAR_KEY manquante');
  process.exit(1);
}
if (cmd !== 'apercu' && cmd !== 'publier') {
  console.error('usage : post.mjs apercu [max] [dossier] | publier [max]');
  process.exit(1);
}
const max = Math.max(1, Math.min(40, Number(a1) || 30));
const outDir = a2 || join(HERE, '..', '..', '.social-out');
mkdirSync(outDir, { recursive: true });
const only = process.env.SOCIAL_SLUG;
let items;
if (only) {
  const [c] = await rest(`/contests?select=${COLS}&slug=eq.${encodeURIComponent(only)}`);
  if (!c) throw new Error(`concours introuvable : ${only}`);
  items = [{ c, kind: daysLeft(c.deadline_date) <= 2 ? 'dernier' : 'nouveau', key: c.id }];
} else {
  const reelsMax = Math.max(0, Number(process.env.SOCIAL_REELS_MAX ?? 12));
  const last = await pickContests('dernier', 2);
  const lists = await pickLists(max);
  const fresh = await pickContests('nouveau', max);
  const prep = await pickPrep(1, new Set(fresh.map((x) => x.c.id)));
  // Reels : nouveaux concours d'abord (les plus gros recrutements), puis derniers jours, puis la
  // question du jour ; les listes restent en image. Ce qui dépasse passe le lendemain (72 h).
  const reels = [...fresh, ...last, ...prep].slice(0, reelsMax);
  items = interleave(reels, lists.slice(0, Math.max(0, max - reels.length)));
}
const { chromium } = await import(PW);
const browser = await chromium.launch();
const photoItems = items.filter((x) => x.kind === 'liste' || only);
const reelItems = only ? [] : items.filter((x) => x.kind !== 'liste');
await render(photoItems, outDir, browser);
if (reelItems.length) {
  const data = await prepData();
  for (const x of reelItems) await contestReel(x, outDir, browser, data);
}
// SOCIAL_REEL=0 : sans reel ; SOCIAL_REEL=force : reel fabriqué même s'il est déjà publié (aperçu).
const reelDone = process.env.SOCIAL_REEL === 'force' && cmd === 'apercu' ? false : only || process.env.SOCIAL_REEL === '0' || (await posted('reel')).has(REEL_KEY);
const film = reelDone ? null : await reel(items, outDir, browser);
await browser.close();

if (cmd === 'apercu') {
  console.log(JSON.stringify({
    posts: items.map((x) => ({ type: x.kind, format: x.isReel ? 'reel' : 'image', concours: x.c.title_fr, liste: x.doc?.title_fr, fichier: x.mp4 || x.png })),
    reel: film && film.mp4,
    horaires: slots(items.length, [at18()].filter(Boolean)).map((t) => new Date(t * 1000).toLocaleTimeString('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })),
  }, null, 2));
} else {
  const secret = await rest('/rpc/social_secret', true, {});
  const t18 = film ? at18() : null;
  const when = slots(items.length, [t18].filter(Boolean));
  const out = [];
  for (const [i, x] of items.entries()) {
    try {
      const id = x.isReel ? await publishReel(x, secret, when[i]) : await publishPhoto(x, secret, when[i]);
      for (const k of x.keys || [x.key]) await rest('/rpc/social_record', true, { p_contest: k, p_kind: x.kind, p_post: id });
      out.push({ type: x.kind, format: x.isReel ? 'reel' : 'image', concours: x.c.title_fr, post: id, heure: new Date(when[i] * 1000).toLocaleTimeString('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) });
    } catch (e) {
      out.push({ type: x.kind, concours: x.c.title_fr, erreur: String(e.message || e) });
    }
  }
  if (film) {
    // « Concours du jour » à 18 h (créneau du propriétaire) s'il reste du temps, sinon au plus tôt.
    const t = t18 || slots(1, when)[0];
    try {
      const id = await publishReel(film, secret, t);
      await rest('/rpc/social_record', true, { p_contest: film.key, p_kind: 'reel', p_post: id });
      out.push({ type: 'reel', post: id, heure: new Date(t * 1000).toLocaleTimeString('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) });
    } catch (e) {
      out.push({ type: 'reel', erreur: String(e.message || e) });
    }
  }
  console.log(JSON.stringify(out, null, 2));
}
// Vidéos du jour pour TikTok (envoi de 11 h) : le « Concours du jour » puis les reels concours,
// les plus gros recrutements d'abord.
{
  const vids = [...(film ? [{ type: 'reel', mp4: film.mp4, text: film.text, titre: 'Les concours du jour', postes: null }] : []),
    ...items.filter((x) => x.isReel).sort((a, b) => (b.c.positions || 0) - (a.c.positions || 0)).map((x) => ({ type: x.kind, mp4: x.mp4, text: x.text, titre: x.c.title_fr, postes: x.c.positions || null }))];
  if (vids.length) writeFileSync(join(outDir, `tiktok-${today}.json`), JSON.stringify(vids.map((v) => ({ ...v, mp4: resolve(v.mp4) })), null, 1));
}
