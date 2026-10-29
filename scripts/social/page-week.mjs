// Semaine de contenus d'une page supplémentaire (table social_pages), à partir d'un dossier
// fabriqué à l'avance : <jour>-<heure>-<type>.png|mp4 + .fb.txt + .ig.txt.
//
//   RADAR_KEY=… node scripts/social/page-week.mjs planifier <page> <dossier> [heure-de-début]
//       programme chaque post et reel chez Facebook (heure du Maroc) et met Instagram en file ;
//   RADAR_KEY=… node scripts/social/page-week.mjs instagram <page>
//       publie sur Instagram ce dont l'heure est passée (image ou reel repris de Facebook).
//
// Heures : 09 → 9h00, 14 → 14h00, 19 → 19h00 (reel), 21 → 21h30. Rien n'est publié deux fois.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const URL = 'https://aqnxeiylhgxfvhbkftbx.supabase.co/rest/v1';
const ANON = 'sb_publishable_4tlFDcDCPj4lfV92NARBLg_VdBLPInr';
const GRAPH = 'https://graph.facebook.com/v26.0';
const RUPLOAD = 'https://rupload.facebook.com/video-upload/v26.0';
const KEY = process.env.RADAR_KEY;
const TZ = 'Africa/Casablanca';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MINUTE = { '09': '00', 14: '00', 19: '00', 21: '30' };

