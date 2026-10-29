import { ArrowLeft, Sparkles, User, RefreshCw, Share2 } from 'lucide-react';
import { Screen } from '../types';
import { ChambaLogo } from './ChambaLogo';
import { DiscreetAudioPlayer } from './DiscreetAudioPlayer';

interface TopBarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onBack?: () => void;
  onResetDemo?: () => void;
  onOpenShare?: () => void;
  onOpenTutorial?: () => void;
  title?: string;
  showBack?: boolean;
  businessName?: string;
  userName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  onResetDemo,
  onOpenShare,
  onOpenTutorial,
  title,
  showBack = false,
  businessName,
  userName,
}) => {
  // Screen title lookup
  const getScreenTitle = () => {
    if (title) return title;
    switch (currentScreen) {
      case 'home':
        return null; // Will show brand logo
      case 'appointments':
        return 'Mis citas';
      case 'new-appointment':
        return 'Nueva cita';
      case 'calculator':
        return '¿Cuánto cobrar?';
      case 'calculator-result':
        return 'Resultado';
      case 'charge':
        return 'Cobrar';
      case 'receipt':
        return 'Recibo';
      case 'assistant':
        return 'Hazlo por mí';
      case 'clients':
        return 'Clientes';
      case 'business':
        return 'Mi negocio';
      default:
        return 'ChambaApp';
    }
  };

  const screenTitle = getScreenTitle();

  return (
    <header className="sticky top-0 z-30 bg-[#F7F9FC]/95 backdrop-blur-md border-b border-slate-200/80 px-3 py-2 min-h-[56px] flex items-center justify-between gap-2 transition-colors">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showBack && onBack ? (
          <button
            onClick={onBack}
            aria-label="Volver"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#07326F] hover:bg-slate-200/60 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : null}

        {screenTitle ? (
          <h1 className="font-heading font-semibold text-sm sm:text-base text-[#07326F] truncate leading-tight">
            {screenTitle}
          </h1>
        ) : (
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center text-left cursor-pointer shrink-0"
          >
            <ChambaLogo variant="horizontal" size="sm" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Discreet audio tutorial player connecting to /audio/tutorial.mp3 */}
        <DiscreetAudioPlayer
          audioSrc="/audio/tutorial.mp3"
          onOpenFullTutorial={onOpenTutorial}
        />

        {currentScreen !== 'assistant' && (
          <button
            onClick={() => onNavigate('assistant')}
            className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-full text-xs font-heading font-medium bg-[#F9D785]/30 text-[#07326F] border border-[#F9D785]/60 hover:bg-[#F9D785]/50 transition-all cursor-pointer shrink-0"
            title="Asistente Hazlo por mí"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#19AA83]" />
            <span>Asistente</span>
          </button>
        )}

        {onOpenShare && (
          <button
            onClick={onOpenShare}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#19AA83] hover:bg-[#19AA83]/10 hover:border-[#19AA83] transition-all cursor-pointer shadow-xs shrink-0"
            title="Compartir mi perfil y tarjeta digital"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}

        {(() => {
          const displayName = userName || businessName || 'Negocio';
          const initial = displayName.trim().charAt(0).toUpperCase() || 'N';
          return (
            <button
              onClick={() => onNavigate('business')}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#07326F] hover:border-[#07326F] transition-all cursor-pointer shadow-xs shrink-0"
              title={`Perfil de ${displayName}`}
            >
              <span className="font-heading font-bold text-xs">{initial}</span>
            </button>
          );
        })()}
      </div>
    </header>
  );
};
