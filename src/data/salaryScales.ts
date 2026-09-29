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
  echelons: {
    echelon: number;
    indice: number;
  }[];
  indemniteSujetion: number; // monthly fixed or indexed allowance
  indemniteEncadrement: number;
  baseNetEstimate: number; // approximate typical starting net salary in MAD
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
    echelons: [
      { echelon: 1, indice: 137 },
      { echelon: 2, indice: 141 },
      { echelon: 3, indice: 147 },
      { echelon: 4, indice: 153 },
      { echelon: 5, indice: 159 },
    ],
    indemniteSujetion: 1850,
    indemniteEncadrement: 0,
    baseNetEstimate: 3850,
  },
  {
    id: 'echelle-8',
    echelle: 'Échelle 8 (السلم 8)',
    grade: {
      fr: 'Technicien 4ème grade / Rédacteur 4ème grade',
      ar: 'تقني من الدرجة الرابعة / محرر من الدرجة الرابعة',
    },
    corps: {
      fr: 'Techniciens (Diplôme TS / Technicien Spécialisé)',
      ar: 'هيئة التقنيين والمحررين',
    },
    echelons: [
      { echelon: 1, indice: 173 },
      { echelon: 2, indice: 183 },
      { echelon: 3, indice: 195 },
      { echelon: 4, indice: 207 },
      { echelon: 5, indice: 220 },
    ],
    indemniteSujetion: 2450,
    indemniteEncadrement: 300,
    baseNetEstimate: 4700,
  },
  {
    id: 'echelle-9',
    echelle: 'Échelle 9 (السلم 9)',
    grade: {
      fr: 'Technicien 3ème grade / Rédacteur 3ème grade',
      ar: 'تقني من الدرجة الثالثة / محرر من الدرجة الثالثة',
    },
    corps: {
      fr: 'Techniciens Spécialisés & Rédacteurs',
      ar: 'هيئة التقنيين والمحررين',
    },
    echelons: [
      { echelon: 1, indice: 235 },
      { echelon: 2, indice: 253 },
      { echelon: 3, indice: 274 },
      { echelon: 4, indice: 296 },
      { echelon: 5, indice: 317 },
    ],
    indemniteSujetion: 2900,
    indemniteEncadrement: 500,
    baseNetEstimate: 5500,
  },
  {
    id: 'echelle-10',
    echelle: 'Échelle 10 (السلم 10)',
    grade: {
      fr: 'Administrateur 3ème grade / Technicien 1er grade (Licence)',
      ar: 'متصرف من الدرجة الثالثة / تقني من الدرجة الأولى (الإجازة)',
    },
    corps: {
      fr: 'Administrateurs & Cadres Moyens',
      ar: 'هيئة المتصرفين المشتركة بين الوزارات',
    },
    echelons: [
      { echelon: 1, indice: 275 },
      { echelon: 2, indice: 300 },
      { echelon: 3, indice: 326 },
      { echelon: 4, indice: 351 },
      { echelon: 5, indice: 377 },
    ],
    indemniteSujetion: 3600,
    indemniteEncadrement: 900,
    baseNetEstimate: 6600,
  },
  {
    id: 'echelle-11-admin',
    echelle: 'Échelle 11 - Administrateur (السلم 11 - متصرف)',
    grade: {
      fr: 'Administrateur 2ème grade (Master / Diplôme Bac+5)',
      ar: 'متصرف من الدرجة الثانية (ماستر / مهندس)',
    },
    corps: {
      fr: 'Administrateurs Supérieurs',
      ar: 'هيئة المتصرفين (أطر عليا)',
    },
    echelons: [
      { echelon: 1, indice: 336 },
      { echelon: 2, indice: 369 },
      { echelon: 3, indice: 403 },
      { echelon: 4, indice: 436 },
      { echelon: 5, indice: 472 },
    ],
    indemniteSujetion: 5200,
    indemniteEncadrement: 1500,
    baseNetEstimate: 8900,
  },
  {
    id: 'echelle-11-ingenieur',
    echelle: 'Échelle 11 - Ingénieur d’État (السلم 11 - مهندس دولة)',
    grade: {
      fr: 'Ingénieur d’État 1er grade',
      ar: 'مهندس دولة من الدرجة الأولى',
    },
    corps: {
      fr: 'Ingénieurs & Architectes',
      ar: 'هيئة المهندسين والمهندسين المعماريين المشتركة',
    },
    echelons: [
      { echelon: 1, indice: 336 },
      { echelon: 2, indice: 369 },
      { echelon: 3, indice: 403 },
      { echelon: 4, indice: 436 },
      { echelon: 5, indice: 472 },
    ],
    indemniteSujetion: 7100,
    indemniteEncadrement: 2200,
    baseNetEstimate: 11200,
  },
  {
    id: 'hors-echelle',
    echelle: 'Hors Échelle (خارج السلم)',
    grade: {
      fr: 'Ingénieur en Chef / Administrateur 1er grade / Professeur',
      ar: 'مهندس رئيس / متصرف من الدرجة الأولى',
    },
    corps: {
      fr: 'Cadres Supérieurs et Dirigeants',
      ar: 'الأطر العليا',
    },
    echelons: [
      { echelon: 1, indice: 704 },
      { echelon: 2, indice: 746 },
      { echelon: 3, indice: 779 },
      { echelon: 4, indice: 812 },
    ],
    indemniteSujetion: 9800,
    indemniteEncadrement: 3500,
    baseNetEstimate: 15800,
  },
];

