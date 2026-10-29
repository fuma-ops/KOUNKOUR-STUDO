// Semaine de contenus de la page « حين تعرف الله » : posts 1080 × 1350 et reels 1080 × 1920
// (couverture, verset mot par mot, traduction Saheeh International, réflexion, fin ; musique
// « Floats » + crédit Uppbeat). Textes Facebook / Instagram avec mots-clés et hashtags.
//
//   node scripts/social/hta/build.mjs [post|reel] <semaine.json>   (depuis un dossier de travail : écrit ./out/)
//   puis : node scripts/social/page-week.mjs planifier hin-taarif-allah ./out
//
// Versets : toujours copiés depuis api.alquran.cloud (quran-uthmani, en.sahih), jamais de mémoire.
// Hadiths : authentiques seulement, recueil et numéro cités.
import { existsSync as _ex } from 'node:fs';
const { chromium } = await import(_ex('/opt/node22/lib/node_modules/playwright/index.mjs') ? '/opt/node22/lib/node_modules/playwright/index.mjs' : 'playwright');
import { writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { withTrack, TRACK_CREDIT } from '../sounds.mjs';
import { execFileSync } from 'node:child_process';
const D = process.cwd();
const W = JSON.parse(readFileSync(process.argv[3] || process.env.WEEK || 'week.json', 'utf8'));
const only = process.argv[2]; // post | reel | (tout)
mkdirSync('out', { recursive: true });
const pattern = `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23F6E7C1' stroke-width='0.6'%3E%3Cpath d='M30 4 L36 24 L56 30 L36 36 L30 56 L24 36 L4 30 L24 24 Z'/%3E%3Ccircle cx='30' cy='30' r='9'/%3E%3C/g%3E%3C/svg%3E")`;
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Aref+Ruqaa:wght@700&family=Amiri:wght@400;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap" rel="stylesheet">`;
const BG = `background:radial-gradient(ellipse at 50% 118%,#F7D9A0 0%,#C9925E 18%,#4E3B63 52%,#1E2140 100%)`;
const plain = (s) => (s || '').replace(/<br>/g, ' ').replace(/\s+/g, ' ').trim();

// ───────── posts 1080 × 1350 ─────────
function postHtml(x) {
  const small = x.small;
  let body = '';
  if (x.type === 'dua') {
    const text = x.quran ? `<div class="q" style="font-size:${x.quran.length > 50 ? 60 : 72}px">﴿${x.quran}﴾</div>` : `<div class="hd" style="font-size:${x.hadith.length > 160 ? 34 : x.hadith.length > 90 ? 42 : 52}px">«${x.hadith}»</div>`;
    body = `<div class="hook">${x.hook_ar}</div><div class="hen">${x.hook_en}</div>${text}<div class="ref">${x.ref}</div>
<div class="en">${x.en || ''}</div>${x.box_ar ? `<div class="h">${x.box_ar}${x.box_ref ? `<small>${x.box_ref}</small>` : ''}<em>${x.box_en || ''}</em></div>` : ''}`;
  } else if (x.type === 'info') {
    body = `<div class="hook" style="font-size:50px">${x.title_ar}</div><div class="hen">${x.title_en}</div>${x.quran ? `<div class="q" style="font-size:56px;margin:10px 0 0">﴿${x.quran}﴾</div>` : ''}
<div class="list">${x.items.map((it, i) => `<div class="li"><b>${i + 1}</b><div>${it[0]}${it[1] ? `<small>${it[1]}</small>` : ''}<em>${it[2]}</em></div></div>`).join('')}</div>`;
  } else {
    body = `<div class="big">${x.q_ar}</div><div class="hen" style="font-size:34px;margin-top:20px">${x.q_en}</div><div class="sub">${x.sub_ar}</div><div><span class="cm">اكتبها في التعليقات 👇 · Comment below</span></div>`;
  }
  return `<!doctype html><html dir="rtl"><head><meta charset="utf-8">${FONTS}<style>
*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;overflow:hidden;position:relative;color:#FFF8EA;font-family:'Amiri',serif;${BG}}
.p{position:absolute;inset:0;opacity:.08;background-image:${pattern};background-size:130px 130px}
.top{position:absolute;top:50px;left:0;right:0;text-align:center}.tag{display:inline-block;border:2px solid rgba(246,231,193,.6);border-radius:999px;padding:8px 28px;font-size:32px;font-weight:700;color:#F6E7C1}
.c{position:absolute;left:70px;right:70px;top:140px;bottom:170px;display:flex;flex-direction:column;justify-content:center;text-align:center}
.foot{position:absolute;bottom:44px;left:0;right:0;text-align:center}.brand{font-family:'Aref Ruqaa',serif;font-size:54px}.fen{font-family:'Cormorant Garamond',serif;font-size:22px;letter-spacing:6px;opacity:.85}
.hook{font-size:54px;font-weight:700;line-height:1.45}.hen{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:30px;color:#F6E7C1;margin-top:6px;direction:ltr}
.q{font-family:'Amiri Quran',serif;line-height:2.05;margin:22px 0 4px}.hd{font-weight:700;line-height:1.75;margin:26px 0 8px}
.ref{font-size:30px;color:#F6E7C1}.en{font-family:'Cormorant Garamond',serif;font-size:${small ? 26 : 30}px;line-height:1.35;margin-top:14px;direction:ltr;opacity:.95}
.h{margin-top:24px;font-size:${small ? 30 : 33}px;line-height:1.6;background:rgba(255,255,255,.08);border:1px solid rgba(246,231,193,.25);border-radius:26px;padding:18px 26px}
.h small{display:block;font-size:25px;color:#F6E7C1}.h em,.li em{display:block;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:24px;direction:ltr;opacity:.9;margin-top:4px;line-height:1.3}
.list{text-align:right;margin-top:16px}.li{display:flex;gap:16px;align-items:flex-start;background:rgba(255,255,255,.08);border:1px solid rgba(246,231,193,.22);border-radius:22px;padding:${small ? '10px 20px' : '14px 22px'};margin-top:${small ? 10 : 14}px;font-size:${small ? 29 : 32}px;line-height:1.5}
.li b{flex-shrink:0;width:48px;height:48px;border-radius:50%;background:#F6E7C1;color:#3B2A4D;display:flex;align-items:center;justify-content:center;font-size:28px}
.li small{display:block;font-size:22px;color:#F6E7C1}.li em{text-align:left}
.big{font-size:70px;font-weight:700;line-height:1.5}.sub{font-size:38px;margin-top:26px;color:#F6E7C1;line-height:1.6}.cm{margin-top:40px;display:inline-block;background:#F6E7C1;color:#3B2A4D;border-radius:999px;padding:14px 36px;font-size:36px;font-weight:700}
</style></head><body><div class="p"></div><div class="top"><span class="tag">${x.tag || '💬 شاركنا · Share with us'}</span></div><div class="c">${body}</div>
<div class="foot"><div class="brand">حين تعرف الله</div><div class="fen">WHEN YOU KNOW ALLAH</div></div></body></html>`;
}

// ───────── reels 1080 × 1920, 21 s ─────────
const T = 22.5; // 1,5 s de couverture + 21 s
function reelHtml(x) {
  const tokens = x.lines.map((l) => l.split(' ').reduce((a, w) => (/^[ۖۚۗۛۙ]$/.test(w) && a.length ? (a[a.length - 1] += ' ' + w, a) : (a.push(w), a)), []));
  const n = tokens.flat().length;
  const len = x.lines.join(' ').length;
  const vs = len > 60 ? 92 : len > 40 ? 108 : 128;
  let k = 0;
  const verse = tokens.map((ws) => `<div>${ws.map((w) => `<span id="w${k++}">${w}</span>`).join(' ')}</div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;overflow:hidden;position:relative;background:#1E2140;color:#FFF8EA;font-family:'Amiri',serif}
#sky{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 120%,#F7D9A0 0%,#C9925E 20%,#4E3B63 55%,#1E2140 100%)}
.p{position:absolute;inset:0;opacity:.09;background-image:${pattern};background-size:140px 140px}
#glow{position:absolute;left:50%;width:1600px;height:1600px;margin-left:-800px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,236,190,.5),rgba(255,236,190,0))}
.star{position:absolute;width:4px;height:4px;border-radius:50%;background:#fff}
.s{position:absolute;left:70px;right:70px;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;opacity:0}
.hook{font-size:80px;font-weight:700;line-height:1.45;text-shadow:0 6px 30px rgba(0,0,0,.4)}
.en{font-family:'Cormorant Garamond',serif;font-size:46px;margin-top:28px;color:#F6E7C1;font-style:italic;line-height:1.3}
.verse{font-family:'Amiri Quran',serif;font-size:${vs}px;line-height:1.9;direction:rtl;text-shadow:0 8px 40px rgba(0,0,0,.45)}
.verse span{display:inline-block;opacity:0}.ref{font-size:44px;color:#F6E7C1;margin-top:18px}
.tr{font-family:'Cormorant Garamond',serif;font-size:62px;font-weight:600;line-height:1.3}.small{font-family:'Cormorant Garamond',serif;font-size:34px;color:#F6E7C1;margin-top:26px;letter-spacing:1px}
.rf{font-size:62px;line-height:1.55;font-weight:700}
.brand{font-family:'Aref Ruqaa',serif;font-size:120px;text-shadow:0 6px 30px rgba(0,0,0,.35)}.fen{font-family:'Cormorant Garamond',serif;font-size:40px;letter-spacing:8px;margin-top:10px}
.cvhook{font-size:76px;font-weight:700;line-height:1.4;text-shadow:0 6px 30px rgba(0,0,0,.45)}
.cvq{font-family:'Amiri Quran',serif;font-size:${Math.round(vs * 0.82)}px;line-height:1.85;direction:rtl;margin-top:70px;padding:30px 20px;border-top:2px solid rgba(246,231,193,.35);border-bottom:2px solid rgba(246,231,193,.35);text-shadow:0 8px 40px rgba(0,0,0,.45)}
.cvbrand{font-family:'Aref Ruqaa',serif;font-size:72px;margin-top:80px;color:#F6E7C1}
.line{width:260px;height:2px;background:linear-gradient(90deg,transparent,#F6E7C1,transparent);margin:26px auto}.follow{font-size:44px;margin-top:10px;color:#F6E7C1}
</style></head><body><div id="sky"></div><div class="p"></div><div id="glow"></div>
${Array.from({ length: 60 }, (_, i) => `<i class="star" data-i="${i}" style="left:${(i * 137.5) % 1080}px;top:${(i * 83.7) % 1100}px"></i>`).join('')}
<div class="s" id="cv" style="opacity:1"><div class="cvhook" dir="rtl">${x.hook_ar}</div><div class="en" dir="ltr" style="margin-top:14px">${x.hook_en}</div>
<div class="cvq">${x.lines.map((l) => `<div>${l}</div>`).join('')}</div><div class="ref" dir="rtl">${x.ref}</div>
<div class="cvbrand" dir="rtl">حين تعرف الله</div></div>
<div class="s" id="s0" dir="rtl"><div class="hook">${x.hook_ar}</div><div class="en" dir="ltr">${x.hook_en}</div></div>
<div class="s" id="s1"><div class="verse">${verse}</div><div class="ref" dir="rtl">${x.ref}</div></div>
<div class="s" id="s2"><div class="tr">${x.tr}</div><div class="small">${x.tr_ref}</div></div>
<div class="s" id="s3" dir="rtl"><div class="rf">${x.refl_ar}</div><div class="en" dir="ltr">${x.refl_en}</div></div>
<div class="s" id="s4"><div class="brand" dir="rtl">حين تعرف الله</div><div class="fen">WHEN YOU KNOW ALLAH</div><div class="line"></div><div class="follow" dir="rtl">تابعنا… لأن ربك لا ينسى</div></div>
<script>
const ease=(x)=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x)};const N=${n};const step=Math.min(0.9,4.2/N);
const O=1.5;const SP=[[O,O+4],[O+4,O+11],[O+11,O+15],[O+15,O+18.5],[O+18.5,${T}]];
window.setT=(t)=>{document.getElementById('glow').style.top=(1500-t*14)+'px';
document.querySelectorAll('.star').forEach((s)=>{const i=+s.dataset.i;s.style.opacity=0.25+0.45*(0.5+0.5*Math.sin(t*1.3+i))});
const cv=document.getElementById('cv');const co=1-ease((t-(O-0.6))/0.6);cv.style.opacity=co;cv.style.transform='scale('+(1+0.02*(1-co))+')';
SP.forEach(([a,b],i)=>{const el=document.getElementById('s'+i);const inn=ease((t-a)/0.9),out=i===SP.length-1?0:ease((t-(b-0.7))/0.7);el.style.opacity=Math.max(0,inn-out);el.style.transform='translateY('+((1-inn)*40-out*30)+'px)'});
for(let i=0;i<N;i++){const w=document.getElementById('w'+i);const k=ease((t-O-4.6-i*step)/0.8);w.style.opacity=k;w.style.transform='translateY('+(1-k)*30+'px)'}};
</script></body></html>`;
}

// ───────── textes (référencement) ─────────
const TAGS_FB = '#حين_تعرف_الله #قرآن #دعاء #ذكر_الله #تذكير #Quran #Dua #IslamicReminder #WhenYouKnowAllah';
// Instagram : 6 à 7 hashtags ciblés selon le type (la recherche lit surtout la légende).
const TAGS_IG_BY = {
  reel: '#قرآن #آيات_قرآنية #تدبر #QuranVerses #IslamicReminder #حين_تعرف_الله #WhenYouKnowAllah',
  dua: '#دعاء #أدعية #دعاء_مستجاب #Dua #IslamicReminder #حين_تعرف_الله #WhenYouKnowAllah',
  info: '#فضل_القرآن #السنة_النبوية #تذكير #Sunnah #IslamicReminder #حين_تعرف_الله #WhenYouKnowAllah',
  question: '#تذكير #قرآن #دعاء #IslamicReminder #Quran #حين_تعرف_الله #WhenYouKnowAllah',
};
// Mots-clés anglais des invocations (ce que les gens tapent dans la recherche).
const DUA_EN = {
  'دعاء قضاء الحاجة': 'Dua for needs', 'دعاء القلق': 'Dua for anxiety', 'دعاء الكرب': 'Dua for distress',
  'دعاء للوالدين': 'Dua for parents', 'دعاء الثبات': 'Dua for steadfastness', 'سيّد الاستغفار': 'Sayyid al-Istighfar, dua for forgiveness',
  'دعاء العلم': 'Dua for knowledge', 'دعاء الهمّ والحزن': 'Dua for worry and grief',
};
// Première ligne Instagram = mots-clés recherchés (arabe · anglais).
function keywordLine(x) {
  const tag = (x.tag || '').replace(/^[^\p{L}]+/u, '').trim();
  if (x.type === 'reel') return `${x.ref.replace(' · ', ' ')} · ${x.tr_ref.split(' · ')[0]} · Quran`;
  if (x.type === 'dua') return `${tag} · ${DUA_EN[tag] || 'Dua'}`;
  if (x.type === 'info') return `${tag} · ${x.title_en}`;
  return 'سؤال اليوم · Question of the day · تذكير';
}
function caption(x, ig) {
  const L = ig ? [keywordLine(x), ''] : [];
  if (x.type === 'reel') {
    L.push(plain(x.hook_ar) + ' 🤍', '', `﴿${x.lines.join(' ')}﴾ [${x.ref.replace(' · ', ': ')}]`, '', plain(x.refl_ar), '', plain(x.hook_en), plain(x.tr) + ` (${x.tr_ref.split(' · ')[0]})`, plain(x.refl_en));
  } else if (x.type === 'dua') {
    L.push(plain(x.hook_ar), '', x.quran ? `﴿${x.quran}﴾ [${x.ref.replace(' · ', ': ')}]` : `«${x.hadith}» (${x.ref})`);
    if (x.box_ar) L.push('', `${x.box_ar}${x.box_ref ? ` · ${x.box_ref}` : ''}`);
    L.push('', plain(x.hook_en), x.en || '');
    if (x.box_en) L.push(x.box_en);
    L.push('', 'قل: آمين 🤲 · Say Ameen');
  } else if (x.type === 'info') {
    L.push(`${x.tag} · ${plain(x.title_ar)}`, '');
    if (x.quran) L.push(`﴿${x.quran}﴾`, '');
    for (const it of x.items) L.push(`• ${it[0]}${it[1] ? ` (${it[1]})` : ''}`);
    L.push('', x.title_en, ...x.items.map((it) => `• ${it[2]}`));
  } else {
    L.push(plain(x.q_ar), plain(x.sub_ar), '', x.q_en, '', '👇 اكتب في التعليقات · Comment below');
  }
  if (x.type === 'reel') L.push('', TRACK_CREDIT);
  L.push('', ig ? '🤍 احفظ المنشور وشاركه · Save & share' : '🤍 شارك مع من يحتاجها · Share with someone who needs it', ig ? '🔔 تابع @whenyouknowallah' : '🔔 تابع « حين تعرف الله » لتذكير يومي', '', ig ? `.\n${TAGS_IG_BY[x.type]}` : TAGS_FB);
  return L.filter((l, i, a) => l !== '' || (a[i - 1] !== '' && i > 0)).join('\n');
}

const b = await chromium.launch();
for (const x of W) {
  const id = `out/${x.day}-${x.slot}-${x.type}`;
  writeFileSync(`${id}.fb.txt`, caption(x, false));
  writeFileSync(`${id}.ig.txt`, caption(x, true));
  if (x.type !== 'reel' && only !== 'reel') {
    const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
    writeFileSync(`${id}.html`, postHtml(x));
    await p.goto(`file://${D}/${id}.html`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${id}.png` });
    await p.close();
  }
  if (x.type === 'reel' && only !== 'post') {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    writeFileSync(`${id}.html`, reelHtml(x));
    await p.goto(`file://${D}/${id}.html`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const fr = `${id}-frames`;
    rmSync(fr, { recursive: true, force: true }); mkdirSync(fr);
    for (let i = 0; i < T * 30; i++) { await p.evaluate((t) => window.setT(t), i / 30); await p.screenshot({ path: `${fr}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 }); }
    await p.evaluate(() => window.setT(0));
    await p.screenshot({ path: `${id}.cover.png` });
    await p.close();
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', `${fr}/f%04d.jpg`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', `${id}-silent.mp4`]);
    withTrack(`${id}-silent.mp4`, `${id}.mp4`, T);
    rmSync(fr, { recursive: true, force: true }); rmSync(`${id}-silent.mp4`);
    console.log('reel', id);
  }
}
await b.close();
console.log('fini');
