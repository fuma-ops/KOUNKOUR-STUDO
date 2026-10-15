import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, Loader2, KeyRound } from 'lucide-react';
import { Language } from '../types';
import { getSupabase, isGoogleAuthEnabled, SITE_ORIGIN } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

// Messages d'erreur Supabase (en anglais) traduits pour le candidat.
export function authErrorMessage(message: string, language: Language): string {
  const fr = language === 'fr';
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return fr ? 'E-mail ou mot de passe incorrect.' : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (m.includes('email not confirmed')) return fr ? 'Adresse e-mail pas encore confirmée : ouvrez le lien reçu par e-mail.' : 'لم يتم تأكيد البريد الإلكتروني بعد: افتح الرابط المرسل إليك.';
  if (m.includes('already registered') || m.includes('already been registered')) return fr ? 'Un compte existe déjà avec cet e-mail. Connectez-vous.' : 'يوجد حساب بهذا البريد. سجّل الدخول.';
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) return fr ? 'Trop de tentatives. Réessayez dans quelques minutes.' : 'محاولات كثيرة. أعد المحاولة بعد دقائق.';
  if (m.includes('password') && (m.includes('at least') || m.includes('short') || m.includes('weak'))) return fr ? 'Mot de passe trop court (6 caractères minimum).' : 'كلمة المرور قصيرة جداً (6 أحرف على الأقل).';
  if (m.includes('same') && m.includes('password')) return fr ? 'Choisissez un mot de passe différent de l’ancien.' : 'اختر كلمة مرور مختلفة عن القديمة.';
  if (m.includes('invalid') && m.includes('email')) return fr ? 'Adresse e-mail invalide.' : 'بريد إلكتروني غير صالح.';
  if (m.includes('fetch') || m.includes('network')) return fr ? 'Connexion internet indisponible. Réessayez.' : 'تعذر الاتصال بالإنترنت. أعد المحاولة.';
  return fr ? 'Une erreur est survenue. Réessayez.' : 'حدث خطأ. أعد المحاولة.';
}

// Connexion / inscription réelles via Supabase Auth. La sécurité des données
// repose sur les RLS côté base ; ce composant ne fait qu'authentifier.
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, language }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  // Le bouton Google n'apparaît que si le fournisseur est activé dans Supabase
  // (sinon le candidat tomberait sur une page d'erreur).
  const [googleOn, setGoogleOn] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    isGoogleAuthEnabled().then((on) => alive && setGoogleOn(on));
    return () => {
      alive = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;
  const isRTL = language === 'ar';

  const t = {
    title: mode === 'signin'
      ? (language === 'fr' ? 'Connexion' : 'تسجيل الدخول')
      : mode === 'reset'
        ? (language === 'fr' ? 'Mot de passe oublié' : 'نسيت كلمة المرور')
        : (language === 'fr' ? 'Créer un compte' : 'إنشاء حساب'),
    email: language === 'fr' ? 'Adresse e-mail' : 'البريد الإلكتروني',
    password: language === 'fr' ? 'Mot de passe' : 'كلمة المرور',
    submit: mode === 'signin'
      ? (language === 'fr' ? 'Se connecter' : 'دخول')
      : mode === 'reset'
        ? (language === 'fr' ? 'Recevoir le lien' : 'إرسال الرابط')
        : (language === 'fr' ? "S'inscrire" : 'تسجيل'),
    forgot: language === 'fr' ? 'Mot de passe oublié ?' : 'نسيت كلمة المرور؟',
    resetHint: language === 'fr'
      ? 'Saisissez votre e-mail : nous vous envoyons un lien pour choisir un nouveau mot de passe.'
      : 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لاختيار كلمة مرور جديدة.',
    resetSent: language === 'fr'
      ? 'Si un compte existe avec cet e-mail, un lien de réinitialisation vient d’être envoyé. Pensez à vérifier les spams.'
      : 'إذا كان هناك حساب بهذا البريد، فقد أرسلنا رابط إعادة التعيين. تحقق أيضاً من الرسائل غير المرغوب فيها.',
    backToSignin: language === 'fr' ? 'Retour à la connexion' : 'العودة لتسجيل الدخول',
    google: language === 'fr' ? 'Continuer avec Google' : 'المتابعة عبر Google',
    toSignup: language === 'fr' ? "Pas de compte ? S'inscrire" : 'ليس لديك حساب؟ سجّل',
    toSignin: language === 'fr' ? 'Déjà un compte ? Se connecter' : 'لديك حساب؟ دخول',
    checkEmail: language === 'fr'
      ? 'Compte créé. Ouvrez le lien reçu par e-mail pour le confirmer (pensez aux spams), puis connectez-vous.'
      : 'تم إنشاء الحساب. تحقق من بريدك للتأكيد ثم سجّل الدخول.',
    unavailable: language === 'fr'
      ? 'Service d’authentification indisponible.'
      : 'خدمة المصادقة غير متوفرة.',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError(t.unavailable);
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(authErrorMessage(error.message, language));
        else onClose();
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: SITE_ORIGIN ? `${SITE_ORIGIN}/profil` : undefined,
        });
        if (error) setError(authErrorMessage(error.message, language));
        else setInfo(t.resetSent);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: SITE_ORIGIN || undefined },
        });
        if (error) setError(authErrorMessage(error.message, language));
        // Sans confirmation d'e-mail, Supabase ouvre directement la session.
        else if (data.session) onClose();
        else setInfo(t.checkEmail);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError(t.unavailable);
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: SITE_ORIGIN || undefined },
    });
    if (error) setError(authErrorMessage(error.message, language));
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#242126]">{t.title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6E6773] hover:bg-[#FAF4F7]"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {googleOn && mode !== 'reset' && (
          <>
            <button
              onClick={handleGoogle}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#F1E5EC] bg-white py-2.5 text-sm font-bold text-[#242126] transition-colors hover:bg-[#FAF4F7]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
              </svg>
              <span>{t.google}</span>
            </button>

            <div className="mb-4 flex items-center gap-3 text-[11px] text-[#9A93A0]">
              <div className="h-px flex-1 bg-[#F1E5EC]" />
              <span>{language === 'fr' ? 'ou' : 'أو'}</span>
              <div className="h-px flex-1 bg-[#F1E5EC]" />
            </div>
          </>
        )}

        {mode === 'reset' && <p className="mb-3 text-xs leading-relaxed text-[#6E6773]">{t.resetHint}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#F1E5EC] px-3 focus-within:border-[#8D174B]">
            <Mail className="h-4 w-4 text-[#8D174B]" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.email}
              className="w-full bg-transparent py-2.5 text-sm text-[#242126] focus:outline-none"
            />
          </div>
          {mode !== 'reset' && (
          <div className="flex items-center gap-2 rounded-xl border border-[#F1E5EC] px-3 focus-within:border-[#8D174B]">
            <Lock className="h-4 w-4 text-[#8D174B]" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
              className="w-full bg-transparent py-2.5 text-sm text-[#242126] focus:outline-none"
            />
          </div>
          )}
          {mode === 'signin' && (
            <div className="text-end">
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setError(null);
                  setInfo(null);
                }}
                className="text-[11px] font-semibold text-[#6E6773] hover:text-[#8D174B] hover:underline"
              >
                {t.forgot}
              </button>
            </div>
          )}

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          {info && <p className="text-xs font-semibold text-emerald-700">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8D174B] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#70113B] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'signin' ? <LogIn className="h-4 w-4" /> : mode === 'reset' ? <KeyRound className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            <span>{t.submit}</span>
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
            setInfo(null);
          }}
          className="mt-4 w-full text-center text-xs font-semibold text-[#8D174B] hover:underline"
        >
          {mode === 'signin' ? t.toSignup : mode === 'reset' ? t.backToSignin : t.toSignin}
        </button>

        <p className="mt-3 text-center text-[10px] leading-relaxed text-[#9A93A0]">
          {language === 'fr' ? 'En continuant, vous acceptez les ' : 'بالمتابعة، فإنك توافق على '}
          <a href="/conditions" target="_blank" rel="noopener" className="font-semibold text-[#8D174B] hover:underline">
            {language === 'fr' ? 'conditions d’utilisation' : 'شروط الاستخدام'}
          </a>
          {language === 'fr' ? ' et la ' : ' و'}
          <a href="/confidentialite" target="_blank" rel="noopener" className="font-semibold text-[#8D174B] hover:underline">
            {language === 'fr' ? 'politique de confidentialité' : 'سياسة الخصوصية'}
          </a>
          .
        </p>
      </div>
    </div>
  );
};

