import React, { useState } from 'react';
import { Mail, Lock, User, Phone, ArrowRight, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ChambaLogo } from '../components/ChambaLogo';
import { useAuth } from '../context/AuthContext';
import { formatAuthError } from '../utils/authErrors';

interface AuthScreenProps {
  onSuccess: (isNewUser?: boolean, registeredName?: string) => void;
  onBackToWelcome: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onBackToWelcome,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInAsGuest, resetPassword, loadDemoData } = useAuth();

  const handleGuestLogin = async () => {
    setLocalError(null);
    setIsSubmitting(true);
    try {
      await signInAsGuest('Invitado');
      onSuccess(false);
    } catch (err: any) {
      setLocalError(err.message || 'No se pudo iniciar como invitado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoCredentials = () => {
    setEmail('demo@chambaapp.com');
    setPassword('123456');
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        onSuccess(false);
      } else if (mode === 'register') {
        if (!name.trim()) throw new Error('Por favor introduce tu nombre.');
        await signUpWithEmail(name, email, password, phone);
        onSuccess(true, name.trim());
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch (err: any) {
      console.error(err);
      const formatted = formatAuthError(err);
      setLocalError(formatted.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      onSuccess(false);
    } catch (err: any) {
      const formatted = formatAuthError(err);
      setLocalError(formatted.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setLocalError(null);
    setIsSubmitting(true);
    try {
      // Use standard demo credentials or sign up demo account
      const demoEmail = 'ana.limpieza@chambaapp.test';
      const demoPass = 'Chamba123!';
      try {
        await signInWithEmail(demoEmail, demoPass);
      } catch {
        await signUpWithEmail('Ana', demoEmail, demoPass, '55 1234 5678');
      }
      await loadDemoData();
      onSuccess(false);
    } catch (err: any) {
      setLocalError(err.message || 'No se pudo iniciar la demo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-between p-5 max-w-md mx-auto">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pt-2 mb-6">
          <button
            onClick={onBackToWelcome}
            className="text-xs font-heading font-medium text-slate-500 hover:text-[#07326F] cursor-pointer"
          >
            ← Volver
          </button>
          <ChambaLogo variant="horizontal" size="sm" />
        </div>

        {/* Title */}
        <div className="mb-5">
          <h1 className="font-heading font-bold text-2xl text-[#07326F]">
            {mode === 'login' && 'Iniciar sesión'}
            {mode === 'register' && 'Crear cuenta'}
            {mode === 'forgot' && 'Recuperar contraseña'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login' && 'Entra a tu cuenta para administrar tu negocio.'}
            {mode === 'register' && 'Regístrate gratis para comenzar a organizar tu chamba.'}
            {mode === 'forgot' && 'Te enviaremos un correo para restablecer tu acceso.'}
          </p>
        </div>

        {localError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed">{localError}</span>
            </div>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleFillDemoCredentials}
                className="px-2.5 py-1 rounded-lg bg-rose-700 text-white font-heading font-semibold text-[11px] hover:bg-rose-800 transition-all cursor-pointer shadow-2xs"
              >
                Rellenar cuenta demo
              </button>
              <button
                type="button"
                onClick={handleGuestLogin}
                className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 font-heading font-semibold text-[11px] hover:bg-rose-100 transition-all cursor-pointer"
              >
                Entrar como invitado
              </button>
            </div>
          </div>
        )}

        {resetSent && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Correo enviado. Revisa tu bandeja de entrada o spam.</span>
          </div>
        )}

        {/* Quick test credentials box for external reviewers */}
        {mode === 'login' && (
          <div className="mb-3.5 p-3 rounded-2xl bg-[#07326F]/5 border border-[#07326F]/15 flex items-center justify-between text-xs">
            <div>
              <span className="font-heading font-semibold text-[#07326F] block">
                Credenciales de prueba rápida:
              </span>
              <span className="text-slate-600 font-mono text-[11px]">
                demo@chambaapp.com · 123456
              </span>
            </div>
            <button
              type="button"
              onClick={handleFillDemoCredentials}
              className="px-2.5 py-1.5 rounded-lg bg-[#07326F] text-white text-[11px] font-heading font-semibold hover:bg-[#032863] cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              Rellenar
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Card className="p-4 bg-white border border-slate-200/90 shadow-xs space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                  Tu nombre completo
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Ana Pérez"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm text-[#07326F] bg-slate-50/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm text-[#07326F] bg-slate-50/50"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-heading font-medium text-slate-500">
                    Contraseña
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-[#07326F] hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm text-[#07326F] bg-slate-50/50"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                  Teléfono de contacto (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="55 1234 5678"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm text-[#07326F] bg-slate-50/50"
                  />
                </div>
              </div>
            )}
          </Card>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            icon={<ArrowRight className="w-4 h-4 text-[#F9D785]" />}
          >
            {isSubmitting ? 'Procesando...' : mode === 'login' ? 'Entrar a mi ChambaApp' : mode === 'register' ? 'Crear mi cuenta gratis' : 'Enviar enlace de recuperación'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-[#F7F9FC] px-2 text-slate-400">O también</span>
          </div>
        </div>

        {/* Google & Demo Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-white border border-slate-200 rounded-xl font-heading font-semibold text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continuar con Google</span>
          </button>

          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-emerald-50 border border-emerald-200 rounded-xl font-heading font-semibold text-xs text-emerald-800 hover:bg-emerald-100 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Explorar como invitado (Sin registro)</span>
          </button>
        </div>
      </div>

      {/* Switch mode */}
      <div className="pt-6 pb-2 text-center text-xs text-slate-500">
        {mode === 'login' ? (
          <p>
            ¿No tienes cuenta todavía?{' '}
            <button
              onClick={() => { setMode('register'); setLocalError(null); }}
              className="font-heading font-semibold text-[#07326F] underline cursor-pointer"
            >
              Regístrate aquí
            </button>
          </p>
        ) : (
          <p>
            ¿Ya tienes una cuenta?{' '}
            <button
              onClick={() => { setMode('login'); setLocalError(null); }}
              className="font-heading font-semibold text-[#07326F] underline cursor-pointer"
            >
              Inicia sesión
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