async function rpc(name, body) {
  const r = await fetch(`${URL}/rpc/${name}`, { method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'x-radar-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const t = await r.text();
  if (!r.ok) throw new Error(`${name} → ${r.status} ${t.slice(0, 200)}`);
  return JSON.parse(t);
}
async function graph(path, token, params = {}, method = 'GET') {
  const qs = new URLSearchParams({ ...params, access_token: token });
  const r = await fetch(`${GRAPH}${path}${method === 'GET' ? `?${qs}` : ''}`, { method, body: method === 'GET' ? undefined : qs });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j;
}
// « 2026-10-30 » + « 19:00 » au Maroc → horodatage Unix.
function moroccoEpoch(day, hm) {
  const guess = Date.parse(`${day}T${hm}:00Z`);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
  const shown = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour % 24}:${p.minute}:00Z`.replace(/T(\d):/, 'T0$1:'));
  return Math.round((guess - (shown - guess)) / 1000);
}

// Miniature du reel sur Facebook = la couverture (accroche + verset), sinon Facebook prend une image au hasard.
async function setThumbnail(page, videoId, file) {
  if (!existsSync(file)) return;
  const fd = new FormData();
  fd.append('source', new Blob([readFileSync(file)], { type: 'image/png' }), 'cover.png');
  fd.append('is_preferred', 'true');
  fd.append('access_token', page.token);
  const r = await fetch(`${GRAPH}/${videoId}/thumbnails`, { method: 'POST', body: fd });
  const j = await r.json();
  if (!r.ok || j.error) console.error(`miniature ${videoId} : ${j.error?.message || r.status}`);
}

async function planifier(page, dir, from) {
  const files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}-\d{2}-[a-z]+\.(png|mp4)$/.test(f)).sort();
  const out = [];
  for (const f of files) {
    const [, day, slot, kind] = /^(\d{4}-\d{2}-\d{2})-(\d{2})-([a-z]+)\./.exec(f);
    const item = `${day}-${slot}`;
    if (from && item < from) continue;
    const at = moroccoEpoch(day, `${slot}:${MINUTE[slot] || '00'}`);
    if (at < Date.now() / 1000 + 15 * 60) { out.push({ item, info: 'heure déjà passée, ignoré' }); continue; }
    const base = join(dir, f.replace(/\.(png|mp4)$/, ''));
    const fb = readFileSync(`${base}.fb.txt`, 'utf8').trim();
    const ig = readFileSync(`${base}.ig.txt`, 'utf8').trim();
    const done = (await rpc('social_queue_list', { p_page: page.slug, p_network: 'facebook' })).find((q) => q.item === item);
    if (done) { out.push({ item, info: 'déjà programmé' }); continue; }
    let id;
    if (f.endsWith('.mp4')) {
      const { video_id } = await graph(`/${page.page_id}/video_reels`, page.token, { upload_phase: 'start' }, 'POST');
      const buf = readFileSync(join(dir, f));
      const up = await fetch(`${RUPLOAD}/${video_id}`, { method: 'POST', headers: { Authorization: `OAuth ${page.token}`, offset: '0', file_size: String(buf.length) }, body: buf });
      if (!(await up.json()).success) throw new Error(`envoi vidéo ${f}`);
      await graph(`/${page.page_id}/video_reels`, page.token, { upload_phase: 'finish', video_id, video_state: 'SCHEDULED', scheduled_publish_time: String(at), description: fb }, 'POST');
      id = video_id;
      await setThumbnail(page, id, `${base}.cover.png`);
    } else {
      const fd = new FormData();
      fd.append('source', new Blob([readFileSync(join(dir, f))], { type: 'image/png' }), 'post.png');
      fd.append('message', fb);
      fd.append('published', 'false');
      fd.append('scheduled_publish_time', String(at));
      fd.append('access_token', page.token);
      const r = await fetch(`${GRAPH}/${page.page_id}/photos`, { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
      id = j.id;
    }
    const iso = new Date(at * 1000).toISOString();
    await rpc('social_queue_put', { p: { page: page.slug, network: 'facebook', item, kind, publish_at: iso, caption: fb, fb_post_id: id, post_id: id, status: 'scheduled' } });
    if (page.ig_user_id) await rpc('social_queue_put', { p: { page: page.slug, network: 'instagram', item, kind, publish_at: iso, caption: ig, fb_post_id: id, status: 'pending' } });
    out.push({ item, kind, facebook: id, heure: new Date(at * 1000).toLocaleString('fr-FR', { timeZone: TZ }) });
  }
  return out;
}

async function instagram(page) {
  const due = (await rpc('social_queue_list', { p_page: page.slug, p_network: 'instagram' })).filter((q) => q.status === 'pending' && Date.parse(q.publish_at) <= Date.now());
  const out = [];
  for (const q of due) {
    try {
      let c;
      if (q.kind === 'reel') {
        const v = await graph(`/${q.fb_post_id}`, page.token, { fields: 'source' });
        if (!v.source) throw new Error('reel Facebook pas encore disponible');
        const buf = Buffer.from(await (await fetch(v.source)).arrayBuffer());
        c = await graph(`/${page.ig_user_id}/media`, page.token, { media_type: 'REELS', upload_type: 'resumable', caption: q.caption, share_to_feed: 'true' }, 'POST');
        const up = await fetch(c.uri, { method: 'POST', headers: { Authorization: `OAuth ${page.token}`, offset: '0', file_size: String(buf.length) }, body: buf });
        if (!(await up.json()).success) throw new Error('envoi Instagram');
      } else {
        const p = await graph(`/${q.fb_post_id}`, page.token, { fields: 'images' });
        const img = (p.images || []).sort((a, b) => b.width - a.width)[0];
        if (!img) throw new Error('image Facebook introuvable');
        // Texte alternatif = les deux premières lignes de la légende (sans emoji).
        const alt = q.caption.split('\n').filter((l) => l.trim() && !l.startsWith('#')).slice(0, 2).join(' – ').replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').trim().slice(0, 500);
        try {
          c = await graph(`/${page.ig_user_id}/media`, page.token, { image_url: img.source, caption: q.caption, alt_text: alt }, 'POST');
        } catch {
          c = await graph(`/${page.ig_user_id}/media`, page.token, { image_url: img.source, caption: q.caption }, 'POST');
        }
      }
      for (let i = 0; i < 60; i++) {
        const s = await graph(`/${c.id}`, page.token, { fields: 'status_code' });
        if (s.status_code === 'FINISHED') break;
        if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`conteneur ${s.status_code}`);
        await sleep(5000);
      }
      const pub = await graph(`/${page.ig_user_id}/media_publish`, page.token, { creation_id: c.id }, 'POST');
      const m = await graph(`/${pub.id}`, page.token, { fields: 'permalink' });
      await rpc('social_queue_mark', { p_id: q.id, p_status: 'published', p_post: pub.id });
      out.push({ item: q.item, kind: q.kind, instagram: m.permalink });
    } catch (e) {
      out.push({ item: q.item, kind: q.kind, erreur: String(e.message || e) });
    }
  }
  return out.length ? out : [{ info: 'rien à publier sur Instagram pour le moment' }];
}

const [cmd, slug, dir, from] = process.argv.slice(2);
if (!KEY || !['planifier', 'instagram'].includes(cmd) || !slug || (cmd === 'planifier' && !dir)) {
  console.error('usage : page-week.mjs planifier <page> <dossier> [jour-heure] | instagram <page>');
  process.exit(1);
}
const page = await rpc('social_page_secret', { p_slug: slug });
if (!page) throw new Error(`page inconnue : ${slug}`);
page.slug = slug;
console.log(JSON.stringify(cmd === 'planifier' ? await planifier(page, dir, from) : await instagram(page), null, 2));
