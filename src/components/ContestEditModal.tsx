import React, { useState, useEffect, useRef } from 'react';
import { Contest, Language, ContestStatus, ContestCategory } from '../types';
import { 
  X, Upload, Image as ImageIcon, Save, 
  Trash2, RefreshCw, FileText, AlertCircle
} from 'lucide-react';

interface ContestEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  contest: Contest | null;
  language: Language;
  onSave: (updated: Contest) => Promise<void> | void;
}

export const ContestEditModal: React.FC<ContestEditModalProps> = ({
  isOpen,
  onClose,
  contest,
  language,
  onSave,
}) => {
  const [titleFr, setTitleFr] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [adminNameFr, setAdminNameFr] = useState('');
  const [adminNameAr, setAdminNameAr] = useState('');
  const [category, setCategory] = useState<ContestCategory>('administration');
  const [postsCount, setPostsCount] = useState<number>(1);
  const [degreeLevel, setDegreeLevel] = useState('');
  const [grade, setGrade] = useState('');
  const [specialtyFr, setSpecialtyFr] = useState('');
  const [specialtyAr, setSpecialtyAr] = useState('');
  const [regionFr, setRegionFr] = useState('');
  const [regionAr, setRegionAr] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [status, setStatus] = useState<ContestStatus>('open');
  const [arreteUrl, setArreteUrl] = useState('');
  const [officialSourceUrl, setOfficialSourceUrl] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (contest) {
      setTitleFr(contest.title?.fr || '');
      setTitleAr(contest.title?.ar || '');
      setAdminNameFr(contest.administration?.name?.fr || '');
      setAdminNameAr(contest.administration?.name?.ar || '');
      setCategory(contest.administration?.category || 'administration');
      setPostsCount(contest.postsCount || 1);
      setDegreeLevel(contest.degreeLevel || '');
      setGrade(contest.grade_fr || contest.grade || '');
      setSpecialtyFr(contest.specialty?.fr || '');
      setSpecialtyAr(contest.specialty?.ar || '');
      setRegionFr(contest.region?.fr || '');
      setRegionAr(contest.region?.ar || '');
      setDeadlineDate(contest.deadlineDate || '');
      setStatus(contest.status || 'open');
      setArreteUrl(contest.arreteUrl || '');
      setOfficialSourceUrl(contest.officialSourceUrl || '');
      setImageUrl(contest.image || '');
      setErrorMsg(null);
    }
  }, [contest]);

  if (!isOpen || !contest) return null;

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(language === 'fr' ? 'Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).' : 'يرجى اختيار ملف صورة صالح.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(language === 'fr' ? 'L’image dépasse la taille maximale de 5 Mo.' : 'حجم الصورة يتجاوز 5 ميغابايت.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setErrorMsg(language === 'fr' ? 'Erreur lors de la lecture du fichier.' : 'حدث خطأ أثناء قراءة الملف.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleFr.trim() || !adminNameFr.trim()) {
      setErrorMsg(language === 'fr' ? 'Le titre et l’administration sont obligatoires.' : 'عنوان المباراة والإدارة المشغلة حقول إجبارية.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const fullUpdated: Contest = {
        ...contest,
        title: {
          fr: titleFr.trim(),
          ar: titleAr.trim() || titleFr.trim(),
        },
        administration: {
          ...contest.administration,
          id: contest.administration?.id || 'adm-custom',
          name: {
            fr: adminNameFr.trim(),
            ar: adminNameAr.trim() || adminNameFr.trim(),
          },
          shortName: {
            fr: adminNameFr.trim(),
            ar: adminNameAr.trim() || adminNameFr.trim(),
          },
          category: category,
          logo: imageUrl || contest.administration?.logo || '',
          officialWebsite: officialSourceUrl || contest.administration?.officialWebsite || '',
        },
        image: imageUrl || contest.image,
        postsCount: Number(postsCount) || 1,
        degreeLevel: degreeLevel.trim(),
        grade_fr: grade.trim(),
        grade: grade.trim(),
        deadlineDate: deadlineDate.trim(),
        officialSourceUrl: officialSourceUrl.trim(),
        arreteUrl: arreteUrl.trim(),
        status: status,
        specialty: {
          fr: specialtyFr.trim(),
          ar: specialtyAr.trim() || specialtyFr.trim(),
        },
        region: {
          fr: regionFr.trim(),
          ar: regionAr.trim() || regionFr.trim(),
        },
      };

      await onSave(fullUpdated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'fr' ? 'Erreur lors de l’enregistrement.' : 'حدث خطأ أثناء الحفظ.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#F1E5EC] w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="bg-[#FAF4F7] border-b border-[#F1E5EC] px-5 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8D174B] text-white flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#242126]">
                {language === 'fr' ? 'Modifier l’annonce du concours' : 'تعديل بيانات المباراة'}
              </h3>
              <span className="text-[11px] text-[#6E6773]">
                {language === 'fr' ? 'Édition des métadonnées, diplômes et téléversement d’images' : 'تحديث المعلومات، الشروط والصور المصاحبة'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white text-[#6E6773] hover:text-[#8D174B] border border-[#F1E5EC] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section: Image & Affiche Upload */}
          <div className="bg-[#FAF7F9] p-4 sm:p-5 rounded-2xl border border-[#F1E5EC] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#8D174B] flex items-center gap-1.5 uppercase">
                <ImageIcon className="w-4 h-4" />
                <span>{language === 'fr' ? 'Image de l’avis / Affiche officielle (Upload)' : 'صورة الإعلان / الملصق الرسمي (رفع صورة)'}</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{language === 'fr' ? 'Supprimer l’image' : 'حذف الصورة'}</span>
                </button>
              )}
            </div>

            {/* Image Preview & Upload Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview Box */}
              <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-[#8D174B]/30 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Aperçu"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#8D174B] p-2 text-center">
                    <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                    <span className="text-[9px] font-bold text-gray-400">Aucune image</span>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Action */}
              <div className="flex-1 w-full space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  id="contest-image-upload"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === 'fr' ? 'Sélectionner un fichier (JPG, PNG, WebP)' : 'رفع صورة من جهازك'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#6E6773] shrink-0 font-medium">
                    {language === 'fr' ? 'Ou coller l’URL :' : 'أو رابط مباشر :'}
                  </span>
                  <input
                    type="url"
                    value={imageUrl.startsWith('data:') ? '' : imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://.../affiche.jpg"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#F1E5EC] text-xs focus:border-[#8D174B] focus:outline-hidden bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Titres & Administration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#242126] block">
                {language === 'fr' ? 'Titre du concours (Français) *' : 'عنوان المباراة (بالفرنسية) *'}
              </label>
              <input
                type="text"
                required
                value={titleFr}
                onChange={(e) => setTitleFr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1E5EC] text-xs sm:text-sm focus:border-[#8D174B] focus:outline-hidden bg-white font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#242126] block">
                {language === 'fr' ? 'Titre du concours (Arabe)' : 'عنوان المباراة (بالعربية)'}
              </label>
              <input
                type="text"
                dir="rtl"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1E5EC] text-xs sm:text-sm focus:border-[#8D174B] focus:outline-hidden bg-white font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#242126] block">
                {language === 'fr' ? 'Administration / Ministère (FR) *' : 'الإدارة أو الوزارة المشغلة (FR) *'}
              </label>
              <input
                type="text"
                required
                value={adminNameFr}
                onChange={(e) => setAdminNameFr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1E5EC] text-xs sm:text-sm focus:border-[#8D174B] focus:outline-hidden bg-white font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#242126] block">
                {language === 'fr' ? 'Secteur d’activité' : 'قطاع النشاط'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ContestCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1E5EC] text-xs sm:text-sm focus:border-[#8D174B] focus:outline-hidden bg-white font-medium"
              >
                <option value="administration">Administration Centrale & Ministères</option>
                <option value="education">Éducation & Enseignement Supérieur</option>
                <option value="sante">Santé & CHU</option>
                <option value="finances">Finances & Économie</option>
                <option value="securite">Sécurité & Défense (DGSN, Protection Civile)</option>
                <option value="collectivites">Collectivités Territoriales (Régions, Communes)</option>
                <option value="autres">Autres Établissements Publics</option>
              </select>
            </div>
          </div>

          {/* Section: Postes, Diplômes et Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#242126] block">
                {language === 'fr' ? 'Nombre de postes' : 'عدد المناصب'}
              </label>
              <input
                type="number"
                min="1"
                value={postsCount}
                onChange={(e) => setPostsCount(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1E5EC] text-xs sm:text-sm focus:border-[#8D174B] focus:outline-hidden bg-white font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#242126] block">
                {language === 'fr' ? 'Niveau d’études / Diplôme' : 'المستوى الدراسي / الدبلوم'}
              </label>
              <input
                type="text"
                value={degreeLevel}
                placeholder="ex: Bac+5 (Master / Ingénieur d'État)"
                onChange={(e) => setDegreeLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1E5EC] text-xs sm:text-sm focus:border-[#8D174B] focus:outline-hidden bg-white font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#242126] block">
                {language === 'fr' ? 'Grade statutaire' : 'الدرجة النظامية'}
              </label>
              <input
                type="text"
                value={grade}
                placeholder="ex: Administrateur 2e grade (Échelle 11)"
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1E5EC] text-xs sm:text-sm focus:border-[#8D174B] focus:outline-hidden bg-white font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#242126] block">
                {language === 'fr' ? 'Date limite de dépôt' : 'آخر أجل للترشيح'}
              </label>
              <input
                type="text"
                value={deadlineDate}
                placeholder="JJ/MM/AAAA ou JJ Mois AAAA"
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1E5EC] text-xs sm:text-sm focus:border-[#8D174B] focus:outline-hidden bg-white font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#242126] block">
                {language === 'fr' ? 'Statut du concours' : 'حالة المباراة'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContestStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1E5EC] text-xs sm:text-sm focus:border-[#8D174B] focus:outline-hidden bg-white font-medium"
              >
                <option value="open">Ouvert (Dépôt en cours)</option>
                <option value="closing_soon">Bientôt clôturé (&lt; 7 jours)</option>
                <option value="in_progress">En cours d’examen (Écrit / Oral)</option>
                <option value="results">Résultats publiés</option>
                <option value="closed">Clôturé</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#242126] block">
                {language === 'fr' ? 'Spécialités requises' : 'التخصصات المطلوبة'}
              </label>
              <input
                type="text"
                value={specialtyFr}
                placeholder="ex: Informatique, Gestion, Génie Civil"
                onChange={(e) => {
                  setSpecialtyFr(e.target.value);
                  setSpecialtyAr(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#F1E5EC] text-xs sm:text-sm focus:border-[#8D174B] focus:outline-hidden bg-white font-medium"
              />
            </div>
          </div>

          {/* Section: Liens Officiels */}
          <div className="bg-[#FAF4F7] p-4 rounded-2xl border border-[#F1E5EC] space-y-3">
            <span className="text-xs font-bold text-[#8D174B] uppercase block">
              {language === 'fr' ? 'Liens officiels & Documents PDF' : 'الروابط الرسمية وملفات الـ PDF'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#242126] block">
                  {language === 'fr' ? 'URL de l’Arrêté Officiel (PDF)' : 'رابط قرار فتح المباراة (PDF)'}
                </label>
                <input
                  type="url"
                  value={arreteUrl}
                  placeholder="https://www.emploi-public.ma/fr/concours/download/arrete/..."
                  onChange={(e) => setArreteUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#F1E5EC] text-xs focus:border-[#8D174B] focus:outline-hidden bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#242126] block">
                  {language === 'fr' ? 'Lien de la source / Dépôt officiel' : 'رابط المصدر / إيداع الترشيح'}
                </label>
                <input
                  type="url"
                  value={officialSourceUrl}
                  placeholder="https://depot.emploi-public.ma..."
                  onChange={(e) => setOfficialSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#F1E5EC] text-xs focus:border-[#8D174B] focus:outline-hidden bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#F1E5EC]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              {language === 'fr' ? 'Annuler' : 'إلغاء'}
            </button>

            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-6 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'fr' ? 'Enregistrement...' : 'جارٍ الحفظ...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Enregistrer les modifications' : 'حفظ التعديلات'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
