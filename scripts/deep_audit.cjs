const fs = require('fs');

const items = JSON.parse(fs.readFileSync('./all_scraped_pages.json', 'utf-8'));

const activeContests = [];
const seenUUIDs = new Set();

items.forEach(it => {
  const text = it.rawSnippet
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  // Filter out convocations, results, and annulations
  const isConvocation = text.includes('convoqu') || text.includes('convocation') || text.includes('convoqués pour');
  const isResultat = text.includes('résultat') || text.includes('admis') || text.includes('résultats pour le concours');
  const isAnnulation = text.includes('Annulation') || text.includes('annulation du concours');

  if (isConvocation || isResultat || isAnnulation) {
    return;
  }

  // Must be an announcement / recruitment
  const lower = text.toLowerCase();
  if (!lower.includes('avis de concours') && !lower.includes('maître de conférences')) {
    return;
  }

  if (seenUUIDs.has(it.uuid)) {
    return;
  }
  seenUUIDs.add(it.uuid);

  activeContests.push({
    uuid: it.uuid,
    title: it.title || text.slice(0, 60),
    rawSnippet: text,
    dates: it.dates,
    posts: it.posts
  });
});

console.log('Total UNIQUE ACTIVE OPEN CONTESTS found across all 6 pages:', activeContests.length);
activeContests.forEach((c, i) => {
  console.log(`${i + 1}. [${c.uuid}] posts: ${c.posts}`);
});
