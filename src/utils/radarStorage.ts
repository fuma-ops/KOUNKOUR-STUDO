import { Contest, ContestStatus, ContestExamItem } from '../types';
import { ScrapeSource, ScrapedContestItem, ScrapeLogEntry } from '../types/radar';
import { mockContests } from '../data/mockContests';

// Sources RÉELLEMENT scrapables par /api/radar/scrape-live (?source=scanKey).
// Aucune statistique inventée : dernier scan et nombre d'annonces sont calculés
// à partir des scans réellement lancés (voir loadSourceScanStats).
export const OFFICIAL_RADAR_SOURCES: ScrapeSource[] = [
  {
    id: 'src-emploi-public',
    scanKey: 'emploi-public',
    name: {
      fr: 'Portail National emploi-public.ma',
      ar: 'البوابة الوطنية للتشغيل العمومي',
    },
    domain: 'emploi-public.ma',
    url: 'https://www.emploi-public.ma/fr/concours-liste',
    category: 'official_portal',
    status: 'online',
    lastScrapeTime: '',
    itemsDetectedCount: 0,
    frequencyMinutes: 0,
    uptimePercent: 0,
    logo: '🏛️',
    description: {
      fr: 'Source officielle centrale des concours de la fonction publique et des collectivités territoriales.',
      ar: 'المصدر الرسمي المركزي لمباريات الوظيفة العمومية والجماعات الترابية.',
    },
  },
  {
    id: 'src-dreamjob',
    scanKey: 'dreamjob',
    name: {
      fr: 'dreamjob.ma — Emploi public',
      ar: 'dreamjob.ma — التوظيف العمومي',
    },
    domain: 'dreamjob.ma',
    url: 'https://www.dreamjob.ma/emploi-public/',
    category: 'aggregator',
    status: 'online',
    lastScrapeTime: '',
    itemsDetectedCount: 0,
    frequencyMinutes: 0,
    uptimePercent: 0,
    logo: '🔎',
    description: {
      fr: 'Agrégateur (non officiel) : sert à découvrir les concours absents d’emploi-public. La source officielle est exigée avant publication.',
      ar: 'موقع تجميعي غير رسمي لاكتشاف المباريات الغائبة؛ يشترط المصدر الرسمي قبل النشر.',
    },
  },
];

// Dernier scan réel par source (sur cet appareil).
export interface SourceScanStat {
  at: string; // ISO
  found: number;
  inserted: number;
  persisted: boolean;
  robotsAllowed: boolean;
}
const SOURCE_STATS_KEY = 'kounkour_radar_source_stats_v1';

