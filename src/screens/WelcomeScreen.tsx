import React, { useState, useEffect } from 'react';
import { ChambaLogo } from '../components/ChambaLogo';
import { Button } from '../components/ui/Button';
import { DiscreetAudioPlayer } from '../components/DiscreetAudioPlayer';
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  Download, 
  UserPlus, 
  LogIn, 
  Share2,
  Calendar,
  DollarSign,
  Receipt
} from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
  onRegister?: () => void;
  onLogin: () => void;
  onExploreDemo?: () => void;
  onOpenTutorial: () => void;
  onOpenLegal?: (type: 'privacy' | 'terms') => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  onRegister,
  onLogin,
  onExploreDemo,
  onOpenTutorial,
  onOpenLegal,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Para instalar ChambaApp en tu dispositivo, abre las opciones de tu navegador y selecciona "Agregar a la pantalla principal" o "Instalar app".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalledSuccess(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-between p-5 sm:p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Subtle decorative background touches */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#F9D785]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-52 h-52 bg-[#19AA83]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar with audio tutorial */}
      <div className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-heading font-bold text-[#07326F] bg-[#07326F]/10 px-2 py-0.5 rounded-md">
            Beta v1.0
          </span>
        </div>

        {/* Discreet audio tutorial player connecting to /audio/tutorial.mp3 */}
        <DiscreetAudioPlayer
          audioSrc="/audio/tutorial.mp3"
          onOpenFullTutorial={onOpenTutorial}
        />
      </div>

      {/* Center Branding Area */}
      <div className="flex flex-col items-center text-center my-auto px-2">
        {/* Full ChambaApp Logo with /logo.png fallback */}
        <div className="p-4 bg-white rounded-3xl shadow-[0_8px_30px_rgba(7,50,111,0.07)] border border-slate-100 mb-5 transition-transform hover:scale-105 duration-300">
          <div className="relative">
            <img
              src="/logo.png"
              alt="Logo ChambaApp"
              className="w-20 h-20 object-contain mx-auto mb-1"
              onError={(e) => {
                // If logo.png fails, show SVG ChambaLogo
                e.currentTarget.style.display = 'none';
              }}
            />
            <ChambaLogo variant="full" size="lg" />
          </div>
        </div>

        {/* Value Proposition */}
        <h1 className="text-2xl font-heading font-bold text-[#07326F] leading-tight mb-2 tracking-tight">
          Tu negocio en tu bolsillo
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-xs leading-relaxed mb-4">
          Organiza tus citas, calcula cuánto cobrar con margen real y recibe tus pagos desde tu celular.
        </p>

        {/* Feature quick points with brand green check */}
        <div className="flex flex-col gap-2 text-left w-full max-w-xs bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/70 mb-2 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-[#07326F] font-medium">
            <span className="w-5 h-5 rounded-full bg-[#19AA83]/15 text-[#19AA83] flex items-center justify-center shrink-0 font-bold">
              ✓
            </span>
            <span>Tarjeta digital y enlace público para compartir</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#07326F] font-medium">
            <span className="w-5 h-5 rounded-full bg-[#19AA83]/15 text-[#19AA83] flex items-center justify-center shrink-0 font-bold">
              ✓
            </span>
            <span>Agenda de citas (Agendado, En Ejecución, Completado)</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#07326F] font-medium">
            <span className="w-5 h-5 rounded-full bg-[#19AA83]/15 text-[#19AA83] flex items-center justify-center shrink-0 font-bold">
              ✓
            </span>
            <span>Cotizador con fórmula exacta de margen sobre ventas</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#07326F] font-medium">
            <span className="w-5 h-5 rounded-full bg-[#19AA83]/15 text-[#19AA83] flex items-center justify-center shrink-0 font-bold">
              ✓
            </span>
            <span>Comprobante de control interno imprimible/descargable</span>
          </div>
        </div>

        {/* Optional Install App Button on Welcome Screen */}
        <button
          type="button"
          onClick={handleInstallClick}
          className="mt-1 mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-heading font-semibold text-[#07326F] hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#19AA83]" />
          <span>{installedSuccess ? '✓ App instalada' : 'Instalar aplicación en tu celular'}</span>
        </button>
      </div>

      {/* Bottom Actions: REQUIRED CREATE ACCOUNT BUTTON */}
      <div className="flex flex-col gap-2 pb-5 pt-1">
        {/* Botón obligatorio Crear Cuenta */}
        <Button
          variant="positive"
          size="lg"
          onClick={onRegister || onStart}
          icon={<UserPlus className="w-5 h-5 text-white" />}
        >
          Crear cuenta
        </Button>

        {/* Botón Ya tengo una cuenta */}
        <Button
          variant="secondary"
          size="md"
          onClick={onLogin}
          icon={<LogIn className="w-4 h-4 text-[#07326F]" />}
        >
          Ya tengo una cuenta
        </Button>

        {onExploreDemo && (
          <button
            type="button"
            onClick={onExploreDemo}
            className="text-center text-xs text-slate-500 hover:text-[#07326F] py-1 cursor-pointer font-medium hover:underline"
          >
            Explorar modo de prueba rápida
          </button>
        )}

        {onOpenLegal && (
          <div className="pt-1 flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <button
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-[#07326F] hover:underline cursor-pointer"
            >
              Privacidad
            </button>
            <span>·</span>
            <button
              onClick={() => onOpenLegal('terms')}
              className="hover:text-[#07326F] hover:underline cursor-pointer"
            >
              Términos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
