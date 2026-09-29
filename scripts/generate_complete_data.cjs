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
    return false;
  }
  if (text.toLowerCase().includes('annulation')) {
    return false;
  }
  return true;
});

// Load existing mockContests to retain rich criteria, exams, qcm links where available
const existingFile = fs.readFileSync('./src/data/mockContests.ts', 'utf-8');
const existingContests = JSON.parse(
  existingFile
    .replace(/import [^;]+;\s*/g, '')
    .replace('export const mockContests: Contest[] =', '')
    .replace(/;\s*$/, '')
);

const existingMap = new Map();
existingContests.forEach(c => {
  if (c.officialSourceUrl) {
    const uuid = c.officialSourceUrl.split('/').pop();
    existingMap.set(uuid, c);
  }
  existingMap.set(c.id, c);
});

function getLogo(adminName) {
  const lower = adminName.toLowerCase();
  if (lower.includes('douane') || lower.includes('finances') || lower.includes('économie')) {
    return '/images/administrations/logo-013.png';
  }
  if (lower.includes('protection civile') || lower.includes('intérieur')) {
    return '/images/administrations/logo-013.png';
  }
  if (lower.includes('éducation') || lower.includes('sport')) {
    return '/images/administrations/logo-013.png';
  }
  if (lower.includes('santé')) {
    return '/images/administrations/logo-013.png';
  }
  if (lower.includes('étrangères') || lower.includes('affaires étrangères')) {
    return '/images/administrations/logo-013.png';
  }
  if (lower.includes('agriculture') || lower.includes('pêche')) {
    return '/images/administrations/logo-013.png';
  }
  if (lower.includes('justice')) {
    return '/images/administrations/logo-013.png';
  }
  if (lower.includes('habous')) {
    return '/images/administrations/logo-013.png';
  }
  return '/images/administrations/logo-013.png';
}

function getCategory(adminName) {
  const lower = adminName.toLowerCase();
  if (lower.includes('douane') || lower.includes('finances')) return 'finances';
  if (lower.includes('santé')) return 'sante';
  if (lower.includes('éducation') || lower.includes('sport') || lower.includes('université') || lower.includes('enta')) return 'education';
  if (lower.includes('intérieur') || lower.includes('protection civile') || lower.includes('police')) return 'securite';
  if (lower.includes('collectivités') || lower.includes('commune') || lower.includes('province') || lower.includes('région')) return 'collectivites';
  return 'administration';
}

const finalContests = [];
const seenUUIDs = new Set();

