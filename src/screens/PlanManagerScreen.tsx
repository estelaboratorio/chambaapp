import React, { useState } from 'react';
import { Check, Sparkles, Shield, CreditCard, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { platformConfig } from '../services/configService';
import { saveSubscription } from '../services/firebaseService';
import { PlanType, Subscription } from '../types';

interface PlanManagerScreenProps {
  onBack: () => void;
  clientCount: number;
}

export const PlanManagerScreen: React.FC<PlanManagerScreenProps> = ({
  onBack,
  clientCount,
}) => {
  const { currentBusiness, subscription, refreshBusinessData, currentUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  const currentPlan: PlanType = subscription?.plan || 'free';

  const handleChangePlan = async (newPlan: PlanType) => {
    if (!currentBusiness || !currentUser) return;
    setIsUpdating(true);
    setSuccessMsg(null);
    try {
      const now = new Date().toISOString();
      const updatedSub: Subscription = {
        id: subscription?.id || `sub_${currentBusiness.id}`,
        userId: currentUser.uid,
        businessId: currentBusiness.id,
        plan: newPlan,
        status: 'active',
        currency: 'MXN',
        amount: newPlan === 'pro_payments' ? platformConfig.proPaymentsMonthlyPriceMXN : newPlan === 'pro' ? platformConfig.proMonthlyPriceMXN : 0,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: subscription?.createdAt || now,
        updatedAt: now,
      };
      await saveSubscription(currentBusiness.id, updatedSub);
      await refreshBusinessData();
      setSuccessMsg(`¡Tu plan se actualizó a ${newPlan === 'pro_payments' ? 'PRO + PAGOS' : newPlan === 'pro' ? 'PRO' : 'GRATIS'}!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentBusiness) return;
    setIsUpdating(true);
    try {
      await handleChangePlan('free');
      setShowCancelModal(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-xs font-heading font-medium text-slate-500 hover:text-[#07326F] cursor-pointer"
        >
          ← Volver a Mi negocio
        </button>
      </div>

      <div>
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#07326F]">
          Mi plan
        </h1>
        <p className="text-xs text-slate-500">
          Empieza gratis. Crece cuando lo necesites.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Plan Actual Box */}
      <Card className="p-4 bg-white border border-slate-200/90 shadow-xs space-y-2.5">
        <span className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider block">
          Plan actual
        </span>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#19AA83] animate-pulse" />
            <h2 className="font-heading font-bold text-lg text-[#07326F]">
              {currentPlan === 'free' ? 'GRATIS (Hasta 5 clientes)' : currentPlan === 'pro_payments' ? 'PRO + PAGOS' : 'PRO'}
            </h2>
          </div>
          {currentPlan === 'free' && (
            <span className="text-xs font-heading font-bold text-[#07326F] bg-slate-100 px-3 py-1 rounded-full">
              {clientCount} / {platformConfig.freePlanMaxClients} clientes
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {currentPlan === 'free'
            ? 'Tu cuenta gratuita incluye agenda, calculadora y recibos para hasta 5 clientes.'
            : 'Tienes acceso completo e ilimitado para hacer crecer tu negocio.'}
        </p>

        {currentPlan === 'free' && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Capacidad de clientes en plan gratis:</span>
              <span className="font-heading font-bold text-[#07326F]">{clientCount} de 5</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${clientCount >= 5 ? 'bg-amber-500' : 'bg-[#19AA83]'}`}
                style={{ width: `${Math.min(100, (clientCount / 5) * 100)}%` }}
              />
            </div>
            {clientCount >= 5 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Has alcanzado el límite de 5 clientes gratuitos.</strong> Activa el plan PRO mensual ($200 MXN/mes) para registrar clientes ilimitados y continuar creciendo tu negocio.
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Plans Comparison */}
      <div className="space-y-3.5 pt-2">
        {/* PLAN PRO */}
        <Card className={`p-5 transition-all ${currentPlan === 'pro' ? 'border-2 border-[#19AA83] bg-[#19AA83]/5' : 'bg-white border border-slate-200/90'}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-[#07326F]">
                  PRO
                </h3>
                <span className="text-[10px] font-heading font-semibold px-2 py-0.5 rounded-full bg-[#07326F] text-white">
                  Recomendado
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-heading font-bold text-2xl text-[#07326F]">${platformConfig.proMonthlyPriceMXN}</span>
                <span className="text-xs text-slate-500">MXN / mes</span>
              </div>
            </div>
            {currentPlan === 'pro' && (
              <span className="text-xs font-heading font-semibold text-[#19AA83] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Plan activo
              </span>
            )}
          </div>

          <div className="space-y-2 py-3.5 text-xs text-slate-700 border-t border-slate-100 mt-3">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#19AA83]" />
              <strong className="text-[#07326F]">Clientes ilimitados</strong>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#19AA83]" />
              <span>Agenda y recordatorios automáticos</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#19AA83]" />
              <span>Recibos profesionales personalizados</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#19AA83]" />
              <span>Historial completo de clientes y servicios</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#19AA83]" />
              <span>Estadísticas de ingresos y servicios</span>
            </div>
          </div>

          {currentPlan !== 'pro' ? (
            <Button
              variant="primary"
              size="md"
              disabled={isUpdating}
              onClick={() => handleChangePlan('pro')}
              icon={<Sparkles className="w-4 h-4 text-[#F9D785]" />}
            >
              Cambiar a PRO
            </Button>
          ) : (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full text-center text-xs text-slate-400 hover:text-rose-600 py-1 cursor-pointer font-medium"
            >
              Cancelar plan PRO
            </button>
          )}
        </Card>

        {/* PLAN PRO + PAGOS */}
        <Card className={`p-5 transition-all ${currentPlan === 'pro_payments' ? 'border-2 border-[#19AA83] bg-[#19AA83]/5' : 'bg-white border border-slate-200/90'}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-[#07326F]">
                  PRO + PAGOS
                </h3>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-heading font-bold text-2xl text-[#07326F]">${platformConfig.proPaymentsMonthlyPriceMXN}</span>
                <span className="text-xs text-slate-500">MXN / mes</span>
              </div>
            </div>
            {currentPlan === 'pro_payments' && (
              <span className="text-xs font-heading font-semibold text-[#19AA83] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Plan activo
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mt-1">
            + Comisión por pagos procesados ({platformConfig.platformFeePercentage}% ChambaApp + comisión Mercado Pago)
          </p>

          <div className="space-y-2 py-3.5 text-xs text-slate-700 border-t border-slate-100 mt-3">
            <div className="flex items-center gap-2 font-medium text-[#07326F]">
              <Check className="w-3.5 h-3.5 text-[#19AA83]" />
              <span>Incluye todo lo de PRO</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#19AA83]" />
              <span>Cobros digitales directos por tarjeta y transferencia</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#19AA83]" />
              <span>Generación de links de pago automáticos</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#19AA83]" />
              <span>Conexión oficial OAuth con Mercado Pago</span>
            </div>
          </div>

          {currentPlan !== 'pro_payments' ? (
            <Button
              variant="positive"
              size="md"
              disabled={isUpdating}
              onClick={() => handleChangePlan('pro_payments')}
              icon={<CreditCard className="w-4 h-4 text-white" />}
            >
              Activar PRO + PAGOS
            </Button>
          ) : (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full text-center text-xs text-slate-400 hover:text-rose-600 py-1 cursor-pointer font-medium"
            >
              Cancelar plan
            </button>
          )}
        </Card>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 space-y-3">
            <h3 className="font-heading font-bold text-base text-[#07326F]">
              ¿Quieres cancelar tu plan?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tu plan continuará activo hasta el final del período que ya pagaste. Tus datos y clientes se mantendrán intactos.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCancelModal(false)}
              >
                Mantener mi plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelSubscription}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
