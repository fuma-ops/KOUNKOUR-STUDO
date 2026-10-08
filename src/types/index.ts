export type Language = 'ar' | 'fr';

export type ContestStatus = 'open' | 'closing_soon' | 'in_progress' | 'upcoming' | 'closed' | 'results';

export type ContestCategory = 'administration' | 'education' | 'sante' | 'finances' | 'securite' | 'collectivites' | 'autres';

export interface ContestDocument {
  id: string;
  title: {
    fr: string;
    ar: string;
  };
  fileType: string;
  fileSize?: string;
  date: string;
  url: string;
  docType?: 'arrete' | 'convoques_ecrit' | 'convoques_oral' | 'admis_definitifs' | 'liste_attente';
  candidatesCount?: number;
}

export interface ContestCriteria {
  nationality: { fr: string; ar: string };
  ageLimit: { fr: string; ar: string };
  diplomas: { fr: string; ar: string }[];
  experience: { fr: string; ar: string };
  specialties: { fr: string; ar: string }[];
}

export interface ContestExamItem {
  title: { fr: string; ar: string };
  coefficient: number;
  duration: string;
  description?: { fr: string; ar: string };
}

// Un poste d'un avis (province × catégorie × diplôme × spécialité), lu dans l'arrêté.
export interface ContestPost {
  province: string | null;
  category: string | null;
  diploma: string | null;
  specialty: string | null;
  count: number | null;
  note: string | null;
}

export interface Contest {
  id: string;
  slug: string;
  referenceCode: string;
  image?: string;
  title: {
    fr: string;
    ar: string;
  };
  administration: {
    id: string;
    name: { fr: string; ar: string };
    shortName: { fr: string; ar: string };
    logo: string;
    category: ContestCategory;
    officialWebsite: string;
  };
  type: {
    fr: string;
    ar: string;
  };
  status: ContestStatus;
  postsCount: number;
  // Détail des postes (vide si l'avis n'a pas encore été analysé).
  posts?: ContestPost[];
  degreeLevel: string; // e.g. "Bac+2", "Bac+5"
  specialty: {
    fr: string;
    ar: string;
  };
  region: {
    fr: string;
    ar: string;
  };
  location: {
    fr: string;
    ar: string;
  };
  publicationDate: string;
  deadlineDate: string;
  daysRemaining: number;
  contestDate?: string;
  isVerifiedSource: boolean;
  officialSourceUrl: string;
  overviewSummary: {
    fr: string;
    ar: string;
  };
  criteria: ContestCriteria;
  exams: {
    written: ContestExamItem[];
    oral: ContestExamItem[];
  };
  documents: ContestDocument[];
  stage?: 'depot' | 'ecrit' | 'oral' | 'resultat';
  stageLabel?: { fr: string; ar: string };
  convoquesUrl?: string;
  isDemo: boolean;
  grade?: string;
  grade_fr?: string;
  specialtiesList?: string[];
  recruitmentType?: string;
  depositType?: string;
  depositSite?: string;
  applyUrl?: string;
  arreteUrl?: string;
}

export interface QcmOption {
  id: string;
  text: {
    fr: string;
    ar: string;
  };
}

export interface QcmQuestion {
  id: string;
  number: number;
  text: {
    fr: string;
    ar: string;
  };
  options: QcmOption[];
  correctOptionId: string;
  explanation: {
    fr: string;
    ar: string;
  };
  source: string;
}

export interface QcmSet {
  id: string;
  slug: string;
  title: {
    fr: string;
    ar: string;
  };
  description: {
    fr: string;
    ar: string;
  };
  category: 'psychotechnique' | 'droit_public' | 'fonction_publique' | 'finances_publiques' | 'informatique' | 'culture_generale' | 'education' | 'francais' | 'arabe';
  durationMinutes: number;
  difficulty: 'accessible' | 'moyen' | 'avance';
  questionsCount: number;
  questions: QcmQuestion[];
  isDemo: boolean;
  /** « annales » = vrai sujet transcrit ; « entrainement » = questions KounKour. */
  kind?: 'annales' | 'entrainement';
  /** Langue du contenu (une annale arabe s'affiche de droite à gauche). */
  contentLanguage?: 'fr' | 'ar';
  concoursLabel?: string | null;
  examYear?: number | null;
  sourceNote?: string | null;
  /** Dossier de préparation (un par concours). */
  folderSlug?: string | null;
  // Correction calculée par le serveur (les bonnes réponses ne sont pas dans le chargement).
  serverGraded?: boolean;
}

export interface CommunityComment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: { fr: string; ar: string } | string;
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: { fr: string; ar: string } | string;
  title: string;
  content: string;
  category: 'questions' | 'conseils' | 'experiences' | 'annonces' | 'general' | 'concours' | 'qcm' | 'documents';
  contestId?: string;
  contestTitle?: { fr: string; ar: string };
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  viewsCount?: number;
  commentsCount: number;
  comments: CommunityComment[];
  isVerifiedAnswer?: boolean;
}

export interface UserPreferences {
  language: Language;
  degreeLevel?: string;
  favoriteSectors: ContestCategory[];
  emailAlerts: boolean;
  pushAlerts: boolean;
  daysReminder: number;
}

export type ApplicationStatus = 
  | 'interested'        // En réflexion
  | 'preparing_dossier' // Dossier en préparation
  | 'submitted'         // Dossier déposé
  | 'convoked_written'  // Convoqué à l'écrit
  | 'eligible_oral'     // Admissible à l'oral
  | 'admitted'          // Lauréat / Admis
  | 'not_selected';     // Non retenu

export interface ContestDossierChecklist {
  cinCertified: boolean;
  diplomaCertified: boolean;
  policeRecord: boolean; // Fiche anthropométrique / casier judiciaire
  cvUpdated: boolean;
  motivationLetter: boolean; // Demande manuscrite
  officialForm: boolean; // Fiche de candidature portail
  customNotes?: string;
}

export interface CandidateTrackingItem {
  contestId: string;
  status: ApplicationStatus;
  checklist: ContestDossierChecklist;
  savedAt: string;
  notes?: string;
}

export interface CandidateProfile {
  fullName: string;
  email: string;
  phone: string;
  age: number;
  degreeLevel: string; // 'Bac', 'Bac+2', 'Licence', 'Master', 'Doctorat'
  specialty: string; // spécialité principale (compatibilité)
  /** Toutes les spécialités du candidat (diplôme principal + autres), 1 à 3. */
  specialties?: string[];
  region: string;
  currentSituation: 'student' | 'job_seeker' | 'employed' | 'civil_servant';
  notificationsEnabled: boolean;
  alertDaysBefore: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: 'candidate' | 'editor' | 'admin';
  bookmarkedContestIds: string[];
  completedQcm: {
    qcmId: string;
    score: number;
    total: number;
    completedAt: string;
  }[];
  preferences: UserPreferences;
}
