// Mots-clés et hashtags KounKour, tirés des suggestions réelles de Google et YouTube au Maroc
// (relevé du 02/11/2026, arabe + français). Règles :
//  - jamais « مباراة » ou « مباريات 2026 » seuls : sur Google/YouTube ils renvoient surtout au football ;
//    toujours « مباريات التوظيف », « الوظيفة العمومية » ou le grade précis ;
//  - le grade exact est ce que les candidats tapent (« مباراة تقني من الدرجة الثالثة »,
//    « concours technicien 3ème grade », « مباراة متصرفين من الدرجة الثانية ») ;
//  - 5 hashtags au maximum (Instagram n'en prend plus en compte davantage) : 2 larges + 3 précis ;
//    pas de #KounKour ni #reels, qui n'amènent aucun nouveau public.

const YEAR = '2026';
const BASE_AR = `مباريات التوظيف ${YEAR} بالمغرب`;
const BASE_FR = `Concours Maroc ${YEAR}`;

// Du plus précis au plus général : la première règle qui correspond au texte gagne.
const RULES = [
  [/technicien[s]?\s+(de\s+)?3\s*(e|è|ème|eme)\s+grade|تقني(ين)?\s+من\s+الدرجة\s+الثالثة/i,
    'مباراة تقني من الدرجة الثالثة', 'Concours technicien 3ème grade', ['#تقني_من_الدرجة_الثالثة', '#concourstechnicien']],
  [/technicien[s]?\s+(de\s+)?4\s*(e|è|ème|eme)\s+grade|تقني(ين)?\s+من\s+الدرجة\s+الرابعة/i,
    'مباراة تقني من الدرجة الرابعة', 'Concours technicien 4ème grade', ['#تقني_من_الدرجة_الرابعة', '#concourstechnicien']],
  [/technicien[s]?\s+spécialisé|تقني(ين)?\s+متخصص/i,
    'مباراة تقني متخصص', 'Concours technicien spécialisé', ['#تقني_متخصص', '#concourstechnicien']],
  [/administrateur[s]?\s+(de\s+)?2\s*(e|è|ème|eme)\s+grade|متصرف(ين)?\s+من\s+الدرجة\s+الثانية/i,
    'مباراة متصرفين من الدرجة الثانية', 'Concours administrateur 2ème grade', ['#متصرف_من_الدرجة_الثانية', '#concoursadministrateur']],
  [/administrateur[s]?\s+(de\s+)?3\s*(e|è|ème|eme)\s+grade|متصرف(ين)?\s+من\s+الدرجة\s+الثالثة/i,
    'مباراة متصرفين من الدرجة الثالثة', 'Concours administrateur 3ème grade', ['#متصرف_من_الدرجة_الثالثة', '#concoursadministrateur']],
  [/ing[ée]nieur|مهندس/i,
    'مباراة المهندسين', "Concours ingénieur d'État", ['#مباراة_المهندسين', '#concoursingenieur']],
  [/infirmi|ممرض|santé/i,
    'مباراة الممرضين وتقنيي الصحة', 'Concours infirmier Maroc', ['#مباراة_الممرضين', '#concoursinfirmier']],
  [/ma[iî]tre[s]?\s+de\s+conf[ée]rence|أستاذ/i,
    'مباراة أساتذة التعليم العالي', 'Concours maître de conférences', ['#أساتذة_التعليم_العالي', '#concoursuniversite']],
  [/police|dgsn|gardien[s]?\s+de\s+la\s+paix|الأمن\s+الوطني|الشرطة/i,
    'مباراة الأمن الوطني', 'Concours police Maroc', ['#مباراة_الأمن_الوطني', '#concourspolice']],
  [/\bSRM\b|multiservices/i,
    'مباراة الشركات الجهوية متعددة الخدمات', 'Concours SRM', ['#مباريات_SRM', '#concourssrm']],
  [/commune|جماعة|الجماعات/i,
    'مباريات الجماعات الترابية', 'Concours collectivités territoriales', ['#الجماعات_الترابية', '#concourscommune']],
];

const KIND = {
  nouveau: { ar: BASE_AR, fr: 'Emploi public Maroc', tag: '#الوظيفة_العمومية' },
  dernier: { ar: 'آخر أجل للترشح', fr: 'Concours Maroc date limite', tag: '#آخر_أجل' },
  liste: { ar: 'لوائح المترشحين المدعوين لاجتياز المباراة', fr: 'Liste des convoqués concours Maroc', tag: '#لوائح_المترشحين' },
  preparation: { ar: 'التحضير للمباريات · نماذج مباريات مع التصحيح', fr: 'QCM concours corrigé', tag: '#التحضير_للمباريات' },
  reel: { ar: BASE_AR, fr: 'Préparation concours fonction publique Maroc', tag: '#الوظيفة_العمومية' },
};

// text : titre(s) du concours ou texte du post ; kind : nouveau | dernier | liste | preparation | reel.
export function keywordsFor(text = '', kind = 'nouveau') {
  const k = KIND[kind] || KIND.nouveau;
  const rule = RULES.find(([re]) => re.test(text));
  const parts = [k.ar, rule?.[1], rule?.[2] || BASE_FR, k.fr].filter(Boolean);
  const line = [...new Set(parts)].join(' · ');
  const tags = [...new Set(['#مباريات_التوظيف', '#concoursmaroc', ...(rule?.[3] || ['#emploipublic', '#concours2026']), k.tag])].slice(0, 5);
  return { line, tags: tags.join(' ') };
}
