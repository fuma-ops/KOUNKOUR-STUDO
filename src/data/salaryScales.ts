export interface SalaryScale {
  id: string;
  echelle: string;
  grade: {
    fr: string;
    ar: string;
  };
  corps: {
    fr: string;
    ar: string;
  };
  diplomaReq: {
    fr: string;
    ar: string;
  };
  echelons: {
    echelon: number;
    indice: number;
  }[];
  indemniteSujetion: number;
  indemniteEncadrement: number;
  baseNetEstimate: number; // Salaire net mensuel d'embauche estimé (DH)
  decreeRef: string;
}

export const MOROCCAN_SALARY_SCALES: SalaryScale[] = [
  {
    id: 'echelle-6',
    echelle: 'Échelle 6 (السلم 6)',
    grade: {
      fr: 'Adjoint Technique / Adjoint Administratif 2ème grade',
      ar: 'مساعد تقني / مساعد إداري من الدرجة الثانية',
    },
    corps: {
      fr: 'Adjoints Techniques & Administratifs',
      ar: 'هيئة المساعدين التقنيين والإداريين',
    },
    diplomaReq: {
      fr: 'Certificat d’Aptitude Professionnelle / Niveau Collège',
      ar: 'شهادة التأهيل المهني / مستوى إعدادي',
    },
    echelons: [
      { echelon: 1, indice: 137 },
      { echelon: 2, indice: 141 },
      { echelon: 3, indice: 147 },
      { echelon: 4, indice: 153 },
      { echelon: 5, indice: 159 },
    ],
    indemniteSujetion: 2150,
    indemniteEncadrement: 0,
    baseNetEstimate: 4500,
    decreeRef: 'Décret n° 2-10-452 portant statut particulier des adjoints techniques',
  },
  {
    id: 'echelle-8',
    echelle: 'Échelle 8 (السلم 8)',
    grade: {
      fr: 'Technicien 4ème grade / Rédacteur 4ème grade',
      ar: 'تقني من الدرجة الرابعة / محرر من الدرجة الرابعة',
    },
    corps: {
      fr: 'Techniciens (Diplôme de Technicien / CQP / Niveau Bac)',
      ar: 'هيئة التقنيين والمحررين',
    },
    diplomaReq: {
      fr: 'Diplôme de Technicien (ISTA/ITP) ou Baccalauréat',
      ar: 'دبلوم تقني (مكتب التكوين المهني) أو البكالوريا',
    },
    echelons: [
      { echelon: 1, indice: 173 },
      { echelon: 2, indice: 183 },
      { echelon: 3, indice: 195 },
      { echelon: 4, indice: 207 },
      { echelon: 5, indice: 220 },
    ],
    indemniteSujetion: 2750,
    indemniteEncadrement: 300,
    baseNetEstimate: 5100,
    decreeRef: 'Décret n° 2-05-1369 portant statut particulier du corps des techniciens',
  },
  {
    id: 'echelle-9',
    echelle: 'Échelle 9 (السلم 9)',
    grade: {
      fr: 'Technicien 3ème grade / Rédacteur 3ème grade (Bac+2)',
      ar: 'تقني من الدرجة الثالثة / محرر من الدرجة الثالثة (باك+2)',
    },
    corps: {
      fr: 'Techniciens Spécialisés & Rédacteurs (DUT / BTS / DTS)',
      ar: 'هيئة التقنيين المتخصصين والمحررين',
    },
    diplomaReq: {
      fr: 'Diplôme de Technicien Spécialisé (DTS, DUT, BTS, EST)',
      ar: 'دبلوم تقني متخصص (DTS/DUT/BTS/EST)',
    },
    echelons: [
      { echelon: 1, indice: 235 },
      { echelon: 2, indice: 253 },
      { echelon: 3, indice: 274 },
      { echelon: 4, indice: 296 },
      { echelon: 5, indice: 317 },
    ],
    indemniteSujetion: 3300,
    indemniteEncadrement: 500,
    baseNetEstimate: 5850,
    decreeRef: 'Décret n° 2-05-1369 & Accord du dialogue social (Revalorisation +1000 DH)',
  },
  {
    id: 'echelle-10',
    echelle: 'Échelle 10 (السلم 10)',
    grade: {
      fr: 'Administrateur 3ème grade / Technicien 1er grade (Licence)',
      ar: 'متصرف من الدرجة الثالثة / تقني من الدرجة الأولى (الإجازة)',
    },
    corps: {
      fr: 'Administrateurs & Cadres Moyens (Licence Bac+3)',
      ar: 'هيئة المتصرفين المشتركة بين الوزارات',
    },
    diplomaReq: {
      fr: 'Licence d’Études Fondamentales ou Professionnelle (Bac+3)',
      ar: 'الإجازة في الدراسات الأساسية أو المهنية (باك+3)',
    },
    echelons: [
      { echelon: 1, indice: 275 },
      { echelon: 2, indice: 300 },
      { echelon: 3, indice: 326 },
      { echelon: 4, indice: 351 },
      { echelon: 5, indice: 377 },
    ],
    indemniteSujetion: 4100,
    indemniteEncadrement: 900,
    baseNetEstimate: 6900,
    decreeRef: 'Décret n° 2-06-377 portant statut particulier du corps interministériel des administrateurs',
  },
  {
    id: 'echelle-11-admin',
    echelle: 'Échelle 11 - Administrateur (السلم 11 - متصرف)',
    grade: {
      fr: 'Administrateur 2ème grade (Master / Diplôme Bac+5)',
      ar: 'متصرف من الدرجة الثانية (ماستر / دراسات عليا)',
    },
    corps: {
      fr: 'Administrateurs Supérieurs de l’État',
      ar: 'هيئة المتصرفين (أطر عليا للدولة)',
    },
    diplomaReq: {
      fr: 'Master, Master Spécialisé, DESA, DESS ou équivalent (Bac+5)',
      ar: 'الماستر، الماستر المتخصص أو ما يعادلهما (باك+5)',
    },
    echelons: [
      { echelon: 1, indice: 336 },
      { echelon: 2, indice: 369 },
      { echelon: 3, indice: 403 },
      { echelon: 4, indice: 436 },
      { echelon: 5, indice: 472 },
    ],
    indemniteSujetion: 5800,
    indemniteEncadrement: 1700,
    baseNetEstimate: 9200,
    decreeRef: 'Décret n° 2-06-377 & Accord social 2024-2026',
  },
  {
    id: 'echelle-11-ingenieur',
    echelle: 'Échelle 11 - Ingénieur d’État (السلم 11 - مهندس دولة)',
    grade: {
      fr: 'Ingénieur d’État 1er grade / Architecte 1er grade',
      ar: 'مهندس دولة من الدرجة الأولى / مهندس معماري',
    },
    corps: {
      fr: 'Corps Interministériel des Ingénieurs et Architectes',
      ar: 'هيئة المهندسين والمهندسين المعماريين المشتركة بين الوزارات',
    },
    diplomaReq: {
      fr: 'Diplôme d’Ingénieur d’État (EHTP, EMI, ENSIAS, IAV, ENSA...) ou Architecte',
      ar: 'شهادة مهندس دولة أو مهندس معماري',
    },
    echelons: [
      { echelon: 1, indice: 336 },
      { echelon: 2, indice: 369 },
      { echelon: 3, indice: 403 },
      { echelon: 4, indice: 436 },
      { echelon: 5, indice: 472 },
    ],
    indemniteSujetion: 7700,
    indemniteEncadrement: 2400,
    baseNetEstimate: 10800,
    decreeRef: 'Décret n° 2-11-471 portant statut particulier du corps des ingénieurs et architectes',
  },
  {
    id: 'sante-medecin',
    echelle: 'Échelle 11 - Médecin / Pharmacien (السلم 11 - طبيب / صيدلي)',
    grade: {
      fr: 'Médecin 1er grade / Pharmacien 1er grade (Indice 509)',
      ar: 'طبيب من الدرجة الأولى / صيدلي من الدرجة الأولى (الرقم الاستدلالي 509)',
    },
    corps: {
      fr: 'Corps des Médecins, Chirurgiens-Dentistes et Pharmaciens',
      ar: 'هيئة الأطباء والصيادلة وجراحي الأسنان المشتركة',
    },
    diplomaReq: {
      fr: 'Doctorat en Médecine, Pharmacie ou Médecine Dentaire',
      ar: 'دكتوراه في الطب العام أو الصيدلة أو طب الأسنان',
    },
    echelons: [
      { echelon: 1, indice: 509 },
      { echelon: 2, indice: 542 },
      { echelon: 3, indice: 574 },
      { echelon: 4, indice: 606 },
    ],
    indemniteSujetion: 9400,
    indemniteEncadrement: 3200,
    baseNetEstimate: 13800,
    decreeRef: 'Décret portant statut particulier des médecins & Accord Santé Indice 509',
  },
  {
    id: 'ens-superieur-prof',
    echelle: 'Enseignement Supérieur (التعليم العالي - أستاذ محاضر)',
    grade: {
      fr: 'Professeur Assistant / Maître de Conférences (Doctorat)',
      ar: 'أستاذ محاضر / أستاذ التعليم العالي مساعد (دكتوراه)',
    },
    corps: {
      fr: 'Corps des Enseignants-Chercheurs de l’Enseignement Supérieur',
      ar: 'هيئة الأساتذة الباحثين بالتعليم العالي',
    },
    diplomaReq: {
      fr: 'Doctorat d’État, Doctorat National ou PhD',
      ar: 'الدكتوراه الوطنية أو شهادة معترف بمعادلتها',
    },
    echelons: [
      { echelon: 1, indice: 509 },
      { echelon: 2, indice: 542 },
      { echelon: 3, indice: 574 },
      { echelon: 4, indice: 639 },
    ],
    indemniteSujetion: 10800,
    indemniteEncadrement: 3800,
    baseNetEstimate: 15500,
    decreeRef: 'Décret n° 2-23-545 portant statut particulier du corps des enseignants-chercheurs',
  },
  {
    id: 'hors-echelle',
    echelle: 'Hors Échelle (خارج السلم)',
    grade: {
      fr: 'Ingénieur en Chef / Administrateur Général / Directeur',
      ar: 'مهندس رئيس / متصرف عام / مدير إدارة مركزية',
    },
    corps: {
      fr: 'Cadres Supérieurs et Dirigeants de l’État',
      ar: 'الأطر العليا القيادية للدولة',
    },
    diplomaReq: {
      fr: 'Promotion au choix / Ancienneté après Échelle 11',
      ar: 'الترقية بالاختيار / الأقدمية بعد السلم 11',
    },
    echelons: [
      { echelon: 1, indice: 704 },
      { echelon: 2, indice: 746 },
      { echelon: 3, indice: 779 },
      { echelon: 4, indice: 812 },
    ],
    indemniteSujetion: 11500,
    indemniteEncadrement: 4200,
    baseNetEstimate: 16800,
    decreeRef: 'Statut Général de la Fonction Publique Marocaine',
  },
];