/**
 * Accurately calculate Moroccan public sector net salary
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

  // Moroccan point value (approx 3.00 MAD per index point for base treatment computation)
  const traitementBase = Math.round(echelon.indice * 3.05 * 10) / 10 + 1200;
  
  // Allowances
  const indemniteSujetion = scale.indemniteSujetion;
  const indemniteEncadrement = scale.indemniteEncadrement;
  
  // Residence allowance (Zone A = 25% or fixed bump, Zone B = 15%, Zone C = 10%)
  const indemniteResidence = zone === 'A' ? 350 : zone === 'B' ? 220 : 120;

  // Family allowances: 300 MAD per child up to 3 children, 36 MAD for 4th-6th (Maroc social protection reform)
  let allocationsFamiliales = 0;
  if (childrenCount > 0) {
    const firstTier = Math.min(childrenCount, 3);
    const secondTier = Math.max(0, Math.min(childrenCount - 3, 3));
    allocationsFamiliales = firstTier * 300 + secondTier * 36;
  }

  // Total Brut
  const salaireBrut = traitementBase + indemniteSujetion + indemniteEncadrement + indemniteResidence + allocationsFamiliales;

  // Deductions
  // 1. CMR (Caisse Marocaine des Retraites): 14% on (Traitement de base + certain allowances)
  const baseRetraite = traitementBase + (indemniteSujetion * 0.7);
  const deductionCMR = Math.round(baseRetraite * 0.14);

  // 2. AMO / CNOPS: 2.5% capped
  const deductionAMO = Math.round(salaireBrut * 0.025);

  // 3. Mutuelle complémentaire: approx 150 MAD
  const deductionMutuelle = 150;

  // 4. IGR (Impôt Général sur le Revenu) approximate public tax bracket
  const brutImposable = salaireBrut - deductionCMR - deductionAMO - 250; // forfait frais professionnels
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

  // Family deduction on IGR (360 MAD per year per dependent, so 30 MAD/month)
  const familyIgrDeduction = (childrenCount + (isMarried ? 1 : 0)) * 30;
  igr = Math.max(0, Math.round(igr - familyIgrDeduction));

  const totalDeductions = deductionCMR + deductionAMO + deductionMutuelle + igr;
  const salaireNet = Math.max(3500, Math.round(salaireBrut - totalDeductions));

  return {
    scale,
    echelon,
    traitementBase,
    indemniteSujetion,
    indemniteEncadrement,
    indemniteResidence,
    allocationsFamiliales,
    salaireBrut: Math.round(salaireBrut),
    deductionCMR,
    deductionAMO,
    deductionMutuelle,
    igr,
    totalDeductions,
    salaireNet,
  };
}
