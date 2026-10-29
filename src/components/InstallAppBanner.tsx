import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare } from 'lucide-react';
import { ChambaLogo } from './ChambaLogo';

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState<boolean>(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA or TWA)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt (Android / Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (isStandalone || dismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setDismissed(true);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        if (isIOS) {
          setShowIOSInstructions(true);
        } else {
          setShowAndroidInstructions(true);
        }
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      // Android / Chrome fallback
      setShowAndroidInstructions(true);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-[#032863] to-[#07326F] text-white p-3 mx-4 mb-3 rounded-2xl shadow-md border border-[#F9D785]/30 flex items-center justify-between gap-3 animate-in fade-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <ChambaLogo variant="icon" size="sm" inverted={true} />
          </div>
          <div className="min-w-0">
            <h4 className="font-heading font-bold text-xs text-white leading-tight">
              Instala ChambaApp en tu celular
            </h4>
            <p className="text-[11px] text-white/80 truncate">
              Ábrela directo desde tu pantalla de inicio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-[#19AA83] hover:bg-[#159371] text-white font-heading font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-bold text-sm text-[#07326F]">
                Instalar en iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#07326F] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#07326F] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Desplázate hacia abajo y selecciona <strong>"Añadir a pantalla de inicio"</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#07326F] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Toca <strong>Añadir</strong> en la esquina superior derecha ¡y listo!
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2 bg-[#07326F] text-white rounded-xl font-heading font-semibold text-xs mt-2"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Android / Chrome Instructions Modal */}
      {showAndroidInstructions && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-bold text-sm text-[#07326F]">
                Instalar ChambaApp en Android
              </h3>
              <button
                onClick={() => setShowAndroidInstructions(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#19AA83] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Toca los <strong>tres puntos (⋮)</strong> en la esquina superior derecha del navegador Chrome.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#19AA83] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Selecciona la opción <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla de inicio"</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#19AA83] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Confirma tocando <strong>"Instalar"</strong> ¡y listo! Quedará en tu menú de aplicaciones con su icono.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowAndroidInstructions(false)}
              className="w-full py-2.5 bg-[#19AA83] hover:bg-[#14896a] text-white rounded-xl font-heading font-semibold text-xs mt-2"
            >
              ¡Entendido, voy a instalarla!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
