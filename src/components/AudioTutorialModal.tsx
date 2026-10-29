import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, SkipBack, X, Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { platformConfig } from '../services/configService';

interface AudioTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSection?: (section: string) => void;
}

interface TutorialStep {
  title: string;
  section: string;
  narration: string;
  keyPoints: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    title: '1. Bienvenido a ChambaApp',
    section: 'Inicio',
    narration: '¡Te damos la bienvenida a ChambaApp! La herramienta creada para que gestiones tu trabajo independiente desde el celular. Con ChambaApp organizas tus citas, obtienes tu tarjeta digital con enlace público para compartir, calculas precios justos y generas recibos profesionales sin complicaciones.',
    keyPoints: [
      'Tu negocio en tu bolsillo',
      'Tarjeta digital y enlace público para tus clientes',
      'Acceso rápido a citas, calculadora y cobros',
    ],
  },
  {
    title: '2. Tarjeta Digital y Enlace Público',
    section: 'Tarjeta Digital',
    narration: '¡Al crear tu ChambaApp obtienes automáticamente tu propia Tarjeta Digital de presentación y un enlace público personalizado! Puedes compartirlo fácilmente por WhatsApp, Facebook e Instagram, o mostrar tu código QR interactivo para que tus clientes conozcan tus servicios y agenden contigo directamente.',
    keyPoints: [
      'Tarjeta digital con tu logo, servicios y precios',
      'Enlace público web listo para compartir en redes sociales y WhatsApp',
      'Código QR interactivo listo para mostrar en el celular o imprimir',
    ],
  },
  {
    title: '3. Tu Perfil y Servicios',
    section: 'Mi negocio',
    narration: 'En la sección "Mi negocio" puedes personalizar el nombre de tu empresa, tu número de WhatsApp y los servicios que ofreces. Define tus tarifas base y horarios de atención para que tus citas se programen automáticamente.',
    keyPoints: [
      'Configura tu nombre comercial y datos de contacto',
      'Crea tu catálogo de servicios con precios y duración',
      'Define tus días y horarios de trabajo',
    ],
  },
  {
    title: '4. Agenda y Citas sin traslapes',
    section: 'Mis citas',
    narration: 'En "Mis citas" tienes tu calendario al día. Al registrar una nueva cita, ChambaApp verifica que no tengas otra cita al mismo tiempo para evitar traslapes. Puedes confirmar, reprogramar o marcar citas como realizadas con un solo toque.',
    keyPoints: [
      'Filtros por Hoy, Mañana y Esta semana',
      'Validación automática contra horarios ocupados',
      'Historial completo por cliente',
    ],
  },
  {
    title: '5. ¿Cuánto cobrar? (Ganancia real)',
    section: 'Calculadora',
    narration: 'Nuestra calculadora te ayuda a no regalar tu trabajo. Suma tus gastos de materiales, gasolina o pasajes, más las horas de tu trabajo con el salario que deseas por hora. Obtendrás un precio recomendado que cubre todos tus costos y te garantiza ganancia.',
    keyPoints: [
      'Desglose transparente de gastos y tiempo',
      'Precio recomendado sin fórmulas complicadas',
      'Guarda tus presupuestos para usarlos al cobrar',
    ],
  },
  {
    title: '6. Cobros y Recibos Profesionales',
    section: 'Cobrar y Recibos',
    narration: 'Crea cobros claros para tus clientes. Genera enlaces de cobro y entrega recibos digitales numerados listos para compartir por WhatsApp o descargar en PDF. Cuando recibes el pago, el recibo se actualiza a pagado inmediatamente.',
    keyPoints: [
      'Recibos oficiales con numeración única',
      'Listo para compartir con tu cliente',
      'Preparado para cobros digitales con Mercado Pago',
    ],
  },
  {
    title: '7. Planes y Soporte',
    section: 'Soporte',
    narration: `Tu cuenta comienza completamente GRATIS con capacidad para hasta 5 clientes. Cuando alcances este límite de 5 clientes, podrás activar el Plan PRO por solo $200 pesos al mes para clientes ilimitados, o PRO más Pagos por $300 pesos al mes para cobrar con tarjeta vía Mercado Pago. Si tienes cualquier duda, contáctanos en ${platformConfig.supportEmail}.`,
    keyPoints: [
      'Plan GRATIS: hasta 5 clientes',
      'Límite de 5 clientes: luego pasa a PRO ($200 MXN/mes)',
      'PRO + PAGOS: $300 MXN/mes con cobros digitales',
      `Contacto directo: ${platformConfig.supportEmail}`,
    ],
  },
];

export const AudioTutorialModal: React.FC<AudioTutorialModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSection,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  const step = tutorialSteps[currentStepIndex];

  // Stop speech when closing
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechSupported(false);
    }
  }, []);

  const speakText = (text: string) => {
    if (!speechSupported || typeof window === 'undefined') return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 0.95; // comfortable friendly pace

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      speakText(step.narration);
    }
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    if (currentStepIndex < tutorialSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F9D785]/30 text-[#07326F] flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-[#19AA83]" />
              </div>
              <div>
                <span className="text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-wider block">
                  Audio Recorrido Guiado
                </span>
                <h3 className="font-heading font-bold text-sm text-[#07326F]">
                  Paso {currentStepIndex + 1} de {tutorialSteps.length}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#19AA83] h-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / tutorialSteps.length) * 100}%` }}
            />
          </div>

          {/* Current Step Content */}
          <div className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-lg text-[#07326F]">
                {step.title}
              </h4>
              <span className="text-[11px] font-heading font-medium px-2.5 py-0.5 rounded-full bg-[#07326F]/10 text-[#07326F]">
                {step.section}
              </span>
            </div>

            {/* Audio Wave Visualizer & Player Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-semibold text-[#07326F] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#19AA83]" />
                  <span>Voz explicativa en español</span>
                </span>

                {/* Animated wave bars when playing */}
                <div className="flex items-center gap-1 h-4">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <span
                      key={bar}
                      className={`w-1 rounded-full bg-[#19AA83] transition-all duration-150 ${
                        isPlaying
                          ? 'animate-pulse h-4'
                          : 'h-1.5 opacity-40'
                      }`}
                      style={{ animationDelay: `${bar * 100}ms` }}
                    />
                  ))}
                </div>
              </div>

              {/* Narration script transcript */}
              <p className="text-xs text-slate-600 leading-relaxed italic bg-white p-3 rounded-xl border border-slate-100">
                "{step.narration}"
              </p>

              {/* Play/Pause Button */}
              <div className="flex items-center justify-center pt-1">
                <button
                  onClick={togglePlay}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-heading font-semibold text-xs shadow-sm transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-[#07326F] text-white hover:bg-[#032863]'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pausar narración</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-[#F9D785]" />
                      <span>Escuchar explicación</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Key Bullet Points */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-heading font-semibold text-slate-400 uppercase tracking-wider block">
                Puntos destacados:
              </span>
              {step.keyPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#19AA83] shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            fullWidth={false}
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            icon={<SkipBack className="w-3.5 h-3.5" />}
          >
            Anterior
          </Button>

          <Button
            variant="primary"
            size="sm"
            fullWidth={false}
            onClick={handleNext}
            icon={<SkipForward className="w-3.5 h-3.5" />}
          >
            {currentStepIndex === tutorialSteps.length - 1 ? 'Finalizar' : 'Siguiente'}
          </Button>
        </div>
      </div>
    </div>
  );
};
