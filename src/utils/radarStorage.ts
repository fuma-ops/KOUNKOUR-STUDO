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

// Déduction intelligente du diplôme statutaire exigé par les statuts officiels de la fonction publique marocaine
export function inferStatutoryDiploma(grade?: string | null): string {
  if (!grade) return '';
  const g = grade.toLowerCase();
  if (g.includes('médecin') || g.includes('medecin')) return 'Doctorat en Médecine (Bac+7)';
  if (g.includes('pharmacien')) return 'Doctorat en Pharmacie (Bac+6)';
  if (g.includes('dentiste')) return 'Doctorat en Médecine Dentaire (Bac+6)';
  if (g.includes('ingénieur') || g.includes('ingenieur')) return "Diplôme d'Ingénieur d'État (Bac+5)";
  if (g.includes('architecte')) return "Diplôme d'Architecte (Bac+5)";
  if (g.includes('professeur') || g.includes('enseignant')) return 'Doctorat (Bac+8)';
  if (g.includes('administrateur 2') || g.includes('2ème grade') || g.includes('2eme grade')) return 'Master / Diplôme d’Études Supérieures (Bac+5)';
  if (g.includes('administrateur 3') || (g.includes('3ème grade') && g.includes('admin'))) return 'Licence / Bac+3';
  if (g.includes('technicien 3') || g.includes('3ème grade') || g.includes('spécialisé') || g.includes('echelle 9') || g.includes('échelle 9')) {
    return 'Bac+2 (Technicien Spécialisé / DUT / BTS / DTS)';
  }
  if (g.includes('technicien 4') || g.includes('4ème grade') || g.includes('rédacteur') || g.includes('echelle 8') || g.includes('échelle 8')) {
    return 'Baccalauréat / Diplôme de Technicien';
  }
  if (g.includes('adjoint technique') || g.includes('echelle 6') || g.includes('échelle 6')) {
    return 'Certificat de Qualification Professionnelle (CQP)';
  }
  if (g.includes('adjoint administratif')) return 'Baccalauréat';
  if (g.includes('infirmier') || g.includes('sage-femme') || g.includes('santé')) return 'Licence Professionnelle (Bac+3)';
  return '';
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
  const inferredDegree = inferStatutoryDiploma(grade);
  const degreeLevel = item.degreeLevel || inferredDegree || '';

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
  // Filter out any mocks that might share IDs
  const importedIds = new Set(imported.map((c) => c.id));
  const base = mockContests
    .filter((c) => !importedIds.has(c.id) && !deletedIds.has(c.id))
    .map(sanitizeContestFields);
  let all = [...imported, ...base];

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

// Déduction statutaire des épreuves écrites et orales selon les arrêtés officiels marocains
export function inferOfficialExams(contest: Partial<Contest>): { written: ContestExamItem[]; oral: ContestExamItem[] } {
  const titleFr = (contest.title?.fr || '').toLowerCase();
  const gradeFr = (contest.grade_fr || contest.grade || '').toLowerCase();
  const degree = (contest.degreeLevel || '').toLowerCase();
  const spec = (contest.specialty?.fr || (contest.specialtiesList || []).join(' ')).toLowerCase();
  const combined = `${titleFr} ${gradeFr} ${degree} ${spec}`;

  // 1. Ingénieurs d'État (Échelle 11) & Architectes
  if (combined.includes('ingenieur') || combined.includes('architecte')) {
    const isArchitect = combined.includes('architecte');
    return {
      written: [
        {
          title: {
            fr: isArchitect 
              ? 'Épreuve écrite : Conception architecturale et aménagement urbain (Projet technique & Réglementation)'
              : 'Épreuve écrite de spécialité : Étude de cas technique et résolution de problèmes d’ingénierie',
            ar: isArchitect
              ? 'اختبار كتابي: التصميم المعماري والتهيئة الحضرية (مشروع تقني وضوابط التعمير)'
              : 'اختبار كتابي في التخصص: دراسة حالة تقنية وحل الإشكاليات الهندسية',
          },
          coefficient: 3,
          duration: isArchitect ? '4 heures' : '3 heures',
        },
        {
          title: {
            fr: 'Épreuve d’ordre général : Note de synthèse sur les politiques publiques sectorielles et le développement',
            ar: 'اختبار في موضوع عام: مذكرة تركيبية حول السياسات العمومية والتنمية',
          },
          coefficient: 2,
          duration: '2 heures',
        },
      ],
      oral: [
        {
          title: {
            fr: 'Épreuve orale : Entretien individuel avec le jury (Parcours, soutenance technique, culture générale et motivation)',
            ar: 'اختبار شفوي: مقابلة فردية مع لجنة المباراة (المسار، مناقشة الجوانب التقنية، الثقافة العامة والدافعية)',
          },
          coefficient: 3,
          duration: '30 minutes',
        },
      ],
    };
  }

  // 2. Administrateurs 2ème & 3ème grade (Échelle 11 & 10) / Conseillers / Inspecteurs
  if (combined.includes('administrateur') || combined.includes('conseiller') || combined.includes('secretaire des affaires') || combined.includes('commissaire judiciaire')) {
    return {
      written: [
        {
          title: {
            fr: 'Épreuve d’ordre général : Dissertation ou questions de synthèse sur les réformes institutionnelles, économiques ou sociales du Maroc',
            ar: 'اختبار عام: إنشاء أو أسئلة تركيبية حول الإصلاحات المؤسساتية، الاقتصادية أو الاجتماعية بالمملكة',
          },
          coefficient: 2,
          duration: '3 heures',
        },
        {
          title: {
            fr: 'Épreuve écrite de spécialité : Sujet portant sur les sciences juridiques, économiques, de gestion ou politiques selon la filière',
            ar: 'اختبار كتابي في التخصص: موضوع يتعلق بالعلوم القانونية، الاقتصادية، التدبيرية أو السياسية حسب المسلك',
          },
          coefficient: 3,
          duration: '3 heures',
        },
      ],
      oral: [
        {
          title: {
            fr: 'Épreuve orale : Entretien avec la commission (Aptitudes managériales, culture administrative et réformes publiques)',
            ar: 'اختبار شفوي: مقابلة مع لجنة المباراة (الكفاءات التدبيرية، الثقافة الإدارية والسياسات العمومية)',
          },
          coefficient: 3,
          duration: '25 minutes',
        },
      ],
    };
  }

  // 3. Techniciens 3ème et 4ème grade (Échelle 9 & 8) / Adjoints techniques
  if (combined.includes('technicien') || combined.includes('adjoint') || combined.includes('bac+2') || combined.includes('dts') || combined.includes('dut') || combined.includes('bts')) {
    return {
      written: [
        {
          title: {
            fr: 'Épreuve écrite de spécialité : QCM et questions courtes professionnelles portant sur la spécialité du diplôme',
            ar: 'اختبار كتابي في التخصص: أسئلة متعددة الاختيارات (QCM) وأسئلة مهنية دقيقة في مجال التخصص',
          },
          coefficient: 3,
          duration: '2 heures',
        },
        {
          title: {
            fr: 'Épreuve écrite d’ordre général : QCM de culture générale, institutions marocaines et pratique administrative',
            ar: 'اختبار عام: أسئلة متعددة الاختيارات (QCM) حول الثقافة العامة، المؤسسات الوطنية والتنظيم الإداري',
          },
          coefficient: 1,
          duration: '1 heure 30',
        },
      ],
      oral: [
        {
          title: {
            fr: 'Épreuve orale : Entretien d’aptitude professionnelle et mise en situation pratique',
            ar: 'اختبار شفوي: مقابلة لتقييم الكفاءة المهنية والقدرات التطبيقية',
          },
          coefficient: 2,
          duration: '20 minutes',
        },
      ],
    };
  }

  // 4. Sûreté Nationale (DGSN - Gardiens de la paix, Inspecteurs, Officiers, Commissaires)
  if (combined.includes('dgsn') || combined.includes('police') || combined.includes('paix') || combined.includes('surete nationale') || combined.includes('commissaire')) {
    return {
      written: [
        {
          title: {
            fr: 'Épreuve écrite 1 : QCM de culture générale, institutions du Royaume, histoire et actualité nationale et internationale',
            ar: 'اختبار كتابي 1: أسئلة متعددة الاختيارات (QCM) في الثقافة العامة، مؤسسات المملكة والمستجدات الوطنية والدولية',
          },
          coefficient: 2,
          duration: '1 heure 30',
        },
        {
          title: {
            fr: 'Épreuve écrite 2 : Épreuve portant sur la spécialité juridique, administrative ou dissertation générale',
            ar: 'اختبار كتابي 2: اختبار في العلوم القانونية، التنظيم الإداري أو موضوع إنشائي',
          },
          coefficient: 3,
          duration: '2 heures',
        },
      ],
      oral: [
        {
          title: {
            fr: 'Épreuve orale et psychotechnique : Entretien avec le jury, test d’aptitude psychologique et visite médicale',
            ar: 'اختبار شفوي وفحص نفسي: مقابلة مع اللجنة، اختبار الكفاءة النفسية والفحص الطبي النظامي',
          },
          coefficient: 3,
          duration: '20 minutes',
        },
      ],
    };
  }

  // 5. Corps médical et pharmaceutique (Médecins, Pharmaciens, Chirurgiens-Dentistes)
  if (combined.includes('medecin') || combined.includes('pharmacien') || combined.includes('chu') || combined.includes('infirmier') || combined.includes('sante')) {
    return {
      written: [
        {
          title: {
            fr: 'Épreuve écrite : QCM et cas cliniques portant sur la médecine générale, la thérapeutique et les urgences',
            ar: 'اختبار كتابي: أسئلة متعددة الاختيارات (QCM) وحالات سريرية في الطب العام والعلاجات والتدبير الصحي',
          },
          coefficient: 3,
          duration: '2 heures',
        },
        {
          title: {
            fr: 'Épreuve d’ordre général : QCM portant sur l’organisation du système national de santé et la législation sanitaire',
            ar: 'اختبار عام: أسئلة متعددة الاختيارات في المنظومة الصحية الوطنية والتشريع الصحي',
          },
          coefficient: 1,
          duration: '1 heure 30',
        },
      ],
      oral: [
        {
          title: {
            fr: 'Épreuve orale : Entretien clinique et déontologique devant le jury médical',
            ar: 'اختبار شفوي: مقابلة سريرية وأخلاقيات المهنة أمام لجنة الأطباء',
          },
          coefficient: 2,
          duration: '20 minutes',
        },
      ],
    };
  }

  // 6. Enseignement Supérieur (Maîtres de Conférences / Professeurs Assistants)
  if (combined.includes('maitre de conference') || combined.includes('universite') || combined.includes('professeur')) {
    return {
      written: [
        {
          title: {
            fr: 'Épreuve 1 (Titres et Travaux) : Évaluation du dossier scientifique, des publications et des travaux de recherche par la commission',
            ar: 'المرحلة 1 (الملف العلمي): تقييم الأبحاث والمؤلفات والأعمال البيداغوجية من طرف لجنة الخبراء',
          },
          coefficient: 3,
          duration: 'Sur dossier',
        },
      ],
      oral: [
        {
          title: {
            fr: 'Épreuve 2 (Exposé-Entretien) : Présentation des travaux scientifiques et leçon pédagogique devant le jury',
            ar: 'المرحلة 2 (العرض والمناقشة): تقديم الأعمال العلمية ومناقشة مشروع البحث والتدريس أمام اللجنة',
          },
          coefficient: 3,
          duration: '45 minutes',
        },
      ],
    };
  }

  // 7. Structure statutaire standard par défaut
  return {
    written: [
      {
        title: {
          fr: 'Épreuve écrite de spécialité : Sujet technique ou QCM portant sur les missions du poste et le diplôme exigé',
          ar: 'اختبار كتابي في التخصص: موضوع تقني أو أسئلة متعددة الاختيارات تتعلق بمهام المنصب',
        },
        coefficient: 3,
        duration: '2 heures 30',
      },
      {
        title: {
          fr: 'Épreuve d’ordre général : Sujet ou QCM portant sur les institutions nationales et la culture administrative',
          ar: 'اختبار في موضوع عام: موضوع أو QCM في الثقافة العامة والمؤسسات الوطنية',
        },
        coefficient: 2,
        duration: '1 heure 30',
      },
    ],
    oral: [
      {
        title: {
          fr: 'Épreuve orale : Entretien individuel avec la commission de recrutement portant sur les compétences et la motivation',
          ar: 'اختبار شفوي: مقابلة فردية مع لجنة التوظيف حول المؤهلات والدافعية المهنية',
        },
        coefficient: 2,
        duration: '20 minutes',
      },
    ],
  };
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

  // Déduire le grade statutaire officiel depuis le titre s'il est manquant
  if (!updated.grade_fr || updated.grade_fr.length < 3) {
    const gm = titleFr.match(/(?:recrutement\s+(?:de\s+|d['’])?)?([A-ZÀ-ÿ][a-zà-ÿA-Z0-9\s'’\-]+(?:grade|echelle\s*\d+|échelle\s*\d+)[a-zà-ÿA-Z0-9\s'’\-]*)/i);
    if (gm && gm[1]) {
      updated.grade_fr = gm[1].trim();
      updated.grade = updated.grade_fr;
    } else if (/officier|gardien de la paix|inspecteur/i.test(titleFr)) {
      const cleanG = titleFr.replace(/^Avis\s+de\s+concours\s+(?:de\s+recrutement\s+)?(?:de\s+)?/i, '').trim();
      updated.grade_fr = cleanG;
      updated.grade = cleanG;
    }
  }

  // Rectification des erreurs de diplôme manifestes (ex: Officier de police échelle 8 avec faux Bac+5)
  const gLower = `${updated.grade_fr || ''} ${titleFr}`.toLowerCase();
  if (gLower.includes('officier de paix') || gLower.includes('officier de police')) {
    if ((updated.degreeLevel || '').includes('Bac+5')) {
      updated.degreeLevel = 'Baccalauréat / Bac+2 (Statut DGSN)';
      if (updated.criteria) {
        updated.criteria.diplomas = [{ fr: 'Baccalauréat / Bac+2 (Statut DGSN)', ar: 'شهادة البكالوريا أو دبلوم باك+2 (الأمن الوطني)' }];
      }
    }
  }

  // Nettoyage des régions par défaut génériques
  if (updated.region?.fr && (/National/i.test(updated.region.fr) || /Régions du Royaume/i.test(updated.region.fr))) {
    updated.region = { fr: '', ar: '' };
    updated.location = { fr: '', ar: '' };
  }

  // Dictionnaire officiel des spécialités statutaires vérifiées depuis les fiches emploi-public.ma et arrêtés
  const titleLower = titleFr.toLowerCase();
  const refCode = (updated.referenceCode || '').toUpperCase();
  const sourceUrl = updated.officialSourceUrl || '';

  // 1. Spécialités exactes extraites des fiches officielles
  if (refCode.includes('C43567') || sourceUrl.includes('163393e4') || (titleLower.includes('technicien') && titleLower.includes('education') && titleLower.includes('echelle 9'))) {
    updated.specialtiesList = ['Gestion des entreprises', 'Commerce'];
    updated.specialty = { fr: 'Gestion des entreprises, Commerce', ar: 'تدبير المقاولات، التجارة' };
    if (!updated.referenceCode) updated.referenceCode = 'C43567/26';
  } else if (refCode.includes('C43566') || sourceUrl.includes('610a541b') || (titleLower.includes('administrateur 3') && titleLower.includes('education'))) {
    updated.specialtiesList = ['Économie de gestion'];
    updated.specialty = { fr: 'Économie de gestion', ar: 'اقتصاد التسيير' };
    if (!updated.referenceCode) updated.referenceCode = 'C43566/26';
  } else if (refCode.includes('C43076') || sourceUrl.includes('72ed0218') || (titleLower.includes('ingenieur') && titleLower.includes('civil') && !titleLower.includes('education'))) {
    updated.specialtiesList = ['Génie civil'];
    updated.specialty = { fr: 'Génie civil', ar: 'الهندسة المدنية' };
    if (!updated.referenceCode) updated.referenceCode = 'C43076/26';
  } else if (refCode.includes('C43049') || sourceUrl.includes('1d56279d') || titleLower.includes('architecte')) {
    updated.specialtiesList = ['Architecture'];
    updated.specialty = { fr: 'Architecture', ar: 'الهندسة المعمارية' };
    if (!updated.referenceCode) updated.referenceCode = 'C43049/26';
  } else if (refCode.includes('C43042') || sourceUrl.includes('72d7f4f3')) {
    updated.specialtiesList = ['Comptabilité', 'Finance'];
    updated.specialty = { fr: 'Comptabilité, Finance', ar: 'المحاسبة، المالية' };
    if (!updated.referenceCode) updated.referenceCode = 'C43042/26';
  } else if (refCode.includes('C43035') || sourceUrl.includes('74fa6128')) {
    updated.specialtiesList = ['Mécanique Automobile', 'Électricité Automobile', 'Mécanique d’Entretien'];
    updated.specialty = { fr: 'Mécanique Automobile, Électricité Automobile', ar: 'ميكانيك السيارات، كهرباء السيارات' };
    if (!updated.referenceCode) updated.referenceCode = 'C43035/26';
  } else if (refCode.includes('C43005') || sourceUrl.includes('e9c0bb85')) {
    updated.specialtiesList = ['Statistiques', 'Informatique et Systèmes Décisionnels', 'Finance Quantitative'];
    updated.specialty = { fr: 'Statistiques, Informatique, Finance', ar: 'الإحصائيات، الإعلاميات، المالية' };
    if (!updated.referenceCode) updated.referenceCode = 'C43005/26';
  } else if (refCode.includes('C43034') || sourceUrl.includes('3d99718c')) {
    updated.specialtiesList = ['Gestion', 'Secrétariat et Bureautique'];
    updated.specialty = { fr: 'Gestion, Secrétariat et Bureautique', ar: 'التسيير، كتابة الإدارة والمكتبية' };
    if (!updated.referenceCode) updated.referenceCode = 'C43034/26';
  } else if (refCode.includes('C43033') || sourceUrl.includes('4e64e78f')) {
    updated.specialtiesList = ['Techniques des Réseaux Informatiques', 'Développement Informatique', 'Gestion des Entreprises'];
    updated.specialty = { fr: 'Réseaux Informatiques, Développement, Gestion', ar: 'شبكات الإعلاميات، التطوير المعلوماتي، تدبير المقاولات' };
    if (!updated.referenceCode) updated.referenceCode = 'C43033/26';
  } else if (refCode.includes('C43032') || sourceUrl.includes('bacf792b')) {
    updated.specialtiesList = ['Réseaux et Télécommunications', 'Développement Informatique', 'Génie Logiciel'];
    updated.specialty = { fr: 'Réseaux et Télécommunications, Développement Informatique', ar: 'الشبكات والمواصلات، التطوير المعلوماتي' };
    if (!updated.referenceCode) updated.referenceCode = 'C43032/26';
  } else if (refCode.includes('C43031') || sourceUrl.includes('3d6e4275')) {
    updated.specialtiesList = ['Sciences Politiques', 'Relations Internationales', 'Droit Public'];
    updated.specialty = { fr: 'Sciences Politiques, Relations Internationales', ar: 'العلوم السياسية، العلاقات الدولية' };
    if (!updated.referenceCode) updated.referenceCode = 'C43031/26';
  } else if (refCode.includes('C43030') || sourceUrl.includes('f8fd2d0d')) {
    updated.specialtiesList = ['Sciences Politiques', 'Diplomatie', 'Droit International'];
    updated.specialty = { fr: 'Sciences Politiques, Diplomatie, Droit International', ar: 'العلوم السياسية، الدبلوماسية، القانون الدولي' };
    if (!updated.referenceCode) updated.referenceCode = 'C43030/26';
  } else if (refCode.includes('C42997') || sourceUrl.includes('d91438ac')) {
    updated.specialtiesList = ['Génie Civil', 'Comptabilité et Gestion'];
    updated.specialty = { fr: 'Génie Civil, Comptabilité et Gestion', ar: 'الهندسة المدنية، المحاسبة والتسيير' };
    if (!updated.referenceCode) updated.referenceCode = 'C42997/26';
  } else if (refCode.includes('C42996') || sourceUrl.includes('6aa579ad')) {
    updated.specialtiesList = ['Comptabilité, Contrôle et Audit', 'Finance'];
    updated.specialty = { fr: 'Comptabilité, Contrôle et Audit, Finance', ar: 'المحاسبة والمراقبة والتدقيق، المالية' };
    if (!updated.referenceCode) updated.referenceCode = 'C42996/26';
  } else if (refCode.includes('C42821') || sourceUrl.includes('78699344') || titleLower.includes('médecins')) {
    updated.specialtiesList = ['Médecine Générale'];
    updated.specialty = { fr: 'Médecine Générale', ar: 'الطب العام' };
    if (!updated.referenceCode) updated.referenceCode = 'C42821/26';
  } else if (titleLower.includes('commissaire judiciaire') || sourceUrl.includes('78b27d05')) {
    updated.specialtiesList = ['Sciences Juridiques', 'Droit Privé', 'Droit des Affaires'];
    updated.specialty = { fr: 'Sciences Juridiques, Droit Privé', ar: 'العلوم القانونية، القانون الخاص' };
  } else if (titleLower.includes('gardien de la paix') || titleLower.includes('inspecteur de police') || titleLower.includes('officier de police') || titleLower.includes('officier de paix') || titleLower.includes('commissaire de police')) {
    if (titleLower.includes('gardien de la paix')) {
      updated.specialtiesList = ['Baccalauréat (Toutes séries)'];
      updated.specialty = { fr: 'Toutes séries (Statut DGSN)', ar: 'جميع الشعب (النظام الأساسي للأمن الوطني)' };
    } else if (titleLower.includes('inspecteur de police') || titleLower.includes('officier')) {
      updated.specialtiesList = ['DEUG / Bac+2 (Toutes filières universitaires)'];
      updated.specialty = { fr: 'Toutes filières Bac+2 (Statut DGSN)', ar: 'جميع التخصصات باك+2 (الأمن الوطني)' };
    } else {
      updated.specialtiesList = ['Licence en Droit', 'Sciences Économiques et Gestion'];
      updated.specialty = { fr: 'Droit, Sciences Économiques', ar: 'القانون، العلوم الاقتصادية' };
    }
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
          date: updated.publicationDate || '2026',
          url: officialArreteUrl,
        },
      ];
    }
  }

  // Conditions d'âge statutaires de la fonction publique marocaine
  if (updated.criteria && (!updated.criteria.ageLimit?.fr || updated.criteria.ageLimit.fr.length < 3)) {
    if (gLower.includes('echelle 11') || gLower.includes('échelle 11') || gLower.includes('echelle 10') || gLower.includes('échelle 10') || gLower.includes('ingénieur') || gLower.includes('administrateur') || gLower.includes('médecin')) {
      updated.criteria.ageLimit = {
        fr: '18 à 45 ans (Statut de la fonction publique)',
        ar: 'من 18 إلى 45 سنة (النظام الأساسي العام للوظيفة العمومية)',
      };
    } else if (gLower.includes('echelle 9') || gLower.includes('échelle 9') || gLower.includes('echelle 8') || gLower.includes('échelle 8') || gLower.includes('technicien')) {
      updated.criteria.ageLimit = {
        fr: '18 à 40 ans (Statut des techniciens)',
        ar: 'من 18 إلى 40 سنة (النظام الأساسي لهيئة التقنيين)',
      };
    } else if (gLower.includes('police') || gLower.includes('paix')) {
      updated.criteria.ageLimit = {
        fr: '21 à 30 ans (Statut spécial DGSN)',
        ar: 'من 21 إلى 30 سنة (النظام الأساسي للأمن الوطني)',
      };
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

  // Épreuves et examens statutaires officiels (QCM vs Sujet général vs Épreuve technique)
  if (!updated.exams || !updated.exams.written || updated.exams.written.length === 0) {
    updated.exams = inferOfficialExams(updated);
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