export function loadSourceScanStats(): Record<string, SourceScanStat> {
  try {
    const raw = localStorage.getItem(SOURCE_STATS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSourceScanStat(sourceId: string, stat: SourceScanStat): Record<string, SourceScanStat> {
  const all = { ...loadSourceScanStats(), [sourceId]: stat };
  try {
    localStorage.setItem(SOURCE_STATS_KEY, JSON.stringify(all));
  } catch {
    /* stockage indisponible : l'affichage reste correct pour la session */
  }
  return all;
}

import realScrapedFeedData from '../data/realScrapedFeed.json';

// Parse une date FR ("5 Octobre 2026 - 16:30", "19 Septembre 2026") en Date, ou
// null si non parsable (on ne devine JAMAIS une date).
const FR_MONTHS: Record<string, number> = {
  janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10,
  décembre: 11, decembre: 11,
};
export function parseFrenchDate(text: any): Date | null {
  if (!text || typeof text !== 'string') return null;
  const m = text.match(/(\d{1,2})(?:er)?\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = FR_MONTHS[m[2].toLowerCase()];
    const year = parseInt(m[3], 10);
    if (month !== undefined && day >= 1 && day <= 31) return new Date(year, month, day, 23, 59, 59);
  }
  const n = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\b/);
  if (n) {
    const day = parseInt(n[1], 10);
    const month = parseInt(n[2], 10) - 1;
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) return new Date(parseInt(n[3], 10), month, day, 23, 59, 59);
  }
  return null;
}

// Jours restants RÉELS calculés depuis la date limite (plus de valeur figée).
function computeDaysRemaining(deadlineDate: any, fallback: any): number {
  const d = parseFrenchDate(deadlineDate);
  if (!d) return typeof fallback === 'number' ? fallback : 0;
  const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  return diff > 0 ? diff : 0;
}

// Confiance d'extraction HONNÊTE : proportion des champs clés réellement présents
// (plus de « 100 » codé en dur).
function computeConfidence(item: any): number {
  const checks = [
    !!(item.title?.fr || typeof item.title === 'string'),
    !!(item.administration?.name?.fr || item.administration?.name),
    !!parseFrenchDate(item.deadlineDate),
    !!(item.specialty?.fr || item.specialty),
    !!item.degreeLevel,
    typeof item.postsCount === 'number',
  ];
  const score = checks.filter(Boolean).length / checks.length;
  return Math.round(score * 100);
}

export function normalizeScrapedItem(item: any): ScrapedContestItem {
  if (!item) return {} as any;
  // ID déterministe (jamais aléatoire) : dérivé de l'URL source si pas d'id.
  const extFromUrl = (item.officialSourceUrl || item.sourceUrl || '').match(/details\/([0-9a-f-]{8,})/i)?.[1];
  const rawId = item.id || (extFromUrl ? `scrape-${extFromUrl}` : `scrape-${item.slug || 'inconnu'}`);
  const cleanId = rawId.startsWith('scrape-') ? rawId : `scrape-${rawId.replace(/^c-scraped-/, '').replace(/^c-/, '')}`;
  
  const titleFr = item.title?.fr || (typeof item.title === 'string' ? item.title : 'Concours de recrutement');
  const titleAr = item.title?.ar || titleFr;

  const adminNameFr = item.administration?.name?.fr || (typeof item.administration?.name === 'string' ? item.administration?.name : 'Administration Publique Marocaine');
  const adminNameAr = item.administration?.name?.ar || adminNameFr;

  // Spécialités réelles
  const rawSpecs: string[] = [];
  if (Array.isArray(item.specialtiesList) && item.specialtiesList.length > 0) {
    rawSpecs.push(...item.specialtiesList);
  } else if (Array.isArray(item.specialty) && item.specialty.length > 0) {
    rawSpecs.push(...item.specialty);
  }
  const cleanSpecs = rawSpecs.filter((s) => Boolean(s && !s.toLowerCase().includes('mentionnée') && !s.toLowerCase().includes('mentionnee')));
  const specFr = cleanSpecs.length > 0 ? cleanSpecs.join(', ') : (item.specialty?.fr || (typeof item.specialty === 'string' && !item.specialty.includes('mentionnée') ? item.specialty : ''));
  const specAr = item.specialty?.ar || specFr;

  const regFr = item.region?.fr || (typeof item.region === 'string' && !item.region.includes('National') ? item.region : '');
  const regAr = item.region?.ar || regFr;

  const grade = item.grade || item.grade_fr || undefined;
  // Diplôme : uniquement celui lu dans l'annonce (jamais déduit du grade).
  const degreeLevel = item.degreeLevel || '';

  let snippetFr = '';
  let snippetAr = '';
  if (item.rawSnippet) {
    if (typeof item.rawSnippet === 'string') {
      snippetFr = item.rawSnippet;
      snippetAr = item.rawSnippet;
    } else {
      snippetFr = item.rawSnippet.fr || item.rawSnippet.ar || '';
      snippetAr = item.rawSnippet.ar || item.rawSnippet.fr || '';
    }
  }
  if (!snippetFr) {
    if (item.overviewSummary) {
      snippetFr = item.overviewSummary.fr || '';
      snippetAr = item.overviewSummary.ar || '';
    } else {
      snippetFr = `${titleFr}. ${adminNameFr}. ${item.postsCount || 1} poste(s). ${specFr ? `Spécialités : ${specFr}.` : ''}`.trim();
      snippetAr = `${titleAr}. ${adminNameAr}.`;
    }
  }

  const realImage = item.image || (typeof item.administration?.logo === 'string' && (item.administration.logo.startsWith('http') || (item.administration.logo.startsWith('/') && item.administration.logo !== '/images/administrations/logo-013.png')) ? item.administration.logo : undefined);
  const resolvedLogo = realImage || resolveAdministrationLogo(adminNameFr, item.administration?.category, titleFr);

  return {
    id: cleanId,
    sourceId: item.sourceId || 'src-emploi-public',
    sourceName: item.sourceName || 'emploi-public.ma',
    sourceUrl: item.sourceUrl || item.officialSourceUrl || 'https://www.emploi-public.ma',
    scrapedAt: item.scrapedAt || 'Aujourd’hui',
    referenceCode: item.referenceCode || '',
    image: realImage || resolvedLogo,
    title: { fr: titleFr, ar: titleAr },
    administration: {
      id: item.administration?.id || 'adm-ep',
      name: { fr: adminNameFr, ar: adminNameAr },
      category: item.administration?.category || 'administration',
      logo: resolvedLogo,
    },
    postsCount: typeof item.postsCount === 'number' ? item.postsCount : 1,
    degreeLevel,
    specialty: { fr: specFr, ar: specAr },
    specialtiesList: cleanSpecs.length > 0 ? cleanSpecs : (item.specialtiesList || []),
    region: { fr: regFr, ar: regAr },
    publicationDate: item.publicationDate || '',
    deadlineDate: item.deadlineDate || '',
    daysRemaining: computeDaysRemaining(item.deadlineDate, item.daysRemaining),
    parsingConfidence: computeConfidence(item),
    status: (item.status === 'imported' ? 'imported' : 'pending_review'),
    matchedRules: Array.isArray(item.matchedRules) ? item.matchedRules : [],
    possibleDuplicate: item.possibleDuplicate || null,
    rawSnippet: { fr: snippetFr, ar: snippetAr || snippetFr },
    grade,
    recruitmentType: item.recruitmentType || undefined,
    depositType: item.depositType || undefined,
    depositSite: item.depositSite || item.applyUrl || undefined,
    applyUrl: item.applyUrl || item.depositSite || undefined,
    arreteUrl: item.arreteUrl || undefined,
    contestDate: item.contestDate || item.examDate || undefined,
  };
}

export const INITIAL_SCRAPED_ITEMS: ScrapedContestItem[] = Array.isArray(realScrapedFeedData) 
  ? (realScrapedFeedData as any[]).map(normalizeScrapedItem)
  : [];

const STORAGE_KEYS = {
  SCRAPES: 'kounkour_radar_scrapes_v1',
  LOGS: 'kounkour_radar_logs_v1',
  IMPORTED: 'kounkour_imported_contests_v1',
};

export function loadScrapedItems(): ScrapedContestItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCRAPES);
    if (!raw) return INITIAL_SCRAPED_ITEMS;
    const list: any[] = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return INITIAL_SCRAPED_ITEMS;
    return list.map(normalizeScrapedItem);
  } catch (e) {
    console.error('Error loading scraped items', e);
    return INITIAL_SCRAPED_ITEMS;
  }
}

