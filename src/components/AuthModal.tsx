import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { getSupabase, SITE_ORIGIN } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

// Connexion / inscription réelles via Supabase Auth. La sécurité des données
// repose sur les RLS côté base ; ce composant ne fait qu'authentifier.
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, language }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!isOpen) return null;
  const isRTL = language === 'ar';

  const t = {
    title: mode === 'signin'
      ? (language === 'fr' ? 'Connexion' : 'تسجيل الدخول')
      : (language === 'fr' ? 'Créer un compte' : 'إنشاء حساب'),
    email: language === 'fr' ? 'Adresse e-mail' : 'البريد الإلكتروني',
    password: language === 'fr' ? 'Mot de passe' : 'كلمة المرور',
    submit: mode === 'signin'
      ? (language === 'fr' ? 'Se connecter' : 'دخول')
      : (language === 'fr' ? "S'inscrire" : 'تسجيل'),
    google: language === 'fr' ? 'Continuer avec Google' : 'المتابعة عبر Google',
    toSignup: language === 'fr' ? "Pas de compte ? S'inscrire" : 'ليس لديك حساب؟ سجّل',
    toSignin: language === 'fr' ? 'Déjà un compte ? Se connecter' : 'لديك حساب؟ دخول',
    checkEmail: language === 'fr'
      ? 'Compte créé. Vérifiez votre e-mail pour confirmer, puis connectez-vous.'
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
        if (error) setError(error.message);
        else onClose();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: SITE_ORIGIN || undefined },
        });
        if (error) setError(error.message);
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
    if (error) setError(error.message);
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

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          {info && <p className="text-xs font-semibold text-emerald-700">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8D174B] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#70113B] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'signin' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
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
          {mode === 'signin' ? t.toSignup : t.toSignin}
        </button>
      </div>
    </div>
  );
};
