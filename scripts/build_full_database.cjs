const fs = require('fs');

const items = JSON.parse(fs.readFileSync('./all_scraped_pages.json', 'utf-8'));

// Filter out final results (admis définitifs) and annulations
const filteredItems = items.filter(it => {
  const text = it.rawSnippet
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
  
  if (text.toLowerCase().includes('résultats pour le concours') ||
      text.toLowerCase().includes('résultats définitifs') ||
      text.toLowerCase().includes('liste des admis')) {
    return false; // EXCLUDE FINAL RESULTS
  }

  if (text.toLowerCase().includes('annulation')) {
    return false; // EXCLUDE ANNULATIONS
  }

  return true;
});

console.log('Filtered items count (after excluding final results & annulations):', filteredItems.length);

// Now categorize items
const openContests = [];
const inProgressContests = [];
const closedContests = [];
const seenUUIDs = new Set();

filteredItems.forEach(it => {
  if (seenUUIDs.has(it.uuid)) return;
  seenUUIDs.add(it.uuid);

  const text = it.rawSnippet
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  const isConvocation = text.toLowerCase().includes('convoqués pour') ||
                        text.toLowerCase().includes('convoqués à l') ||
                        text.toLowerCase().includes('convocation');

  if (isConvocation) {
    const isOral = text.toLowerCase().includes('oral') || text.toLowerCase().includes('entretien');
    inProgressContests.push({ ...it, isOral });
  } else {
    // Check deadline
    const limitMatch = text.match(/Limite de dépôt\s*:\s*(\d{1,2}\s+[a-zA-ZÀ-ÿ]+\s+\d{4})/i);
    const limit = limitMatch ? limitMatch[1] : '';
    const isPast = limit.includes('Septembre') && parseInt(limit) < 29;

    if (isPast) {
      closedContests.push(it);
    } else {
      openContests.push(it);
    }
  }
});

console.log(`Open (Dépôt en cours): ${openContests.length}`);
console.log(`In-Progress (Épreuves écrites / orales - Douanes etc.): ${inProgressContests.length}`);
console.log(`Closed (Archives): ${closedContests.length}`);