export function saveScrapedItems(items: ScrapedContestItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SCRAPES, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving scraped items', e);
  }
}

export function loadScrapeLogs(): ScrapeLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    // Pas de journal d'exemple : seuls les vrais scans y figurent.
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((l: any) => !/^log-[1-4]$/.test(l?.id)) : [];
  } catch (e) {
    return [];
  }
}

export function saveScrapeLogs(logs: ScrapeLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 50)));
  } catch (e) {
    console.error('Error saving logs', e);
  }
}

export function loadImportedContests(): Contest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.IMPORTED);
    if (!raw) return [];
    const list: Contest[] = JSON.parse(raw);
    
    // Filter out final results and annulations
    return list
      .filter((c) => {
        const title = (c.title?.fr || '').toLowerCase();
        if (title.includes('résultats définitifs') || title.includes('liste des admis définitifs') || title.includes('annulation')) {
          return false;
        }
        return true;
      })
      .map((c) => {
        const official = mockContests.find((m) => 
          m.id === c.id || 
          m.referenceCode === c.referenceCode || 
          (c.id && m.id && c.id.replace('c-', '').replace('scrape-', '').replace('ep-', '') === m.id.replace('ep-', '').replace('scrape-', ''))
        );
        if (official) {
          return {
            ...c,
            // specialty preserved permanently from scraped announcement
            region: official.region,
            location: official.location,
            referenceCode: official.referenceCode,
            documents: official.documents,
            exams: official.exams,
            criteria: official.criteria,
            overviewSummary: official.overviewSummary,
            administration: {
              ...c.administration,
              officialWebsite: official.administration.officialWebsite || c.administration.officialWebsite,
            },
          };
        }
        return c;
      });
  } catch (e) {
    return [];
  }
}

export function saveImportedContests(contests: Contest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.IMPORTED, JSON.stringify(contests));
  } catch (e) {
    console.error('Error saving imported contests', e);
  }
}