/**
 * Détecteur intelligent de grille et salaire selon le concours sélectionné
 */
export function inferSalaryScaleFromContest(contest?: {
  grade?: string;
  degreeLevel?: string;
  title?: { fr?: string; ar?: string };
  administration?: { name?: { fr?: string; ar?: string }; category?: string };
} | null): SalaryScale {
  if (!contest) return MOROCCAN_SALARY_SCALES[3]; // Default: Echelle 10

  const text = `${contest.grade || ''} ${contest.degreeLevel || ''} ${contest.title?.fr || ''} ${contest.administration?.name?.fr || ''}`.toLowerCase();

  // 1. Médecins / Pharmaciens
  if (text.includes('médecin') || text.includes('medecin') || text.includes('pharmacien') || text.includes('dentiste') || text.includes('indice 509')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'sante-medecin')!;
  }

  // 2. Professeurs / Enseignement supérieur / Maîtres de conférences
  if (text.includes('professeur') || text.includes('maître de conférence') || text.includes('maitre de conference') || text.includes('enseignant chercheur') || (text.includes('doctorat') && text.includes('université'))) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'ens-superieur-prof')!;
  }

  // 3. Ingénieurs d'État / Architectes
  if (text.includes('ingénieur') || text.includes('ingenieur') || text.includes('architecte')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-11-ingenieur')!;
  }

  // 4. Administrateurs 2ème grade / Master / Bac+5 / Échelle 11
  if (text.includes('2ème grade') || text.includes('2eme grade') || text.includes('master') || text.includes('bac+5') || text.includes('echelle 11') || text.includes('échelle 11')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-11-admin')!;
  }

  // 5. Administrateurs 3ème grade / Licence / Bac+3 / Échelle 10
  if (text.includes('3ème grade') && text.includes('admin') || text.includes('licence') || text.includes('bac+3') || text.includes('echelle 10') || text.includes('échelle 10')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-10')!;
  }

  // 6. Techniciens 3ème grade / Bac+2 / DUT / BTS / DTS / Échelle 9
  if (text.includes('technicien 3ème') || text.includes('technicien 3eme') || text.includes('technicien spécialisé') || text.includes('bac+2') || text.includes('dut') || text.includes('bts') || text.includes('echelle 9') || text.includes('échelle 9')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-9')!;
  }

  // 7. Techniciens 4ème grade / Rédacteurs / Bac / CQP / Échelle 8
  if (text.includes('4ème grade') || text.includes('4eme grade') || text.includes('rédacteur') || text.includes('technicien') && text.includes('bac') || text.includes('echelle 8') || text.includes('échelle 8')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-8')!;
  }

  // 8. Adjoints techniques / Échelle 6
  if (text.includes('adjoint') || text.includes('echelle 6') || text.includes('échelle 6') || text.includes('cqp')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-6')!;
  }

  // Fallback basé sur degreeLevel
  const deg = (contest.degreeLevel || '').toLowerCase();
  if (deg.includes('doctorat')) return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'ens-superieur-prof')!;
  if (deg.includes('master') || deg.includes('ingénieur')) return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-11-admin')!;
  if (deg.includes('licence')) return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-10')!;
  if (deg.includes('bac+2')) return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-9')!;
  if (deg.includes('bac')) return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-8')!;

  return MOROCCAN_SALARY_SCALES[3]; // Default Échelle 10
}

