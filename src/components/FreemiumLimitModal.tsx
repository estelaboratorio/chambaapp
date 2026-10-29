import React, { useState } from 'react';
import { Sparkles, X, Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from './ui/Button';

interface FreemiumLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivatePlan: () => Promise<void> | void;
  serviceCount?: number;
}

export const FreemiumLimitModal: React.FC<FreemiumLimitModalProps> = ({
  isOpen,
  onClose,
  onActivatePlan,
  serviceCount = 5,
}) => {
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      await onActivatePlan();
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden text-center space-y-4">
        {/* Subtle decorative top badge */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#07326F] text-[#F9D785] flex items-center justify-center shadow-md">
          <Zap className="w-8 h-8 fill-current" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div>
          <span className="text-[11px] font-heading font-bold text-[#19AA83] bg-[#19AA83]/10 px-3 py-1 rounded-full uppercase tracking-wider">
            Plan Gratuito ({serviceCount}/5 servicios)
          </span>
          <h2 className="font-heading font-bold text-xl text-[#07326F] mt-2.5 leading-snug">
            Has alcanzado tus 5 servicios gratuitos de prueba
          </h2>
        </div>

        {/* Clean user-facing text specified in prompt */}
        <p className="text-sm text-slate-600 leading-relaxed px-1">
          Activa tu plan mensual por <strong>$250 MXN</strong> para continuar agendando y disfrutando de servicios ilimitados sin restricciones.
        </p>

        {/* Feature Highlights */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Check className="w-4 h-4 text-[#19AA83] shrink-0" />
            <span>Servicios, citas y cotizaciones ilimitadas</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Check className="w-4 h-4 text-[#19AA83] shrink-0" />
            <span>Tarjeta digital y enlace web público</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Check className="w-4 h-4 text-[#19AA83] shrink-0" />
            <span>Control de abonos, saldos y recibos oficiales</span>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-heading font-semibold flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>¡Plan de $250 MXN activado con éxito!</span>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <Button
              variant="positive"
              size="lg"
              disabled={isActivating}
              onClick={handleActivate}
              icon={<Sparkles className="w-4 h-4 text-white" />}
            >
              {isActivating ? 'Activando suscripción...' : 'Activar plan mensual por $250 MXN'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Tal vez más tarde
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
