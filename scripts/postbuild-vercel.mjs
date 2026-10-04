// Vercel sert un fichier statique avant toute réécriture : on renomme
// index.html en app.html pour que chaque page passe par api/seo.ts (rendu
// serveur), qui réutilise app.html comme gabarit.
import { renameSync, existsSync, readFileSync } from 'node:fs';
if (!existsSync('dist/index.html')) throw new Error('dist/index.html introuvable : lancer vite build avant');
const html = readFileSync('dist/index.html', 'utf8');
// Le repli de api/_lib/seo.ts suppose ces noms fixes : on refuse un build qui ne les a pas.
for (const asset of ['/assets/app.js', '/assets/app.css']) {
  if (!html.includes(asset) || !existsSync(`dist${asset}`)) throw new Error(`${asset} absent du build`);
}
renameSync('dist/index.html', 'dist/app.html');
console.log('postbuild : dist/index.html -> dist/app.html');