// Résolution dynamique des emblèmes et logos officiels marocains
export function resolveAdministrationLogo(adminName: string = '', category: string = '', title: string = ''): string {
  const raw = `${adminName} ${title}`.toLowerCase();
  const text = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // 1. Royal Air Maroc / RAM Maintenance / ONDA / Aviation civile / Transport Aérien
  if (text.includes('royal air maroc') || text.includes('ram maintenance') || text.includes('ram handling') || text.includes('ram cargo') || text.includes('air maroc') || text.includes('onda') || text.includes('aeronautique') || text.includes('aviation civile')) {
    return '/images/administrations/logo-ram.svg';
  }

  // 2. Forces Armées Royales / FAR / Défense / Gendarmerie
  if (text.includes('far ma') || text.includes('forces armees') || text.includes('recrutement far') || text.includes('gendarmerie') || text.includes('defense nationale') || text.includes('marine royale') || text.includes('forces royales air')) {
    return '/images/administrations/673d4e683bf65fbf906fa190831359e7.png';
  }

  // 3. Sûreté Nationale / Police / DGSN
  if (text.includes('dgsn') || text.includes('police') || text.includes('surete nationale') || text.includes('امن وطني') || text.includes('شرطة') || text.includes('gardien de la paix') || text.includes('officier de paix') || text.includes('commissaire de police')) {
    return '/images/administrations/logo-031.png';
  }

  // 4. Protection Civile
  if (text.includes('protection civile') || text.includes('وقاية مدنية')) {
    return '/images/administrations/logo-044.png';
  }

  // 5. Enseignement Supérieur / Universités / Facultés / Écoles Nationales
  if (text.includes('universite') || text.includes('faculte') || text.includes('chouaib doukkali') || text.includes('chouaib') || text.includes('hassan 1er') || text.includes('hassan premier') || text.includes('hassan ii') || text.includes('mohammed v') || text.includes('cadi ayyad') || text.includes('ibn tofail') || text.includes('sidi mohamed') || text.includes('abdelmalek') || text.includes('maitre de conference') || text.includes('enseignement superieur') || text.includes('institut national') || text.includes('ecole nationale') || text.includes('enta') || text.includes('ensam') || text.includes('encg') || text.includes('ensa') || text.includes('fste') || text.includes('fst ')) {
    return '/images/administrations/logo-008.png';
  }

  // 6. Équipement / Transport / Autoroutes du Maroc / ANP / Ports / Logistique / ONCF / ONEE
  if (text.includes('autoroute') || text.includes('port ') || text.includes('ports') || text.includes('anp') || text.includes('equipement') || text.includes('transport') || text.includes('oncf') || text.includes('onee') || text.includes('ancfcc') || text.includes('logistique') || text.includes('marsa maroc')) {
    return '/images/administrations/logo-019.png';
  }

  // 7. Finances / Économie / Douane / Impôts / Trésorerie / CDG / Bank Al-Maghrib
  if (text.includes('douan') || text.includes('finance') || text.includes('economie') || text.includes('impot') || text.includes('tresorerie') || text.includes('cdg') || text.includes('bank al maghrib') || text.includes('ministere de l economie') || category === 'finances') {
    return '/images/administrations/logo-013.png';
  }

  // 8. Agriculture / Pêche Maritime / Foodex / EACCE / ORMVA / Eaux et Forêts / ONSSA
  if (text.includes('agriculture') || text.includes('peche') || text.includes('foodex') || text.includes('eacce') || text.includes('ormva') || text.includes('onssa') || text.includes('eaux et forets') || text.includes('developpement rural') || text.includes('agronome') || text.includes('agricole')) {
    return '/images/administrations/logo-011.png';
  }

  // 9. Santé / CHU / Hôpitaux / Médecins / Infirmiers
  if (text.includes('sante') || text.includes('chu ') || text.includes('centre hospitalier') || text.includes('medical') || text.includes('soins') || text.includes('صحة') || text.includes('medecin') || text.includes('infirmier') || category === 'sante') {
    return '/images/administrations/logo-005.png';
  }

  // 10. Éducation Nationale / Préscolaire / AREF / Académies
  if (text.includes('education nationale') || text.includes('prescolaire') || text.includes('aref') || text.includes('academie regionale') || text.includes('تعليم') || (text.includes('sport') && !text.includes('transport'))) {
    return '/images/administrations/logo-006.png';
  }

  // 11. Justice / Tribunaux / Cours / Greffiers
  if (text.includes('justice') || text.includes('tribunal') || text.includes('cour ') || text.includes('greffier') || text.includes('عدل') || text.includes('commissaire judiciaire')) {
    return '/images/administrations/logo-017.png';
  }

  // 12. Affaires Étrangères / Coopération / MRE / Diplomatie
  if (text.includes('affaires etrangeres') || text.includes('etrangeres') || text.includes('mre') || text.includes('cooperation africaine') || text.includes('diplomatie') || text.includes('consulat') || text.includes('ambassade')) {
    return '/images/administrations/logo-023.png';
  }

  // 13. HCP / Haut-Commissariat au Plan
  if (text.includes('hcp') || text.includes('haut commissariat') || text.includes('statistique')) {
    return '/images/administrations/logo-024.png';
  }

  // 14. Intérieur / Collectivités Territoriales / Communes / Préfectures / Provinces
  // NOTE: On vérifie explicitement les termes de l'Intérieur / Communes, PAS juste le mot "région" dans le texte !
  if (
    text.includes('ministere de l interieur') || 
    text.includes('ministere de linterieur') || 
    text.includes('interieur') ||
    text.includes('wilaya') || 
    text.includes('prefecture') || 
    text.includes('province de') || 
    text.includes('commune de') || 
    text.includes('commune urbaine') || 
    text.includes('commune rurale') || 
    text.includes('conseil communal') || 
    text.includes('conseil provincial') || 
    text.includes('conseil de la region') || 
    text.includes('conseil regional') || 
    category === 'collectivites'
  ) {
    return '/images/administrations/logo-003.png';
  }

  // 15. Agences Urbaines, Établissements Publics, SRM, MAP, Offices
  if (text.includes('srm') || text.includes('agence urbaine') || text.includes('agence') || text.includes('office') || text.includes('map ') || text.includes('maghreb arabe presse') || text.includes('etablissement') || category === 'entreprises' || category === 'autres') {
    return '/images/administrations/logo-045.png';
  }
  
  // Emblème officiel du Royaume du Maroc par défaut
  return '/images/administrations/Ministre-sm-default-image.jpg';
}

