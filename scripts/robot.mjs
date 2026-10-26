#!/usr/bin/env node
// Outil de la routine du matin (docs/routine-matin.md) : uniquement la clé robot du site,
// jamais le connecteur Supabase (aucune autorisation à demander au propriétaire).
//
//   RADAR_KEY=… node scripts/robot.mjs <commande> [arguments]
//
//   a-analyser                 annonces à lire (arrêtés) + fiches « page seule » encore ouvertes
//   docs <candidate_id>        documents préparés d'une annonce (liens, texte de la page)
//   publier <fichier.json>     publie [{acte, org, contests:[…]}] (radar_publish_robot)
//   annonce <id> <json>        met à jour une annonce (analysis_status, analysis…)
//   dreamjob                   annonces dreamjob à trier (nouveau / erreur)
//   preparer                   prépare les documents des nouvelles annonces (fetch-docs)
//   etapes                     suivi convocations / résultats (track-stages)
//   sans-specialite            concours ouverts sans critère « specialite »
//   dossier <fichier.json>     crée / complète un dossier de préparation (prep_folder_upsert)
//   annales <fichier.json>     importe des séries QCM / sujets (annales_import)
//   corrige <fichier.json>     ajoute des corrigés de sujets (annales_set_corrige)
//   logos                      logo officiel des organismes sans logo (nom exact sur emploi-public)
//   bilan                      chiffres du jour pour le rapport
import { readFileSync } from 'node:fs';

const URL = 'https://aqnxeiylhgxfvhbkftbx.supabase.co/rest/v1';
const ANON = 'sb_publishable_4tlFDcDCPj4lfV92NARBLg_VdBLPInr';
const KEY = process.env.RADAR_KEY;
const SITE = 'https://kounkour.com';
if (!KEY) {
  console.error('RADAR_KEY manquante');
  process.exit(1);
}
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' });

