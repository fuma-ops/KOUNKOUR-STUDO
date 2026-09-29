const fs = require('fs');
const items = JSON.parse(fs.readFileSync('./all_scraped_pages.json', 'utf-8'));

console.log('Analyzing all items for final results vs in-progress stages:');

const finalResults = [];
const inProgressConvocations = [];
const openAnnouncements = [];

const seenUUIDs = new Set();

items.forEach(it => {
  if (seenUUIDs.has(it.uuid)) return;
  seenUUIDs.add(it.uuid);

  const text = it.rawSnippet
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
  
  if (text.toLowerCase().includes('résultats pour le concours') || 
      text.toLowerCase().includes('résultats définitifs') || 
      text.toLowerCase().includes('liste des admis')) {
    finalResults.push({ uuid: it.uuid, snippet: text.slice(0, 120) });
  } else if (text.toLowerCase().includes('convoqués pour') || 
             text.toLowerCase().includes('convoqués à l') ||
             text.toLowerCase().includes('convocation')) {
    inProgressConvocations.push({ uuid: it.uuid, snippet: text, posts: it.posts });
  } else if (text.toLowerCase().includes('avis de concours') || text.toLowerCase().includes('maître de conférences')) {
    openAnnouncements.push({ uuid: it.uuid, snippet: text, posts: it.posts });
  }
});

console.log(`\n=== 1. FINAL RESULTS (Totalement clôturés / Admis définitifs connus): ${finalResults.length} ===`);
finalResults.forEach((r, i) => console.log(`${i+1}. [${r.uuid.slice(0,8)}] ${r.snippet}`));

console.log(`\n=== 2. IN-PROGRESS CONTESTS (En cours: Convoqués écrit / attente oral): ${inProgressConvocations.length} ===`);
inProgressConvocations.forEach((c, i) => {
  console.log(`${i+1}. [${c.uuid.slice(0,8)}] (${c.posts} postes) -> ${c.snippet.slice(0, 140)}`);
});