// Convert a scraped contest to full Contest model and add to imported contests
export function importScrapedContestToCatalog(item: ScrapedContestItem): Contest {
  const adminName = item.administration?.name?.fr || '';
  const adminCat = item.administration?.category || '';
  const itemTitle = item.title?.fr || '';
  const realScrapedImage = item.image || (item.administration?.logo?.startsWith('http') ? item.administration.logo : undefined);
  const resolvedLogo = realScrapedImage || resolveAdministrationLogo(adminName, adminCat, itemTitle);

  // Check if official full record exists in mockContests
  const official = mockContests.find((m) => 
    m.id === item.id || 
    m.referenceCode === item.referenceCode || 
    m.id.includes(item.id.replace('scrape-', ''))
  );

  if (official) {
    const current = loadImportedContests();
    const filtered = current.filter((c) => c.id !== official.id);
    const updatedOfficial: Contest = {
      ...official,
      image: realScrapedImage || official.image || resolvedLogo,
      specialty: item.specialty || official.specialty,
    };
    const next = [updatedOfficial, ...filtered];
    saveImportedContests(next);

    const scraped = loadScrapedItems();
    const updatedScraped = scraped.map((s) => (s.id === item.id ? { ...s, status: 'imported' as const } : s));
    saveScrapedItems(updatedScraped);
    return updatedOfficial;
  }

  const days = computeDaysRemaining(item.deadlineDate, item.daysRemaining);
  const derivedStatus: any = (item.stage === 'ecrit' || item.stage === 'oral')
    ? 'in_progress'
    : days <= 0
    ? 'closed'
    : days <= 7
    ? 'closing_soon'
    : 'open';

  const newContest: Contest = {
    id: item.id.replace('scrape-', 'c-'),
    slug: item.id.replace('scrape-', 'concours-officiel-'),
    referenceCode: item.referenceCode || '',
    image: realScrapedImage || resolvedLogo,
    title: item.title,
    administration: {
      id: item.administration?.id || 'adm-custom',
      name: item.administration?.name || { fr: adminName, ar: adminName },
      shortName: item.administration?.name || { fr: adminName, ar: adminName },
      logo: realScrapedImage || resolvedLogo,
      category: (item.administration?.category as any) || 'administration',
      officialWebsite: item.sourceUrl || '',
    },
    type: {
      fr: 'Recrutement officiel sur concours',
      ar: 'مباراة توظيف رسمية',
    },
    status: derivedStatus,
    postsCount: item.postsCount || 0,
    degreeLevel: item.degreeLevel || '',
    grade: item.grade || undefined,
    grade_fr: item.grade || undefined,
    recruitmentType: item.recruitmentType || undefined,
    depositType: item.depositType || undefined,
    depositSite: item.depositSite || item.applyUrl || undefined,
    applyUrl: item.depositSite || item.applyUrl || undefined,
    specialtiesList: item.specialtiesList || [],
    specialty: item.specialty || { fr: '', ar: '' },
    region: item.region || { fr: '', ar: '' },
    location: item.region || { fr: '', ar: '' },
    publicationDate: item.publicationDate || '',
    deadlineDate: item.deadlineDate || '',
    daysRemaining: days,
    contestDate: item.contestDate || '',
    isVerifiedSource: true,
    officialSourceUrl: item.sourceUrl,
    overviewSummary: {
      fr: item.rawSnippet?.fr || '',
      ar: item.rawSnippet?.ar || '',
    },
    criteria: {
      nationality: { fr: '', ar: '' },
      ageLimit: { fr: '', ar: '' },
      diplomas: item.degreeLevel ? [{ fr: item.degreeLevel, ar: item.degreeLevel }] : [],
      experience: { fr: '', ar: '' },
      specialties: item.specialtiesList && item.specialtiesList.length > 0
        ? item.specialtiesList.map((s) => ({ fr: s, ar: s }))
        : item.specialty ? [{ fr: item.specialty.fr, ar: item.specialty.ar }] : [],
    },
    exams: {
      written: [],
      oral: [],
    },
    documents: item.arreteUrl ? [
      {
        id: `doc-${item.id}-avis`,
        title: {
          fr: `Arrêté officiel d'ouverture du concours ${item.referenceCode ? `(${item.referenceCode})` : ''}`.trim(),
          ar: `قرار فتح المباراة الرسمي ${item.referenceCode ? `(${item.referenceCode})` : ''}`.trim(),
        },
        fileType: 'pdf',
        url: item.arreteUrl,
        date: item.publicationDate || '',
      },
    ] : [],
    isDemo: false,
  };

  // Add to imported list
  const current = loadImportedContests();
  const filtered = current.filter((c) => c.id !== newContest.id);
  const next = [newContest, ...filtered];
  saveImportedContests(next);

  // Mark scraped item as imported
  const scraped = loadScrapedItems();
  const updatedScraped = scraped.map((s) => (s.id === item.id ? { ...s, status: 'imported' as const } : s));
  saveScrapedItems(updatedScraped);

  return newContest;
}

