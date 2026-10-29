import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface DiscreetAudioPlayerProps {
  audioSrc?: string;
  onOpenFullTutorial?: () => void;
  className?: string;
}

export const DiscreetAudioPlayer: React.FC<DiscreetAudioPlayerProps> = ({
  audioSrc = '/audio/tutorial.mp3',
  onOpenFullTutorial,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [useSpeechFallback, setUseSpeechFallback] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fallback speech synthesizer if file has an issue or on platforms with strict codec requirements
  const speakFallback = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = 'Bienvenido a ChambaApp. Tu negocio en tu bolsillo. Aquí podrás agendar tus citas, calcular cuánto cobrar con margen sobre ventas, compartir tu tarjeta digital y emitir recibos profesionales.';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-MX';
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const togglePlayback = () => {
    if (useSpeechFallback) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        speakFallback();
      }
      return;
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio playback error, falling back to voice synthesizer:', err);
        setUseSpeechFallback(true);
        speakFallback();
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setUseSpeechFallback(true)}
      />

      {/* Discreet Player Button */}
      <button
        type="button"
        onClick={togglePlayback}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-heading font-medium transition-all cursor-pointer shadow-2xs border ${
          isPlaying
            ? 'bg-amber-100/90 text-amber-900 border-amber-300 ring-2 ring-amber-400/30'
            : 'bg-white hover:bg-slate-50 text-[#07326F] border-slate-200'
        }`}
        title={isPlaying ? 'Pausar audio tutorial' : 'Escuchar audio tutorial (/audio/tutorial.mp3)'}
        aria-label="Reproductor discreto de audio tutorial"
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5 text-amber-700 fill-current" />
            <span className="hidden sm:inline">Pausar tutorial</span>
            {/* Animated Soundwave Dots */}
            <span className="flex items-center gap-0.5 ml-0.5">
              <span className="w-1 h-3 rounded-full bg-[#19AA83] animate-pulse" />
              <span className="w-1 h-2 rounded-full bg-[#07326F] animate-pulse delay-100" />
              <span className="w-1 h-3.5 rounded-full bg-[#19AA83] animate-pulse delay-200" />
            </span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-[#19AA83]" />
            <span className="hidden sm:inline">Audio tutorial</span>
          </>
        )}
      </button>

      {/* Optional helper to open full guided step-by-step modal */}
      {onOpenFullTutorial && (
        <button
          type="button"
          onClick={onOpenFullTutorial}
          className="text-[10px] text-slate-400 hover:text-[#07326F] hover:underline cursor-pointer hidden md:inline"
          title="Ver texto completo del tutorial"
        >
          (Ver guía)
        </button>
      )}
    </div>
  );
};
