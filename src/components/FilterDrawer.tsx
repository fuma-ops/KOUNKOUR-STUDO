import React from 'react';
import { Language, ContestStatus, ContestCategory } from '../types';
import { translations } from '../i18n/translations';
import { X, RotateCcw, Filter, Check } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  selectedStatus: ContestStatus | 'all';
  setSelectedStatus: (status: ContestStatus | 'all') => void;
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  selectedDegree: string;
  setSelectedDegree: (degree: string) => void;
  onReset: () => void;
  totalFilteredCount: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  language,
  selectedStatus,
  setSelectedStatus,
  selectedSector,
  setSelectedSector,
  selectedDegree,
  setSelectedDegree,
  onReset,
  totalFilteredCount,
}) => {
  const t = translations[language];

  if (!isOpen) return null;

  const statuses: { id: ContestStatus | 'all'; label: string }[] = [
    { id: 'all', label: t.status.all },
    { id: 'open', label: t.status.open },
    { id: 'upcoming', label: t.status.upcoming },
    { id: 'closed', label: t.status.closed },
  ];

  const degrees = [
    { id: 'all', label: language === 'fr' ? 'Tous les diplômes' : 'جميع الدبلومات' },
    { id: 'Bac', label: 'Baccalauréat (Bac)' },
    { id: 'Bac+2', label: 'Technicien / BTS / DUT (Bac+2)' },
    { id: 'Bac+3', label: 'Licence / Technicien Spécialisé (Bac+3)' },
    { id: 'Bac+5', label: 'Master / Ingénieur / Doctorat (Bac+5+)' },
  ];

  const sectors = [
    { id: 'all', label: t.sectors.all },
    { id: 'administration', label: t.sectors.administration },
    { id: 'education', label: t.sectors.education },
    { id: 'sante', label: t.sectors.sante },
    { id: 'finances', label: t.sectors.finances },
    { id: 'securite', label: t.sectors.securite },
    { id: 'autres', label: t.sectors.autres },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 end-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-[#F1E5EC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#8D174B]" />
              <h2 className="text-lg font-bold text-[#242126]">{t.contests.filterButton}</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-[#8D174B] font-semibold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.contests.resetFilters}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#6E6773] mb-2.5">
                {t.contests.filterByStatus}
              </label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((st) => {
                  const isSelected = selectedStatus === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStatus(st.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-[#8D174B] text-white shadow-xs'
                          : 'bg-[#F8F2F5] text-[#242126] hover:bg-[#F1E5EC]'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Administration / Sector Filter */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#6E6773] mb-2.5">
                {t.contests.filterByAdmin}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {sectors.map((sec) => {
                  const isSelected = selectedSector === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setSelectedSector(sec.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold text-start transition-all ${
                        isSelected
                          ? 'border-[#8D174B] bg-[#FDF2F7] text-[#8D174B]'
                          : 'border-[#F1E5EC] hover:bg-[#F8F2F5] text-[#242126]'
                      }`}
                    >
                      <span>{sec.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#8D174B]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Degree Filter */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#6E6773] mb-2.5">
                {t.contests.filterByDegree}
              </label>
              <div className="space-y-1.5">
                {degrees.map((deg) => {
                  const isSelected = selectedDegree === deg.id;
                  return (
                    <button
                      key={deg.id}
                      onClick={() => setSelectedDegree(deg.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium text-start transition-all ${
                        isSelected
                          ? 'border-[#8D174B] bg-[#FDF2F7] text-[#8D174B] font-bold'
                          : 'border-[#F1E5EC] hover:bg-[#F8F2F5] text-[#242126]'
                      }`}
                    >
                      <span>{deg.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#8D174B]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-5 border-t border-[#F1E5EC] bg-[#FFFDFE]">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.contests.applyFilters}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {totalFilteredCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
