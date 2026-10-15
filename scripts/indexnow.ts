// Signale à Bing (et aux moteurs IndexNow : Yandex, Seznam, Naver…) toutes les URL du sitemap.
// Google n'utilise pas IndexNow : pour Google, soumettre le sitemap dans Search Console.
// Usage : npx tsx scripts/indexnow.ts [https://domaine]   (après le déploiement)
const KEY = 'd6a72f6b77433b9c8a9187cae5c72b0b'; // clé publique par conception, servie par public/d6a72f6b77433b9c8a9187cae5c72b0b.txt
const base = (process.argv[2] || process.env.SITE_URL || 'https://kounkour-studo.vercel.app').replace(/\/+$/, '');

const xml = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
const host = new URL(base).host;
for (let i = 0; i < urls.length; i += 10000) {
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key: KEY, keyLocation: `${base}/${KEY}.txt`, urlList: urls.slice(i, i + 10000) }),
  });
  console.log(`IndexNow : ${Math.min(urls.length - i, 10000)} URL envoyées → HTTP ${r.status}`);
}
