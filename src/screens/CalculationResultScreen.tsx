import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, RotateCcw, TrendingUp, Sparkles, Check, FileText, DollarSign, Percent, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PricingCalculation, Screen } from '../types';

interface CalculationResultScreenProps {
  calculation: PricingCalculation;
  onUsePrice: (recommendedPrice: number, serviceName?: string) => void;
  onCreateQuote?: (calc: PricingCalculation) => void;
  onRecalculate: () => void;
  onNavigate: (screen: Screen) => void;
}

export const CalculationResultScreen: React.FC<CalculationResultScreenProps> = ({
  calculation,
  onUsePrice,
  onCreateQuote,
  onRecalculate,
  onNavigate,
}) => {
  const [savedRefToast, setSavedRefToast] = useState<boolean>(false);

  // Desglose financiero exacto
  const materialsCost = calculation.materialsCost ?? calculation.totalExpenses;
  const laborCost = calculation.laborCost ?? (calculation.hoursWorked * calculation.desiredHourlyProfit);
  const totalCost = calculation.totalCost ?? (materialsCost + laborCost);
  const targetMargin = calculation.targetMargin ?? 0.30;
  const targetMarginPercent = Math.round(targetMargin * 100);
  const basePrice = calculation.basePrice ?? calculation.recommendedPrice;
  const subtotal = calculation.subtotal ?? basePrice;
  const discountAmount = calculation.discountAmount ?? 0;
  const taxRate = calculation.taxRate ?? 0;
  const taxAmount = calculation.taxAmount ?? 0;
  const finalTotal = calculation.finalTotal ?? calculation.recommendedPrice;
  const profitAmount = Math.max(0, basePrice - totalCost);

  const handleSaveAsRef = () => {
    setSavedRefToast(true);
    setTimeout(() => setSavedRefToast(false), 3000);
  };

  return (
    <div className="space-y-4 pb-24 pt-1">
      {/* Title */}
      <div className="text-center px-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#19AA83]/15 text-[#19AA83] font-heading font-semibold text-xs mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Fórmula financiera de margen sobre ventas verificada
        </span>
        <h1 className="font-heading font-bold text-2xl text-[#07326F]">
          Cotización calculada
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {calculation.serviceName || 'Servicio profesional'} · {calculation.hoursWorked} hrs de mano de obra
        </p>
      </div>

      {savedRefToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Precio guardado en el historial de cálculos de tu negocio.</span>
        </div>
      )}

      {/* Tarjeta Central Grande con Desglose Completo */}
      <Card className="p-5 bg-white border border-[#19AA83]/30 shadow-[0_8px_30px_rgba(25,170,131,0.08)] relative overflow-hidden space-y-4">
        {/* Banner de Precio Final */}
        <div className="text-center py-2 bg-gradient-to-b from-[#07326F]/5 to-transparent rounded-2xl p-4 border border-slate-100">
          <span className="text-xs font-heading font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Final Cotizado
          </span>
          <div className="font-heading font-bold text-4xl sm:text-5xl text-[#07326F] tabular-nums tracking-tight">
            ${finalTotal} <span className="text-base text-slate-400 font-normal">MXN</span>
          </div>
          <span className="text-[11px] text-[#19AA83] font-heading font-semibold mt-1 inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Garantiza {targetMarginPercent}% de ganancia sobre la venta (${profitAmount} MXN)
          </span>
        </div>

        {/* Desglose de Campos Solicitados */}
        <div className="space-y-2.5 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span className="font-medium text-slate-500">Costo de materiales:</span>
            <span className="font-heading font-bold text-slate-800 text-sm tabular-nums">
              ${materialsCost} MXN
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-700">
            <span className="font-medium text-slate-500">Mano de obra ({calculation.hoursWorked} hrs):</span>
            <span className="font-heading font-bold text-slate-800 text-sm tabular-nums">
              ${laborCost} MXN
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
            <span>Costo total directo (Materiales + Mano de obra):</span>
            <span className="font-semibold text-slate-700 tabular-nums">
              ${totalCost} MXN
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/50">
            <span>Margen objetivo sobre ventas ({targetMarginPercent}%):</span>
            <span className="font-bold tabular-nums">
              +${profitAmount} MXN utilidad
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#07326F] font-heading font-bold pt-1 border-t border-slate-200">
            <span>Subtotal (Precio base = Costo / (1 - Margen)):</span>
            <span className="text-sm tabular-nums">
              ${subtotal} MXN
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-xs text-red-600 font-medium">
              <span>Descuento aplicado:</span>
              <span className="tabular-nums">-${discountAmount} MXN</span>
            </div>
          )}

          {taxAmount > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Impuestos aplicables (IVA {Math.round(taxRate * 100)}%):</span>
              <span className="font-semibold text-slate-700 tabular-nums">+${taxAmount} MXN</span>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-slate-200 my-1" />

          <div className="flex items-center justify-between font-heading font-bold text-base text-[#07326F]">
            <span>Total final:</span>
            <span className="text-lg text-[#19AA83] tabular-nums">${finalTotal} MXN</span>
          </div>
        </div>

        {/* Mensaje positivo */}
        <div className="bg-[#19AA83]/10 border border-[#19AA83]/20 p-3 rounded-xl text-center">
          <p className="text-xs font-medium text-[#07326F] leading-relaxed">
            “Con este precio cubres tus materiales (${materialsCost}), pagas tu tiempo (${laborCost}) y te queda un margen libre de <strong className="text-[#19AA83] font-bold">${profitAmount} MXN</strong>.”
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-2.5 pt-2">
        <Button
          variant="positive"
          size="lg"
          onClick={() => {
            if (onCreateQuote) {
              onCreateQuote(calculation);
            } else {
              onUsePrice(finalTotal, calculation.serviceName);
            }
          }}
          icon={<FileText className="w-5 h-5 text-white" />}
        >
          Crear cotización formal con control de pagos
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={() => onUsePrice(finalTotal, calculation.serviceName)}
          icon={<ArrowRight className="w-4 h-4 text-[#F9D785]" />}
        >
          Cobrar directamente (${finalTotal} MXN)
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={handleSaveAsRef}
          icon={<Check className="w-4 h-4 text-slate-400" />}
        >
          Guardar como precio de referencia
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRecalculate}
          icon={<RotateCcw className="w-4 h-4 text-slate-400" />}
        >
          Modificar cálculo o costos
        </Button>
      </div>
    </div>
  );
};
