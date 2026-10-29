// Publication sur une page supplémentaire (table social_pages : Bloomzein, حين تعرف الله…) :
// un reel (mp4) ou une image (png/jpg) sur la page Facebook, puis sur le compte Instagram relié.
//
//   RADAR_KEY=… node scripts/social/page-post.mjs publier <page> <fichier> <texte-facebook.txt> [texte-instagram.txt]
//
// Le texte Instagram (hashtags plus nombreux, « lien en bio ») est facultatif : sans lui, le
// texte Facebook est repris. Jetons lus en base avec la clé robot, jamais affichés.
import { readFileSync } from 'node:fs';

const URL = 'https://aqnxeiylhgxfvhbkftbx.supabase.co/rest/v1';
const ANON = 'sb_publishable_4tlFDcDCPj4lfV92NARBLg_VdBLPInr';
const GRAPH = 'https://graph.facebook.com/v26.0';
const RUPLOAD = 'https://rupload.facebook.com/video-upload/v26.0';
const KEY = process.env.RADAR_KEY;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function facebookReel(page, file, text) {
  const { video_id } = await graph(`/${page.page_id}/video_reels`, page.token, { upload_phase: 'start' }, 'POST');
  const buf = readFileSync(file);
  const up = await fetch(`${RUPLOAD}/${video_id}`, { method: 'POST', headers: { Authorization: `OAuth ${page.token}`, offset: '0', file_size: String(buf.length) }, body: buf });
  const uj = await up.json();
  if (!up.ok || !uj.success) throw new Error(`envoi vidéo : ${JSON.stringify(uj).slice(0, 200)}`);
  await graph(`/${page.page_id}/video_reels`, page.token, { upload_phase: 'finish', video_id, video_state: 'PUBLISHED', description: text }, 'POST');
  return video_id;
}
async function facebookPhoto(page, file, text) {
  const fd = new FormData();
  fd.append('source', new Blob([readFileSync(file)], { type: file.endsWith('.png') ? 'image/png' : 'image/jpeg' }), 'post');
  fd.append('message', text);
  fd.append('access_token', page.token);
  const r = await fetch(`${GRAPH}/${page.page_id}/photos`, { method: 'POST', body: fd });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j.id;
}
// Instagram a besoin d'une adresse publique : on reprend le fichier hébergé par Facebook.
async function publicSource(id, page, video) {
  for (let i = 0; i < 40; i++) {
    const o = await graph(`/${id}`, page.token, { fields: video ? 'source,status' : 'images' });
    const src = video ? o.source : (o.images || []).sort((a, b) => b.width - a.width)[0]?.source;
    if (src) return src;
    await sleep(6000);
  }
  throw new Error('fichier Facebook pas encore disponible');
}
// Reel : envoi direct du fichier (Instagram refuse souvent l'adresse de la copie Facebook).
async function igUpload(page, buf, caption) {
  const c = await graph(`/${page.ig_user_id}/media`, page.token, { media_type: 'REELS', upload_type: 'resumable', caption, share_to_feed: 'true' }, 'POST');
  const up = await fetch(c.uri, { method: 'POST', headers: { Authorization: `OAuth ${page.token}`, offset: '0', file_size: String(buf.length) }, body: buf });
  const uj = await up.json();
  if (!up.ok || !uj.success) throw new Error(`envoi Instagram : ${JSON.stringify(uj).slice(0, 200)}`);
  return c.id;
}
async function instagram(page, mediaParams, buf) {
  const c = buf ? { id: await igUpload(page, buf, mediaParams.caption) } : await graph(`/${page.ig_user_id}/media`, page.token, mediaParams, 'POST');
  for (let i = 0; i < 60; i++) {
    const s = await graph(`/${c.id}`, page.token, { fields: 'status_code' });
    if (s.status_code === 'FINISHED') break;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`conteneur ${s.status_code}`);
    await sleep(5000);
  }
  const pub = await graph(`/${page.ig_user_id}/media_publish`, page.token, { creation_id: c.id }, 'POST');
  const m = await graph(`/${pub.id}`, page.token, { fields: 'permalink' });
  return m.permalink || pub.id;
}

const [cmd, slug, file, fbText, igText] = process.argv.slice(2);
if (!KEY || cmd !== 'publier' || !slug || !file || !fbText) {
  console.error('usage : page-post.mjs publier <page> <fichier> <texte-facebook.txt> [texte-instagram.txt]');
  process.exit(1);
}
const page = await rpc('social_page_secret', { p_slug: slug });
if (!page) throw new Error(`page inconnue : ${slug}`);
const video = /\.(mp4|mov)$/i.test(file);
const fb = readFileSync(fbText, 'utf8').trim();
const ig = igText ? readFileSync(igText, 'utf8').trim() : fb;
const out = { page: page.name };
const fbId = video ? await facebookReel(page, file, fb) : await facebookPhoto(page, file, fb);
out.facebook = fbId;
if (page.ig_user_id) {
  try {
    out.instagram = video
      ? await instagram(page, { caption: ig }, readFileSync(file))
      : await instagram(page, { image_url: await publicSource(fbId, page, false), caption: ig });
  } catch (e) {
    out.instagram_erreur = String(e.message || e);
  }
}
console.log(JSON.stringify(out, null, 2));