/**
 * Détecteur intelligent de grille et salaire selon le profil du candidat
 */
export function inferSalaryScaleFromProfile(profile?: {
  degreeLevel?: string;
  specialty?: string;
} | null): SalaryScale {
  if (!profile) return MOROCCAN_SALARY_SCALES[3];

  const deg = (profile.degreeLevel || '').toLowerCase();
  const spec = (profile.specialty || '').toLowerCase();

  if (spec.includes('médecine') || spec.includes('pharmacie') || spec.includes('dentaire')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'sante-medecin')!;
  }
  if (deg.includes('doctorat')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'ens-superieur-prof')!;
  }
  if (deg.includes('ingénieur') || spec.includes('génie') || spec.includes('informatique')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-11-ingenieur')!;
  }
  if (deg.includes('master')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-11-admin')!;
  }
  if (deg.includes('licence')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-10')!;
  }
  if (deg.includes('bac+2') || deg.includes('dut') || deg.includes('bts')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-9')!;
  }
  if (deg.includes('bac')) {
    return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-8')!;
  }
  return MOROCCAN_SALARY_SCALES.find((s) => s.id === 'echelle-6')!;
}

/**
 * Calcul exact du salaire net de la fonction publique marocaine
 */
export function calculateMoroccanPublicSalary({
  scaleId,
  echelonNumber = 1,
  zone = 'A',
  childrenCount = 0,
  isMarried = false,
}: {
  scaleId: string;
  echelonNumber?: number;
  zone?: 'A' | 'B' | 'C';
  childrenCount?: number;
  isMarried?: boolean;
}) {
  const scale = MOROCCAN_SALARY_SCALES.find((s) => s.id === scaleId) || MOROCCAN_SALARY_SCALES[3];
  const echelon = scale.echelons.find((e) => e.echelon === echelonNumber) || scale.echelons[0];

  // Point indiciaire marocain officiel
  const pointValue = 3.35;
  const traitementBase = Math.round(echelon.indice * pointValue) + 1400;
  
  // Indemnités statutaires du cadre
  const indemniteSujetion = scale.indemniteSujetion;
  const indemniteEncadrement = scale.indemniteEncadrement;
  
  // Indemnité de résidence par zone (Zone A = 25% / ~380 DH, Zone B = ~250 DH, Zone C = ~150 DH)
  const indemniteResidence = zone === 'A' ? 380 : zone === 'B' ? 250 : 150;

  // Revalorisation de l'accord du dialogue social (+1000 DH net mensuel)
  const primeRevalorisationAccordSocial = 1000;

  // Allocations familiales (300 DH par enfant pour les 3 premiers, 36 DH pour les suivants)
  let allocationsFamiliales = 0;
  if (childrenCount > 0) {
    const firstTier = Math.min(childrenCount, 3);
    const secondTier = Math.max(0, Math.min(childrenCount - 3, 3));
    allocationsFamiliales = firstTier * 300 + secondTier * 36;
  }

  // Total Brut
  const salaireBrut = traitementBase + indemniteSujetion + indemniteEncadrement + indemniteResidence + primeRevalorisationAccordSocial + allocationsFamiliales;

  // Retenues obligatoires :
  // 1. CMR (Retraite) : 14% sur le traitement de base + fraction sujetion
  const baseRetraite = traitementBase + (indemniteSujetion * 0.7);
  const deductionCMR = Math.round(baseRetraite * 0.14);

  // 2. AMO / CNOPS : 2.5%
  const deductionAMO = Math.round(salaireBrut * 0.025);

  // 3. Mutuelle complémentaire de prévoyance sociale
  const deductionMutuelle = 160;

  // 4. IGR (Impôt sur le Revenu) - Barème progressif marocain
  const brutImposable = salaireBrut - deductionCMR - deductionAMO - 300;
  let igr = 0;
  if (brutImposable > 15000) {
    igr = brutImposable * 0.38 - 2400;
  } else if (brutImposable > 10000) {
    igr = brutImposable * 0.34 - 1800;
  } else if (brutImposable > 6000) {
    igr = brutImposable * 0.30 - 1400;
  } else if (brutImposable > 4166) {
    igr = brutImposable * 0.20 - 800;
  } else if (brutImposable > 2500) {
    igr = brutImposable * 0.10 - 250;
  }

  // Déduction charges de famille sur l'IGR (360 DH/an soit 30 DH/mois par personne à charge)
  const familyIgrDeduction = (childrenCount + (isMarried ? 1 : 0)) * 30;
  igr = Math.max(0, Math.round(igr - familyIgrDeduction));

  const totalDeductions = deductionCMR + deductionAMO + deductionMutuelle + igr;
  const salaireNet = Math.max(scale.baseNetEstimate, Math.round(salaireBrut - totalDeductions));

  return {
    scale,
    echelon,
    traitementBase,
    indemniteSujetion,
    indemniteEncadrement,
    indemniteResidence,
    allocationsFamiliales,
    primeRevalorisationAccordSocial,
    salaireBrut: Math.round(salaireBrut),
    deductionCMR,
    deductionAMO,
    deductionMutuelle,
    igr,
    totalDeductions,
    salaireNet,
  };
}