// Get all contests combined (base mock + imported from radar) with sanitized fields
export function getAllActiveContests(): Contest[] {
  const deletedIds = new Set(getDeletedContestIds());
  const imported = loadImportedContests().filter((c) => !deletedIds.has(c.id)).map(sanitizeContestFields);
  // Aucun concours d'exemple (mockContests) : seuls les concours réels importés
  // localement, en attendant ceux publiés dans Supabase.
  let all = [...imported];

  // Apply overrides from admin modifications
  try {
    const rawOverrides = localStorage.getItem('kounkour_contest_overrides');
    if (rawOverrides) {
      const overrides: Record<string, Contest> = JSON.parse(rawOverrides);
      all = all.map((c) => overrides[c.id] || overrides[c.id.replace(/^c-/, '')] || c);
    }
  } catch (e) {
    console.warn('Could not parse contest overrides', e);
  }

  // Strictly filter out final results (admis définitifs) and annulations
  return all.filter((c) => {
    const title = (c.title?.fr || '').toLowerCase();
    if (title.includes('résultats définitifs') || title.includes('liste des admis définitifs') || title.includes('annulation')) {
      return false;
    }
    return true;
  });
}

export function sanitizeContestFields(c: Contest): Contest {
  const updated = { ...c };

  // Ensure postsCount is valid
  if (!updated.postsCount || updated.postsCount < 1) {
    const summary = updated.overviewSummary?.fr || '';
    const pm = summary.match(/(\d+)\s*postes?/i);
    updated.postsCount = pm ? parseInt(pm[1], 10) : 0;
  }

  // Référence : jamais inventée au hasard. Vide si absente (l'UI gère l'absence).
  if (!updated.referenceCode || updated.referenceCode.length < 3) {
    updated.referenceCode = '';
  }

  const titleFr = updated.title?.fr || '';

  // Grade manquant : recopié tel quel du titre s'il y figure (« … grade », « échelle N »)
  if (!updated.grade_fr || updated.grade_fr.length < 3) {
    const gm = titleFr.match(/(?:recrutement\s+(?:de\s+|d['’])?)?([A-ZÀ-ÿ][a-zà-ÿA-Z0-9\s'’\-]+(?:grade|echelle\s*\d+|échelle\s*\d+)[a-zà-ÿA-Z0-9\s'’\-]*)/i);
    if (gm && gm[1]) {
      updated.grade_fr = gm[1].trim();
      updated.grade = updated.grade_fr;
    }

  }

  // Nettoyage des régions par défaut génériques
  if (updated.region?.fr && (/National/i.test(updated.region.fr) || /Régions du Royaume/i.test(updated.region.fr))) {
    updated.region = { fr: '', ar: '' };
    updated.location = { fr: '', ar: '' };
  }

  // Purge définitive de toute chaîne placeholder "Spécialités mentionnées dans l’arrêté"
  if (updated.specialty?.fr && (/mentionn/i.test(updated.specialty.fr) || /non specifi/i.test(updated.specialty.fr))) {
    if (updated.specialtiesList && updated.specialtiesList.length > 0) {
      updated.specialty = { fr: updated.specialtiesList.join(', '), ar: updated.specialtiesList.join(', ') };
    } else {
      updated.specialty = { fr: '', ar: '' };
    }
  }
  if (updated.specialtiesList) {
    updated.specialtiesList = updated.specialtiesList.filter((s) => !s.toLowerCase().includes('mentionn'));
  }

  // Arrêté officiel PDF : attachement automatique pour tout concours emploi-public.ma
  const epMatch = (updated.officialSourceUrl || '').match(/details\/([0-9a-f-]{36})/i);
  if (epMatch) {
    const epId = epMatch[1];
    const officialArreteUrl = `https://www.emploi-public.ma/fr/concours/download/arrete/${epId}`;
    if (!updated.arreteUrl) {
      updated.arreteUrl = officialArreteUrl;
    }
    if (!updated.documents || updated.documents.length === 0) {
      updated.documents = [
        {
          id: `arrete-${epId}`,
          title: {
            fr: "Arrêté d'ouverture du concours (قرار فتح المباراة)",
            ar: 'قرار فتح وإجراء المباراة الرسمي (PDF)',
          },
          fileType: 'PDF Officiel',
          fileSize: 'Document officiel',
          date: updated.publicationDate || '',
          url: officialArreteUrl,
        },
      ];
    }
  }

  // Résolution et préservation propre de l'image réelle de l'annonce ou emblème officiel
  const hasValidExternalScrapedImage = !!(updated.image && updated.image.startsWith('http'));
  const adminFr = updated.administration?.name?.fr || (updated as any).source_org || '';
  const adminCat = updated.administration?.category || '';
  const tFr = updated.title?.fr || '';
  const resolved = resolveAdministrationLogo(adminFr, adminCat, tFr);

  if (!hasValidExternalScrapedImage) {
    updated.image = resolved;
  }
  if (!updated.administration?.logo || !updated.administration.logo.startsWith('http')) {
    updated.administration = {
      ...updated.administration,
      logo: resolved,
    };
  }

  return updated;
}

// Batch import multiple scraped contests to active catalog
export function importMultipleScrapedContestsToCatalog(items: ScrapedContestItem[]): Contest[] {
  if (!items || items.length === 0) return [];
  const current = loadImportedContests();
  const currentMap = new Map(current.map((c) => [c.id, c]));
  const importedResults: Contest[] = [];

  const scraped = loadScrapedItems();
  const itemIdsSet = new Set(items.map((it) => it.id));

  for (const item of items) {
    const official = mockContests.find((m) => 
      m.id === item.id || 
      m.referenceCode === item.referenceCode || 
      m.id.includes(item.id.replace('scrape-', ''))
    );

    if (official) {
      const resolvedLogo = resolveAdministrationLogo(official.administration?.name?.fr, official.administration?.category, official.title?.fr);
      const updatedOfficial = {
        ...official,
        image: official.image || resolvedLogo,
      };
      currentMap.set(official.id, updatedOfficial);
      importedResults.push(updatedOfficial);
    } else {
      const adminName = item.administration?.name?.fr || '';
      const adminCat = item.administration?.category || '';
      const itemTitle = item.title?.fr || '';
      const realScrapedImage = item.image || (item.administration?.logo?.startsWith('http') ? item.administration.logo : undefined);
      const resolvedLogo = realScrapedImage || resolveAdministrationLogo(adminName, adminCat, itemTitle);

      const days = computeDaysRemaining(item.deadlineDate, item.daysRemaining);
      const derivedStatus: ContestStatus =
        item.stage === 'ecrit' || item.stage === 'oral'
          ? 'in_progress'
          : item.stage === 'resultat'
          ? 'results'
          : days <= 0
          ? 'closed'
          : days <= 7
          ? 'closing_soon'
          : 'open';

      const newContest: Contest = {
        id: item.id.replace('scrape-', 'c-'),
        slug: item.id.replace('scrape-', 'concours-officiel-'),
        referenceCode: item.referenceCode || '',
        image: realScrapedImage || resolvedLogo,
        title: item.title,
        administration: {
          id: item.administration?.id || 'adm-custom',
          name: item.administration?.name || { fr: adminName, ar: adminName },
          shortName: item.administration?.name || { fr: adminName, ar: adminName },
          logo: realScrapedImage || resolvedLogo,
          category: (item.administration?.category as any) || 'administration',
          officialWebsite: item.sourceUrl || '',
        },
        type: {
          fr: 'Recrutement sur concours (Scrapé & Vérifié)',
          ar: 'توظيف بمباراة (تم التحقق الآلي)',
        },
        status: derivedStatus,
        stage: item.stage,
        stageLabel: item.stageLabel,
        convoquesUrl: item.convoquesUrl,
        postsCount: item.postsCount || 0,
        degreeLevel: item.degreeLevel || '',
        grade: item.grade || undefined,
        grade_fr: item.grade || undefined,
        recruitmentType: item.recruitmentType || undefined,
        depositType: item.depositType || undefined,
        depositSite: item.depositSite || item.applyUrl || undefined,
        applyUrl: item.depositSite || item.applyUrl || undefined,
        specialtiesList: item.specialtiesList || [],
        specialty: item.specialty || { fr: '', ar: '' },
        region: item.region || { fr: '', ar: '' },
        location: item.region || { fr: '', ar: '' },
        publicationDate: item.publicationDate || '',
        deadlineDate: item.deadlineDate || '',
        daysRemaining: days,
        contestDate: item.contestDate || '',
        isVerifiedSource: true,
        officialSourceUrl: item.sourceUrl,
        overviewSummary: {
          fr: item.rawSnippet?.fr || '',
          ar: item.rawSnippet?.ar || '',
        },
        criteria: {
          nationality: { fr: '', ar: '' },
          ageLimit: { fr: '', ar: '' },
          diplomas: item.degreeLevel ? [{ fr: item.degreeLevel, ar: item.degreeLevel }] : [],
          experience: { fr: '', ar: '' },
          specialties: item.specialtiesList && item.specialtiesList.length > 0
            ? item.specialtiesList.map((s) => ({ fr: s, ar: s }))
            : item.specialty ? [{ fr: item.specialty.fr, ar: item.specialty.ar }] : [],
        },
        exams: {
          written: [],
          oral: [],
        },
        documents: item.arreteUrl ? [
          {
            id: `doc-${item.id}`,
            title: {
              fr: `Arrêté officiel d'ouverture du concours ${item.referenceCode ? `(${item.referenceCode})` : ''}`.trim(),
              ar: `قرار فتح المباراة الرسمي ${item.referenceCode ? `(${item.referenceCode})` : ''}`.trim(),
            },
            fileType: 'pdf',
            url: item.arreteUrl,
            date: item.publicationDate || '',
          },
        ] : [],
        isDemo: false,
      };
      currentMap.set(newContest.id, newContest);
      importedResults.push(newContest);
    }
  }

  saveImportedContests(Array.from(currentMap.values()));

  const updatedScraped = scraped.map((s) => 
    itemIdsSet.has(s.id) ? { ...s, status: 'imported' as const } : s
  );
  saveScrapedItems(updatedScraped);

  return importedResults;
}

export function ignoreMultipleScrapedContests(itemIds: string[]): void {
  const scraped = loadScrapedItems();
  const idSet = new Set(itemIds);
  const updatedScraped = scraped.map((s) => 
    idSet.has(s.id) ? { ...s, status: 'ignored' as const } : s
  );
  saveScrapedItems(updatedScraped);
}

export function removeImportedContest(contestId: string): void {
  const current = loadImportedContests();
  const updated = current.filter((c) => c.id !== contestId && c.id !== `c-${contestId}` && c.id.replace(/^c-/, '') !== contestId.replace(/^c-/, ''));
  saveImportedContests(updated);

  // Mettre à jour l'item scrapé pour qu'il redevienne non-importé si présent
  const scraped = loadScrapedItems();
  const updatedScraped = scraped.map((s) => {
    const sClean = s.id.replace(/^scrape-/, '');
    const cClean = contestId.replace(/^c-/, '').replace(/^scrape-/, '');
    if (s.id === contestId || sClean === cClean) {
      return { ...s, status: 'pending_review' as const };
    }
    return s;
  });
  saveScrapedItems(updatedScraped);
}

export function getDeletedContestIds(): string[] {
  try {
    const raw = localStorage.getItem('kounkour_deleted_contest_ids');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markContestDeleted(contestId: string): void {
  const deleted = getDeletedContestIds();
  const variants = [contestId, `c-${contestId}`, contestId.replace(/^c-/, '')];
  let changed = false;
  for (const v of variants) {
    if (!deleted.includes(v)) {
      deleted.push(v);
      changed = true;
    }
  }
  if (changed) {
    try {
      localStorage.setItem('kounkour_deleted_contest_ids', JSON.stringify(deleted));
    } catch (e) {
      console.warn('LocalStorage save deleted contests failed', e);
    }
  }
  removeImportedContest(contestId);
}

export async function deleteContestFromSystem(contestId: string): Promise<{ success: boolean; error?: string }> {
  // 1. Suppression locale immédiate (reactive UI)
  markContestDeleted(contestId);

  // 2. Appel serveur si jeton admin présent
  if (typeof window !== 'undefined') {
    try {
      const { getSupabase } = await import('../lib/supabase');
      const supabase = getSupabase();
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          const resp = await fetch(`/api/radar/delete-contest?id=${encodeURIComponent(contestId)}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (resp.ok) {
            return { success: true };
          }
        }
        // Repli direct Supabase si l'utilisateur est admin authentifié
        await supabase.from('contest_criteria').delete().eq('contest_id', contestId);
        const { error } = await supabase.from('contests').delete().eq('id', contestId);
        if (error) {
          console.warn('Supabase direct deletion warning:', error.message);
        }
      }
    } catch (err: any) {
      console.warn('Could not delete from Supabase backend:', err);
    }
  }

  return { success: true };
}

export async function updateContestInSystem(updatedContest: Contest): Promise<{ success: boolean; updated: Contest; error?: string }> {
  const sanitized = sanitizeContestFields(updatedContest);

  // 1. Update in local storage imported contests
  const currentImported = loadImportedContests();
  const existingIdx = currentImported.findIndex((c) => c.id === sanitized.id || c.id === `c-${sanitized.id}` || c.id.replace(/^c-/, '') === sanitized.id.replace(/^c-/, ''));

  let nextImported: Contest[];
  if (existingIdx >= 0) {
    nextImported = [...currentImported];
    nextImported[existingIdx] = sanitized;
  } else {
    nextImported = [sanitized, ...currentImported];
  }
  saveImportedContests(nextImported);

  // 2. Also save an override record in local storage
  try {
    const rawOverrides = localStorage.getItem('kounkour_contest_overrides') || '{}';
    const overrides = JSON.parse(rawOverrides);
    overrides[sanitized.id] = sanitized;
    localStorage.setItem('kounkour_contest_overrides', JSON.stringify(overrides));
  } catch (e) {
    console.warn('LocalStorage save contest override failed', e);
  }

  // 3. Sync with Supabase backend if connected
  if (typeof window !== 'undefined') {
    try {
      const { getSupabase } = await import('../lib/supabase');
      const supabase = getSupabase();
      if (supabase) {
        const updatePayload: Record<string, any> = {
          title_fr: sanitized.title?.fr,
          title_ar: sanitized.title?.ar,
          source_org: sanitized.administration?.name?.fr,
          posts_count: sanitized.postsCount,
          deadline_date: sanitized.deadlineDate,
          diploma_fr: sanitized.degreeLevel,
          sector: sanitized.administration?.category,
          source_url: sanitized.officialSourceUrl,
          arrete_url: sanitized.arreteUrl,
          convoques_url: sanitized.convoquesUrl,
          raw_image_url: sanitized.image,
          status: sanitized.status,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('contests')
          .update(updatePayload)
          .eq('id', sanitized.id);

        if (error) {
          console.warn('Supabase update warning:', error.message);
        }
      }
    } catch (err: any) {
      console.warn('Could not update Supabase contest:', err);
    }
  }

  return { success: true, updated: sanitized };
}



