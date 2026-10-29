// Instagram @kounkourmaroc (relié à la page Facebook KounKour) : reprend les images et le reel
// déjà publiés sur Facebook le jour même, avec un texte adapté (pas de lien cliquable sur
// Instagram : « lien en bio »). Jamais deux fois le même post (social_posts, réseau instagram).
//
//   RADAR_KEY=… node scripts/social/instagram.mjs apercu <types> [n]
//   RADAR_KEY=… node scripts/social/instagram.mjs publier <types> [n]
//
// <types> : nouveau,liste,dernier,preparation ou reel (séparés par des virgules).
// Les récapitulatifs (plusieurs concours dans un post) passent en premier.
const URL = 'https://aqnxeiylhgxfvhbkftbx.supabase.co/rest/v1';
const ANON = 'sb_publishable_4tlFDcDCPj4lfV92NARBLg_VdBLPInr';
const GRAPH = 'https://graph.facebook.com/v26.0';
const IG_USER = '17841464381628855'; // @kounkourmaroc
const KEY = process.env.RADAR_KEY;
const TZ = 'Africa/Casablanca';

async function rest(path, body) {
  const r = await fetch(URL + path, { method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'x-radar-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const t = await r.text();
  if (!r.ok) throw new Error(`${path} → ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}
async function graph(path, token, params, method = 'GET') {
  const qs = new URLSearchParams({ ...(params || {}), access_token: token });
  const r = await fetch(`${GRAPH}${path}${method === 'GET' ? `?${qs}` : ''}`, { method, body: method === 'GET' ? undefined : qs });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Texte Instagram : les adresses deviennent « lien en bio », hashtags complétés.
function igCaption(text) {
  const lines = (text || '').split('\n').filter((l) => !/^👉\s*https?:\/\//.test(l.trim()));
  const out = lines.map((l) => l.replace(/\s*:\s*https?:\/\/\S+/g, '').replace(/https?:\/\/\S+/g, 'kounkour.com')).join('\n');
  const tags = '#concours #emploi #maroc #emploipublic #concoursmaroc #fonctionpublique #recrutement #مباراة #توظيف #مباريات_التوظيف #KounKour';
  return `${out.replace(/\n#.*$/s, '').trim()}\n\n🔗 Lien en bio : kounkour.com\n\n${tags}`.slice(0, 2200);
}

async function waitReady(id, token) {
  for (let i = 0; i < 60; i++) {
    const s = await graph(`/${id}`, token, { fields: 'status_code' });
    if (s.status_code === 'FINISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`conteneur ${s.status_code}`);
    await sleep(5000);
  }
  throw new Error('conteneur pas prêt après 5 min');
}

const [cmd, typesArg, nArg] = process.argv.slice(2);
if (!KEY || !['apercu', 'publier'].includes(cmd) || !typesArg) {
  console.error('usage : instagram.mjs apercu|publier <types> [n]');
  process.exit(1);
}
const types = typesArg.split(',');
const n = Math.max(1, Math.min(5, Number(nArg) || 1));
const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
const since = new Date(Date.parse(`${today}T00:00:00Z`) - 2 * 3600000).toISOString();
const secret = await rest('/rpc/social_secret', {});
const feed = (await rest('/rpc/social_feed', { p_since: since, p_network: 'facebook' })).filter((x) => types.includes(x.kind));
const done = new Set();
for (const t of types) for (const k of await rest('/rpc/social_posted', { p_kind: t, p_network: 'instagram' })) done.add(`${t}:${k}`);
// L'identifiant « page_post » du premier post n'est pas une photo réutilisable : on l'écarte.
const todo = feed.filter((x) => !x.keys.some((k) => done.has(`${x.kind}:${k}`)) && !String(x.post_id).includes('_'))
  .sort((a, b) => b.keys.length - a.keys.length || Date.parse(a.posted_at) - Date.parse(b.posted_at)).slice(0, n);

const out = [];
for (const x of todo) {
  try {
    let media;
    if (x.kind === 'reel') {
      const v = await graph(`/${x.post_id}`, secret.token, { fields: 'source,description' });
      if (!v.source) throw new Error('vidéo Facebook pas encore disponible');
      media = { media_type: 'REELS', video_url: v.source, caption: igCaption(v.description), share_to_feed: 'true' };
      // Instagram refuse souvent l'adresse de la copie Facebook : le fichier est envoyé directement.
      media.file = Buffer.from(await (await fetch(v.source)).arrayBuffer());
    } else {
      const p = await graph(`/${x.post_id}`, secret.token, { fields: 'images,name' });
      const img = (p.images || []).sort((a, b) => b.width - a.width)[0];
      if (!img) throw new Error('image Facebook introuvable');
      media = { image_url: img.source, caption: igCaption(p.name) };
    }
    if (cmd === 'apercu') {
      out.push({ type: x.kind, facebook: x.post_id, texte: media.caption.split('\n').slice(0, 3).join(' / ') });
      continue;
    }
    let c;
    if (media.file) {
      c = await graph(`/${IG_USER}/media`, secret.token, { media_type: 'REELS', upload_type: 'resumable', caption: media.caption, share_to_feed: 'true' }, 'POST');
      const up = await fetch(c.uri, { method: 'POST', headers: { Authorization: `OAuth ${secret.token}`, offset: '0', file_size: String(media.file.length) }, body: media.file });
      const uj = await up.json();
      if (!up.ok || !uj.success) throw new Error(`envoi Instagram : ${JSON.stringify(uj).slice(0, 200)}`);
    } else c = await graph(`/${IG_USER}/media`, secret.token, media, 'POST');
    await waitReady(c.id, secret.token);
    const pub = await graph(`/${IG_USER}/media_publish`, secret.token, { creation_id: c.id }, 'POST');
    for (const k of x.keys) await rest('/rpc/social_record', { p_contest: k, p_kind: x.kind, p_post: pub.id, p_network: 'instagram' });
    out.push({ type: x.kind, instagram: pub.id });
  } catch (e) {
    out.push({ type: x.kind, facebook: x.post_id, erreur: String(e.message || e) });
  }
}
console.log(JSON.stringify(out.length ? out : [{ info: 'rien à reprendre sur Instagram pour ces types aujourd’hui' }], null, 2));
