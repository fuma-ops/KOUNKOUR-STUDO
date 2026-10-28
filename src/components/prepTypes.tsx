import React from 'react';
import { BookOpen, ShieldCheck, Award, HelpCircle, FileText } from 'lucide-react';
import type { QcmSet } from '../types';
import { ContentType, contentType, isWrittenSet } from '../data/qcmApi';

// Natures de support : même libellé, même couleur et même icône partout (filtres, rubriques, cartes).
// Les libellés anglais servent aux dossiers entièrement en anglais (banque psychotechnique anglaise).
export const TYPE_META: Record<ContentType, { fr: string; frOne: string; ar: string; en: string; enOne: string; short: [string, string, string]; enShort: [string, string]; icon: React.ElementType; cls: string }> = {
  support: { fr: 'Supports de cours', frOne: 'Support de cours', ar: 'دعامات الدروس', en: 'Method sheets', enOne: 'Method sheet', short: ['cours', 'cours', 'دروس'], enShort: ['sheet', 'sheets'], icon: BookOpen, cls: 'bg-violet-50 text-violet-800 border-violet-200' },
  annale: { fr: 'Annales réelles', frOne: 'Annale réelle', ar: 'نماذج حقيقية', en: 'Past papers', enOne: 'Past paper', short: ['annale', 'annales', 'نماذج'], enShort: ['past paper', 'past papers'], icon: ShieldCheck, cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  blanc: { fr: 'Concours blancs', frOne: 'Concours blanc', ar: 'مباريات تجريبية', en: 'Mock tests', enOne: 'Mock test', short: ['blanc', 'blancs', 'تجريبية'], enShort: ['mock test', 'mock tests'], icon: Award, cls: 'bg-amber-50 text-amber-900 border-amber-200' },
  qcm: { fr: 'QCM d’entraînement', frOne: 'QCM d’entraînement', ar: 'أسئلة تدريبية', en: 'Practice tests', enOne: 'Practice test', short: ['QCM', 'QCM', 'أسئلة'], enShort: ['test', 'tests'], icon: HelpCircle, cls: 'bg-sky-50 text-sky-900 border-sky-200' },
  sujet: { fr: 'Sujets d’entraînement', frOne: 'Sujet d’entraînement', ar: 'مواضيع تدريبية', en: 'Practice papers', enOne: 'Practice paper', short: ['sujet', 'sujets', 'مواضيع'], enShort: ['paper', 'papers'], icon: FileText, cls: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export const TypeBadge: React.FC<{ set: QcmSet; fr: boolean; en?: boolean }> = ({ set, fr, en }) => {
  const ct = contentType(set);
  const m = TYPE_META[ct];
  const Icon = m.icon;
  // Annale ou concours blanc : on précise s'il s'agit du sujet complet ou de ses QCM.
  const detail = ct === 'annale' || ct === 'blanc'
    ? isWrittenSet(set) ? (en ? 'full paper' : fr ? 'sujet complet' : 'موضوع كامل') : (en ? 'questions' : fr ? 'QCM' : 'أسئلة')
    : null;
  return (
    <span className={`font-bold border px-2.5 py-1 rounded-md flex items-center gap-1 ${m.cls}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {en ? m.enOne : fr ? m.frOne : m.ar}
      {detail && <span className="font-semibold opacity-80">· {detail}</span>}
    </span>
  );
};