// Retour du lien « mot de passe oublié » : Supabase ouvre une session de récupération
// (événement PASSWORD_RECOVERY) ; le candidat choisit ici son nouveau mot de passe.
// Lien de récupération (flux implicite) : lu dès le chargement du module, avant que
// le client Supabase ne consomme le fragment #…type=recovery de l'adresse.
const RECOVERY_AT_LOAD = typeof window !== 'undefined' && /type=recovery/.test(window.location.hash);

export const PasswordRecoveryModal: React.FC<{ language: Language }> = ({ language }) => {
  const fr = language === 'fr';
  const [open, setOpen] = useState(RECOVERY_AT_LOAD);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setOpen(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  if (!open) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(authErrorMessage(error.message, language));
    else setDone(true);
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" dir={fr ? 'ltr' : 'rtl'}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-scale-in">
        <h2 className="mb-2 text-lg font-extrabold text-[#242126]">{fr ? 'Nouveau mot de passe' : 'كلمة مرور جديدة'}</h2>
        {done ? (
          <>
            <p className="mb-4 text-sm font-semibold text-emerald-700">
              {fr ? 'Mot de passe modifié. Vous êtes connecté.' : 'تم تغيير كلمة المرور. أنت متصل الآن.'}
            </p>
            <button onClick={() => setOpen(false)} className="w-full rounded-xl bg-[#8D174B] py-2.5 text-sm font-bold text-white hover:bg-[#70113B] active:scale-95 transition-all">
              {fr ? 'Continuer' : 'متابعة'}
            </button>
          </>
        ) : (
          <form onSubmit={save} className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#F1E5EC] px-3 focus-within:border-[#8D174B]">
              <Lock className="h-4 w-4 text-[#8D174B]" />
              <input
                type="password"
                required
                minLength={6}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={fr ? 'Nouveau mot de passe (6 caractères min.)' : 'كلمة المرور الجديدة (6 أحرف على الأقل)'}
                className="w-full bg-transparent py-2.5 text-sm text-[#242126] focus:outline-none"
              />
            </div>
            {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8D174B] py-2.5 text-sm font-bold text-white hover:bg-[#70113B] disabled:opacity-60 active:scale-95 transition-all">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              <span>{fr ? 'Enregistrer' : 'حفظ'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