async function api(method, path, body, extra = {}) {
  const r = await fetch(URL + path, {
    method,
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'x-radar-key': KEY, 'Content-Type': 'application/json', ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${t.slice(0, 400)}`);
  return t ? JSON.parse(t) : null;
}
const json = (f) => JSON.parse(readFileSync(f, 'utf8'));
const out = (x) => console.log(JSON.stringify(x, null, 2));
async function loop(path, max = 40) {
  const res = [];
  for (let i = 0; i < max; i++) {
    const r = await fetch(`${SITE}${path}${path.includes('?') ? '&' : '?'}key=${KEY}`).then((x) => x.json()).catch((e) => ({ error: String(e) }));
    res.push(r);
    if (r.error || !(r.remaining > 0)) break;
  }
  return res;
}

const [cmd, a1, a2] = process.argv.slice(2);
switch (cmd) {
  case 'a-analyser': {
    const nouveaux = await api('GET', '/radar_candidates?select=id,title_original,source_url,deadline_date,administration_name,analysis&analysis_status=eq.a_analyser&order=deadline_date');
    const page = await api('GET', `/radar_candidates?select=id,title_original,source_url,deadline_date,imported_contest_id&analysis_status=eq.publie&analysis->>sha256_prefix=eq.page&deadline_date=gte.${today}&order=deadline_date`);
    out({ a_analyser: nouveaux, page_seule_a_completer: page });
    break;
  }
  case 'docs':
    out(await api('GET', `/radar_documents?select=kind,url,mime,size_bytes,sha256,fetch_error,text_content&candidate_id=eq.${a1}`));
    break;
  case 'publier':
    out(await api('POST', '/rpc/radar_publish_robot', { p: json(a1) }));
    break;
  case 'annonce':
    out(await api('PATCH', `/radar_candidates?id=eq.${a1}`, JSON.parse(a2), { Prefer: 'return=representation' }));
    break;
  case 'dreamjob':
    out(await api('GET', '/radar_candidates?select=id,title_original,source_url,deadline_date,analysis_status,analysis&analysis_status=in.(nouveau,erreur,a_verifier)&source_url=like.*dreamjob*'));
    break;
  case 'preparer':
    out(await loop('/api/radar/fetch-docs?limit=4'));
    break;
  case 'etapes':
    out((await loop('/api/radar/track-stages?limit=40')).map(({ report, ...r }) => ({ ...r, nouvelles: report })));
    break;
  case 'sans-specialite': {
    const open = await api('GET', `/contests?select=slug,title_fr,contest_criteria(criterion_type)&status=in.(publie,mis_a_jour)&deadline_date=gte.${today}&limit=1000`);
    out(open.filter((c) => !(c.contest_criteria || []).some((k) => k.criterion_type === 'specialite')).map((c) => ({ slug: c.slug, titre: c.title_fr })));
    break;
  }
  case 'dossier':
    out(await api('POST', '/rpc/prep_folder_upsert', { p: json(a1) }));
    break;
  case 'annales':
    out(await api('POST', '/rpc/annales_import', { p: json(a1) }));
    break;
  case 'corrige':
    out(await api('POST', '/rpc/annales_set_corrige', { p: json(a1) }));
    break;
  case 'logos': {
    // Logo officiel par NOM EXACT : sur emploi-public, chaque carte de concours porte
    // <img src=".../administrations/..." alt="Nom de l'organisme">. Le logo n'est jamais
    // pris « au hasard » sur la fiche (les images y sont celles des concours similaires).
    const norm = (s) => (s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/’/g, "'").replace(/&#0?39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/[^a-z0-9]+/g, ' ').trim();
    const adms = await api('GET', '/administrations?select=id,name_fr,logo_url&limit=2000');
    const todo = adms.filter((a) => !a.logo_url);
    const open = await api('GET', `/contests?select=source_url&source_url=like.*emploi-public.ma*&deadline_date=gte.${today}&limit=1000`);
    const pages = new Set(open.map((c) => c.source_url.split('#')[0]));
    for (const stat of ['service_etat', 'collec', 'etab_publics']) for (let p = 1; p <= 40; p++) pages.add(`https://www.emploi-public.ma/fr/concours-liste?stat=${stat}&page=${p}`);
    const seen = new Map(); // nom → Map(src → n)
    const list = [...pages];
    for (let i = 0; i < list.length; i += 5) {
      const htmls = await Promise.all(list.slice(i, i + 5).map((u) => fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => (r.ok ? r.text() : '')).catch(() => '')));
      for (const h of htmls) for (const m of h.matchAll(/<img src="(\/backoffice\/files\/images\/administrations\/[^"]+)"\s+alt="([^"]*)"/g)) {
        const n = norm(m[2]);
        const c = seen.get(n) || new Map();
        c.set(m[1], (c.get(m[1]) || 0) + 1);
        seen.set(n, c);
      }
    }
    const owners = new Map();
    for (const [n, c] of seen) for (const s of c.keys()) owners.set(s, (owners.get(s) || new Set()).add(n));
    const items = [];
    for (const a of todo) {
      const c = seen.get(norm(a.name_fr));
      if (!c) continue;
      const src = [...c.entries()].sort((x, y) => y[1] - x[1])[0][0];
      if ((owners.get(src)?.size || 0) > 2) continue; // image par défaut du portail
      const r = await fetch('https://www.emploi-public.ma' + src, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const buf = Buffer.from(await r.arrayBuffer());
      const mime = r.headers.get('content-type') || 'image/png';
      if (!r.ok || buf.length > 250000 || !/^image\//.test(mime)) continue;
      items.push({ administration_id: a.id, mime, content_b64: buf.toString('base64'), source_url: 'https://www.emploi-public.ma' + src });
    }
    let n = 0;
    for (let i = 0; i < items.length; i += 10) n += (await api('POST', '/rpc/admin_logo_add', { p: items.slice(i, i + 10) })) || 0;
    out({ organismes_sans_logo: todo.length, logos_ajoutes: n, toujours_sans_logo: todo.length - n });
    break;
  }
  case 'bilan': {
    const count = async (path) => {
      const r = await fetch(URL + path, { method: 'HEAD', headers: { apikey: ANON, 'x-radar-key': KEY, Prefer: 'count=exact', Range: '0-0' } });
      return Number((r.headers.get('content-range') || '/0').split('/')[1]);
    };
    out({
      date: today,
      concours_ouverts: await count(`/contests?select=id&status=in.(publie,mis_a_jour)&deadline_date=gte.${today}`),
      publies_aujourdhui: await count(`/contests?select=id&published_at=gte.${today}T00:00:00`),
      a_analyser: await count('/radar_candidates?select=id&analysis_status=eq.a_analyser'),
      a_verifier: await count('/radar_candidates?select=id&analysis_status=eq.a_verifier'),
      page_seule_ouvertes: await count(`/radar_candidates?select=id&analysis_status=eq.publie&analysis->>sha256_prefix=eq.page&deadline_date=gte.${today}`),
      series_preparation: await count('/qcm_sets?select=id&status=eq.published'),
    });
    break;
  }
  default:
    console.error(readFileSync(new globalThis.URL(import.meta.url), 'utf8').split('\n').slice(1, 20).join('\n'));
    process.exit(1);
}