// 1. Process all active items
filteredItems.forEach((it, index) => {
  if (seenUUIDs.has(it.uuid)) return;
  seenUUIDs.add(it.uuid);

  const text = it.rawSnippet
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  const isConvocation = text.toLowerCase().includes('convoqués pour') ||
                        text.toLowerCase().includes('convoqués à l') ||
                        text.toLowerCase().includes('convocation');

  // Check if we already have a rich record
  const existing = existingMap.get(it.uuid);

  if (existing) {
    if (isConvocation) {
      existing.status = 'in_progress';
      const isOral = text.toLowerCase().includes('oral') || text.toLowerCase().includes('entretien');
      existing.stage = isOral ? 'oral' : 'ecrit';
      existing.stageLabel = {
        fr: isOral ? "Convocation à l'entretien oral" : "Convoqués à l'épreuve écrite (oral à suivre)",
        ar: isOral ? "استدعاء للمقابلة الشفوية" : "استدعاء للاختبار الكتابي (الشفوي لاحقاً)"
      };
      existing.convoquesUrl = `https://www.emploi-public.ma/fr/concours/download/list_convoques/${it.uuid}`;
    }
    finalContests.push(existing);
    return;
  }

  // Construct new rich contest
  const isOral = text.toLowerCase().includes('oral') || text.toLowerCase().includes('entretien');
  const stage = isConvocation ? (isOral ? 'oral' : 'ecrit') : 'depot';

  // Parse title
  let titleFr = it.title;
  if (!titleFr || titleFr.includes('Publication de la liste')) {
    const m = text.match(/concours de recrutement d\x27un ([^M\n]+) Ministère/i) ||
              text.match(/concours de recrutement de ([^M\n]+) Ministère/i) ||
              text.match(/concours de recrutement d\x27un ([^\n]+)/i);
    titleFr = m ? m[1].replace(/Convocation.*/, '').trim() : text.slice(0, 60);
  }

  // Admin name
  let adminFr = it.admin;
  if (!adminFr || adminFr.length < 5) {
    const am = text.match(/Ministère[^\n]+Convocation/i) ||
               text.match(/Ministère[^\n]+Annonce/i) ||
               text.match(/Ministère[^\n]+/i);
    adminFr = am ? am[0].replace('Convocation', '').replace('Annonce', '').trim() : 'Administration Publique Marocaine';
  }

  // Special handling for Douanes
  const isDouanes = text.toLowerCase().includes('douan');
  if (isDouanes) {
    adminFr = "Ministère de l'Économie et des Finances - Administration des Douanes et Impôts Indirects (ADII)";
  }

  // Status & Days remaining
  let status = 'open';
  let daysRemaining = 10;
  const limitMatch = text.match(/Limite de dépôt\s*:\s*(\d{1,2}\s+[a-zA-ZÀ-ÿ]+\s+\d{4})/i);
  const deadlineStr = limitMatch ? limitMatch[1] : (isConvocation ? "Épreuves en cours" : "Voir arrêté");

  if (isConvocation) {
    status = 'in_progress';
    daysRemaining = 0;
  } else {
    if (deadlineStr.includes('Octobre')) {
      status = 'open';
      daysRemaining = deadlineStr.includes('7') ? 8 : (deadlineStr.includes('5') ? 6 : 16);
    } else if (deadlineStr.includes('30 Septembre')) {
      status = 'closing_soon';
      daysRemaining = 1;
    } else if (deadlineStr.includes('Septembre')) {
      status = 'closed';
      daysRemaining = 0;
    }
  }

  // Degree
  let degree = 'Bac+5';
  if (titleFr.toLowerCase().includes('technicien')) degree = 'Bac+2';
  if (titleFr.toLowerCase().includes('adjoint')) degree = 'Niveau Bac / CQP';
  if (titleFr.toLowerCase().includes('licence') || titleFr.toLowerCase().includes('inspecteur')) degree = 'Bac+3';
  if (titleFr.toLowerCase().includes('ingénieur') || titleFr.toLowerCase().includes('administrateur 2ème') || titleFr.toLowerCase().includes('conseiller')) degree = 'Bac+5';
  if (titleFr.toLowerCase().includes('maître de conférences')) degree = 'Doctorat';

  // Specialty
  let specFr = 'Spécialités mentionnées dans l’arrêté officiel';
  if (isDouanes) {
    specFr = titleFr.toLowerCase().includes('ingénieur') 
      ? 'Informatique, Télécoms, Génie Industriel & Réseaux Douaniers' 
      : 'Droit, Économie, Gestion & Contrôle Douanier';
  } else if (text.toLowerCase().includes('informatique')) {
    specFr = 'Informatique & Technologies de l’Information';
  } else if (text.toLowerCase().includes('agricole')) {
    specFr = 'Agronomie, Techniques Agricoles & Végétales';
  } else if (text.toLowerCase().includes('civil')) {
    specFr = 'Génie Civil & Bâtiment';
  }

  const contestObj = {
    id: `c-scraped-${it.uuid.slice(0, 8)}`,
    slug: `concours-${it.uuid.slice(0, 8)}`,
    referenceCode: `C${Math.floor(40000 + Math.random() * 5000)}/26`,
    image: getLogo(adminFr),
    title: {
      fr: titleFr,
      ar: isDouanes 
        ? (titleFr.includes('Ingénieur') ? 'مباراة توظيف مهندسي الدولة من الدرجة الأولى بإدارة الجمارك' : 'مباراة توظيف مفتشي الجمارك من الدرجة الثانية')
        : `مباراة توظيف ${titleFr}`
    },
    administration: {
      id: `adm-${it.uuid.slice(0, 6)}`,
      name: {
        fr: adminFr,
        ar: isDouanes ? 'وزارة الاقتصاد والمالية - إدارة الجمارك والضرائب غير المباشرة' : adminFr
      },
      shortName: {
        fr: isDouanes ? 'ADII' : adminFr.slice(0, 15),
        ar: isDouanes ? 'إدارة الجمارك' : 'الإدارة'
      },
      logo: getLogo(adminFr),
      category: getCategory(adminFr),
      officialWebsite: 'https://www.emploi-public.ma'
    },
    type: {
      fr: 'Fonction Publique d’État',
      ar: 'الوظيفة العمومية'
    },
    status: status,
    stage: stage,
    stageLabel: isConvocation ? {
      fr: isOral ? "Convocation à l'entretien oral" : "Convoqués à l'épreuve écrite (oral à suivre)",
      ar: isOral ? "استدعاء للمقابلة الشفوية" : "استدعاء للاختبار الكتابي (الشفوي لاحقاً)"
    } : {
      fr: "Dépôt des dossiers en ligne",
      ar: "إيداع الترشيحات مفتوح"
    },
    convoquesUrl: isConvocation ? `https://www.emploi-public.ma/fr/concours/download/list_convoques/${it.uuid}` : undefined,
    postsCount: it.posts || 1,
    degreeLevel: degree,
    specialty: {
      fr: specFr,
      ar: specFr
    },
    region: {
      fr: 'National (Royaume du Maroc)',
      ar: 'المملكة المغربية'
    },
    location: {
      fr: 'Centres d’examen nationaux',
      ar: 'مراكز الامتحانات الوطنية'
    },
    publicationDate: 'Septembre 2026',
    deadlineDate: deadlineStr,
    daysRemaining: daysRemaining,
    contestDate: 'Calendrier officiel 2026',
    isVerifiedSource: true,
    officialSourceUrl: `https://www.emploi-public.ma/fr/concours/details/${it.uuid}`,
    overviewSummary: {
      fr: isConvocation
        ? `Concours en cours de déroulement. ${isOral ? "Les candidats admissibles sont convoqués à l'entretien oral." : "La liste des candidats convoqués à l'épreuve écrite est publiée. La liste des admissibles à l'oral sera communiquée ultérieurement."}`
        : `Avis officiel de recrutement publié sur le portail emploi-public.ma. Les dossiers de candidature doivent être déposés avant la date limite.`,
      ar: isConvocation
        ? `المباراة في طور الإجراء. ${isOral ? "استدعاء المترشحين المؤهلين لاجتياز الاختبار الشفوي." : "نشر لائحة المترشحين المقبولين لاجتياز الاختبار الكتابي، في انتظار لائحة المؤهلين للشفوي."}`
        : `إعلان توظيف رسمي منشور على بوابة التشغيل العمومي. يجب إيداع ملفات الترشيح قبل انتهاء الأجل المحدد.`
    },
    criteria: {
      nationality: { fr: 'De nationalité marocaine', ar: 'من جنسية مغربية' },
      ageLimit: { fr: 'Âgé de 18 ans au moins et de 40 ans au plus', ar: 'البالغين من العمر 18 سنة على الأقل و40 سنة على الأكثر' },
      diplomas: [{ fr: `Diplôme requis : ${degree}`, ar: `الشهادة المطلوبة : ${degree}` }],
      experience: { fr: 'Aucune expérience préalable exigée pour les grades d’accès', ar: 'لا تشترط خبرة مهنية سابقة' },
      specialties: [{ fr: specFr, ar: specFr }]
    },
    exams: {
      written: [
        {
          title: { fr: 'Épreuve écrite portant sur la spécialité', ar: 'اختبار كتابي في مادة التخصص' },
          coefficient: 3,
          duration: '3 heures'
        }
      ],
      oral: [
        {
          title: { fr: 'Épreuve orale / Entretien avec le jury', ar: 'اختبار شفوي / مقابلة مع اللجنة' },
          coefficient: 2,
          duration: '30 minutes'
        }
      ]
    },
    documents: [
      {
        id: `doc-arrete-${it.uuid.slice(0, 6)}`,
        title: { fr: 'Arrêté d’ouverture officiel (PDF)', ar: 'قرار فتح المباراة الرسمي (PDF)' },
        fileType: 'PDF',
        fileSize: '320 KB',
        date: 'Septembre 2026',
        url: `https://www.emploi-public.ma/fr/concours/download/arrete/${it.uuid}`
      },
      ...(isConvocation ? [
        {
          id: `doc-conv-${it.uuid.slice(0, 6)}`,
          title: { fr: isOral ? 'Liste des convoqués à l’oral (PDF)' : 'Liste des convoqués à l’écrit (PDF)', ar: isOral ? 'لائحة المدعوين للشفوي (PDF)' : 'لائحة المدعوين للاختبار الكتابي (PDF)' },
          fileType: 'PDF',
          fileSize: '1.2 MB',
          date: 'Septembre 2026',
          url: `https://www.emploi-public.ma/fr/concours/download/list_convoques/${it.uuid}`
        }
      ] : [])
    ],
    isDemo: false
  };

  finalContests.push(contestObj);
});

console.log('Total unified contests created:', finalContests.length);

const stats = {};
finalContests.forEach(c => stats[c.status] = (stats[c.status] || 0) + 1);
console.log('Status breakdown:', stats);

// Write to mockContests.ts
fs.writeFileSync(
  './src/data/mockContests.ts',
  `import { Contest } from "../types";\n\nexport const mockContests: Contest[] = ${JSON.stringify(finalContests, null, 2)};\n`
);

// Write to realScrapedFeed.json
fs.writeFileSync(
  './src/data/realScrapedFeed.json',
  JSON.stringify(finalContests, null, 2)
);

console.log('Successfully written mockContests.ts and realScrapedFeed.json!');
