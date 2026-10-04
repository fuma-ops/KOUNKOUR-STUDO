// Tests de l'extraction d'une page d'annonce (texte + fichiers de l'arrêté) : npm run test:announcement
import { extractAnnouncement, originalWpImage } from '../api/_lib/announcement.ts';

let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ` — ${detail}`}`);
  if (!ok) failed++;
};

const page = `<!doctype html><html><head><script>var x=1</script></head><body>
<header><img src="/wp-content/uploads/2024/01/logo-dreamjob.png" width="180"></header>
<nav><a href="/emploi-public/">Emploi public</a></nav>
<article><div class="entry-content">
  <h1>Concours de Recrutement SRM Marrakech – Safi 2026 (321 Postes)</h1>
  <p>La Société Régionale Multiservices Marrakech-Safi organise un concours.</p>
  <p>Dernier délai : 15 octobre 2026</p>
  <figure><img width="1024" height="1448" src="https://www.dreamjob.ma/wp-content/uploads/2026/09/srm-ms-1-724x1024.jpg"
    srcset="https://www.dreamjob.ma/wp-content/uploads/2026/09/srm-ms-1-212x300.jpg 212w, https://www.dreamjob.ma/wp-content/uploads/2026/09/srm-ms-1-724x1024.jpg 724w"></figure>
  <img class="lazy" data-src="https://www.dreamjob.ma/wp-content/uploads/2026/09/srm-ms-2.jpg" src="data:image/gif;base64,R0lG">
  <p><a href="https://www.srm-ms.ma/wp-content/uploads/2026/09/avis-recrutement.pdf">Télécharger l'avis</a></p>
  <p><img src="https://www.dreamjob.ma/wp-content/uploads/whatsapp-icon.png" width="32"></p>
  <table><tr><td>Ingénieur</td><td>Génie civil</td><td>4</td></tr></table>
  <div class="share-buttons"><a href="https://facebook.com/sharer">Partager</a></div>
</div></article>
<aside class="sidebar"><img src="https://www.dreamjob.ma/wp-content/uploads/pub-banner.jpg" width="300"></aside>
<footer>© dreamjob</footer></body></html>`;

const r = extractAnnouncement(page, 'https://www.dreamjob.ma/emploi-public/concours-srm-marrakech-safi-2026/');
check('texte de l’annonce lu', r.text.includes('321 Postes') && r.text.includes('Dernier délai : 15 octobre 2026'), r.text);
check('ligne de tableau conservée', r.text.includes('Ingénieur | Génie civil | 4'), r.text);
check('menu, pied de page et scripts exclus', !r.text.includes('© dreamjob') && !r.text.includes('var x'), r.text);
const urls = r.media.map((m) => m.url);
check('image de l’arrêté en taille originale (pas la miniature)', urls.includes('https://www.dreamjob.ma/wp-content/uploads/2026/09/srm-ms-1.jpg'), urls.join(' | '));
check('image chargée en différé (data-src) trouvée', urls.includes('https://www.dreamjob.ma/wp-content/uploads/2026/09/srm-ms-2.jpg'), urls.join(' | '));
check('PDF de l’avis trouvé', r.media.some((m) => m.kind === 'pdf' && m.url.endsWith('avis-recrutement.pdf')), urls.join(' | '));
check('logo, icône, bannière pub exclus', !urls.some((u) => /logo|whatsapp|pub-banner/.test(u)), urls.join(' | '));
check('miniature WordPress → original', originalWpImage('https://x.ma/a/img-300x200.png?v=2') === 'https://x.ma/a/img.png?v=2');
check('page sans fichier', extractAnnouncement('<html><body><main><p>Avis de concours pour le recrutement de 3 techniciens spécialisés.</p></main></body></html>', 'https://www.emploi-public.ma/fr/x').media.length === 0);

console.log(failed ? `\n${failed} échec(s)` : '\nTous les tests d’extraction passent.');
process.exit(failed ? 1 : 0);
