export type ScrapeSourceCategory = 
  | 'official_portal'
  | 'official_bulletin'
  | 'ministry'
  | 'public_enterprise'
  | 'university';

export interface ScrapeSource {
  id: string;
  name: {
    fr: string;
    ar: string;
  };
  domain: string;
  url: string;
  category: ScrapeSourceCategory;
  status: 'online' | 'degraded' | 'scanning';
  lastScrapeTime: string;
  itemsDetectedCount: number;
  frequencyMinutes: number;
  uptimePercent: number;
  logo: string;
  description: {
    fr: string;
    ar: string;
  };
}

export interface ScrapedContestItem {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  scrapedAt: string;
  referenceCode: string;
  title: {
    fr: string;
    ar: string;
  };
  administration: {
    id: string;
    name: {
      fr: string;
      ar: string;
    };
    category: string;
    logo: string;
  };
  postsCount: number;
  degreeLevel: string;
  specialty: {
    fr: string;
    ar: string;
  };
  region: {
    fr: string;
    ar: string;
  };
  publicationDate: string;
  deadlineDate: string;
  daysRemaining: number;
  parsingConfidence: number; // e.g. 96 (%)
  status: 'pending_review' | 'imported' | 'ignored';
  matchedRules: string[];
  rawSnippet: {
    fr: string;
    ar: string;
  };
  image?: string;
  stage?: 'depot' | 'ecrit' | 'oral' | 'resultat';
  stageLabel?: {
    fr: string;
    ar: string;
  };
  convoquesUrl?: string;
  arreteUrl?: string;
  grade?: string;
  specialtiesList?: string[];
  recruitmentType?: string;
  depositType?: string;
  depositSite?: string;
  contestDate?: string;
}

export interface ScrapeLogEntry {
  id: string;
  timestamp: string;
  sourceId: string;
  level: 'info' | 'success' | 'warn' | 'parser';
  message: string;
}
