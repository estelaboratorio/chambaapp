import React, { useState } from 'react';
import { Calculator, ArrowRight, DollarSign, Clock, HelpCircle, Sparkles, TrendingUp, Percent, Info, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PricingCalculation, Service, Screen } from '../types';
import { saveCalculation } from '../services/firebaseService';
import { calculateFinancialQuote } from '../services/quoteService';

interface CalculatorScreenProps {
  businessId?: string;
  services: Service[];
  onCalculate: (calc: PricingCalculation) => void;
  onNavigate: (screen: Screen) => void;
}

export const CalculatorScreen: React.FC<CalculatorScreenProps> = ({
  businessId,
  services,
  onCalculate,
  onNavigate,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [customServiceName, setCustomServiceName] = useState<string>('Servicio profesional');
  
  // Costos directos
  const [materialsCost, setMaterialsCost] = useState<number>(200);
  const [transportCost, setTransportCost] = useState<number>(100);
  const [otherCost, setOtherCost] = useState<number>(0);
  
  // Mano de obra
  const [hoursWorked, setHoursWorked] = useState<number>(4);
  const [ratePerHour, setRatePerHour] = useState<number>(150);

  // Margen sobre ventas (0 <= margen < 1)
  // 30% por defecto (0.30)
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(30);

  // Descuentos e Impuestos
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(false);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(16); // 16% IVA México

  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Cálculos en tiempo real usando la fórmula financiera de margen sobre ventas:
  // precio_base = costo_total / (1 - margen_objetivo)
  const directMaterialsTotal = (materialsCost || 0) + (transportCost || 0) + (otherCost || 0);
  const laborTotal = (hoursWorked || 0) * (ratePerHour || 0);
  const targetMarginDecimal = Math.min(0.95, Math.max(0, targetMarginPercent / 100));
  const effectiveTaxRate = applyTax ? Math.max(0, taxRatePercent / 100) : 0;

  const financialResult = calculateFinancialQuote({
    materialsCost: directMaterialsTotal,
    laborCost: laborTotal,
    targetMargin: targetMarginDecimal,
    discountAmount,
    taxRate: effectiveTaxRate,
  });

  // Comparativa con recargo simple (markup) para mostrar la ventaja financiera
  const simpleMarkupPrice = Math.round(financialResult.totalCost * (1 + targetMarginDecimal));
  const markupDifference = Math.max(0, financialResult.basePrice - simpleMarkupPrice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const selectedSrv = services.find(s => s.id === selectedServiceId);
    const serviceName = selectedSrv ? selectedSrv.name : customServiceName;

    const calcData: PricingCalculation = {
      id: `calc_${Date.now()}`,
      businessId: businessId || 'biz_default',
      serviceId: selectedServiceId,
      serviceName,
      materials: materialsCost,
      transport: transportCost,
      otherExpenses: otherCost,
      hoursWorked,
      desiredHourlyProfit: ratePerHour,
      totalExpenses: directMaterialsTotal,
      recommendedPrice: financialResult.finalTotal,

      // Desglose financiero exacto por margen sobre ventas
      materialsCost: directMaterialsTotal,
      laborCost: laborTotal,
      totalCost: financialResult.totalCost,
      targetMargin: targetMarginDecimal,
      basePrice: financialResult.basePrice,
      subtotal: financialResult.subtotal,
      discountAmount: financialResult.discountAmount,
      taxRate: effectiveTaxRate,
      taxAmount: financialResult.taxAmount,
      finalTotal: financialResult.finalTotal,
      createdAt: new Date().toISOString(),
    };

    if (businessId) {
      try {
        await saveCalculation(businessId, calcData);
      } catch (err) {
        console.warn('Could not save calculation in db:', err);
      }
    }

    setIsSaving(false);
    onCalculate(calcData);
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-[#19AA83]/15 text-[#19AA83] text-[11px] font-heading font-semibold inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Margen financiero sobre ventas
          </span>
        </div>
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#07326F]">
          Cotizador financiero
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
          Calcula tu precio base usando la fórmula financiera de margen sobre ventas: <code className="bg-slate-100 text-[#07326F] px-1.5 py-0.5 rounded text-[11px] font-mono">Precio = Costo / (1 - Margen)</code>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Servicio */}
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs">
          <label className="block text-xs font-heading font-medium text-slate-500 mb-1.5">
            Servicio a presupuestar
          </label>
          {services.length > 0 ? (
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-semibold text-[#07326F] bg-slate-50/50"
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} - Base ${s.basePrice}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              required
              value={customServiceName}
              onChange={(e) => setCustomServiceName(e.target.value)}
              placeholder="Ej. Pintura de interiores, Limpieza, Instalación..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-semibold text-[#07326F] bg-slate-50/50"
            />
          )}
        </Card>

        {/* Bloque 1: Costo de Materiales y Gastos Directos */}
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-heading font-semibold text-xs text-[#07326F]">
              1. Costo de materiales e insumos
            </span>
            <span className="text-[11px] text-slate-400">Gastos directos</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Materiales, insumos y consumibles
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                value={materialsCost}
                onChange={(e) => setMaterialsCost(Math.max(0, Number(e.target.value)))}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-medium text-[#07326F] bg-slate-50/50"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Transporte / Pasaje / Gasolina
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  value={transportCost}
                  onChange={(e) => setTransportCost(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-medium text-[#07326F] bg-slate-50/50"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Otros gastos directos
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  value={otherCost}
                  onChange={(e) => setOtherCost(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-medium text-[#07326F] bg-slate-50/50"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between font-heading font-semibold text-xs text-[#07326F] bg-[#F7F9FC] p-2.5 rounded-xl border border-slate-200/60">
            <span>Subtotal costo de materiales:</span>
            <span className="text-sm font-bold text-[#07326F] tabular-nums">
              ${directMaterialsTotal} MXN
            </span>
          </div>
        </Card>

        {/* Bloque 2: Mano de Obra */}
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-heading font-semibold text-xs text-[#07326F]">
              2. Mano de obra
            </span>
            <span className="text-[11px] text-[#19AA83] font-medium">Tiempo y esfuerzo</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Horas estimadas
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(Math.max(0.5, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-medium text-[#07326F] bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Costo por hora
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="10"
                  value={ratePerHour}
                  onChange={(e) => setRatePerHour(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-bold text-[#07326F] font-heading bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between font-heading font-semibold text-xs text-[#19AA83] bg-[#19AA83]/10 p-2.5 rounded-xl border border-[#19AA83]/20">
            <span>Subtotal mano de obra ({hoursWorked} hrs × ${ratePerHour}):</span>
            <span className="text-sm font-bold tabular-nums">
              ${laborTotal} MXN
            </span>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-slate-600 font-medium px-1">
            <span>Costo Total Directo (Materiales + Mano de obra):</span>
            <span className="font-bold text-[#07326F] tabular-nums">${financialResult.totalCost} MXN</span>
          </div>
        </Card>

        {/* Bloque 3: Margen Objetivo sobre Ventas */}
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-[#07326F]" />
              <span className="font-heading font-semibold text-xs text-[#07326F]">
                3. Margen objetivo sobre ventas
              </span>
            </div>
            <span className="text-xs font-bold text-[#07326F] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 tabular-nums">
              {targetMarginPercent}% margen
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
              Selecciona tu margen deseado sobre el total de la venta:
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[15, 20, 30, 40, 50].map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setTargetMarginPercent(m)}
                  className={`py-1.5 text-xs font-heading font-semibold rounded-lg border transition-all cursor-pointer ${
                    targetMarginPercent === m
                      ? 'bg-[#07326F] text-white border-[#07326F] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m}%
                </button>
              ))}
            </div>
          </div>

          {/* Slider input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>0% (Costo puro)</span>
              <span>Personalizado: {targetMarginPercent}%</span>
              <span>80% (Alto margen)</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="1"
              value={targetMarginPercent}
              onChange={(e) => setTargetMarginPercent(Number(e.target.value))}
              className="w-full accent-[#07326F] cursor-pointer"
            />
          </div>

          {/* Educational notice: Formula explanation distinguishing from simple markup */}
          <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex items-start gap-1.5 text-[#07326F]">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#07326F]" />
              <div className="space-y-1">
                <p className="font-heading font-semibold text-[11px]">
                  Fórmula financiera aplicada:
                </p>
                <p className="font-mono text-[11px] bg-white/80 p-1.5 rounded border border-blue-200 text-[#07326F]">
                  precio_base = costo_total / (1 - margen_objetivo)
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Con costo de <strong>${financialResult.totalCost}</strong> y margen del <strong>{targetMarginPercent}%</strong>, el precio base es <strong>${financialResult.basePrice}</strong>. 
                  Tu utilidad neta es de <strong>${financialResult.profitAmount}</strong> (exactamente el {targetMarginPercent}% de tu venta).
                </p>
                {markupDifference > 0 && (
                  <p className="text-[10px] text-emerald-800 font-medium">
                    ✓ Protege tu ganancia: un simple recargo (markup) te hubiera cobrado solo ${simpleMarkupPrice} (${markupDifference} menos).
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Bloque 4: Descuentos e Impuestos */}
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-heading font-semibold text-xs text-[#07326F]">
              4. Descuentos e impuestos
            </span>
            <span className="text-[11px] text-slate-400">Opcional</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Descuento aplicable (en pesos MXN)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                max={financialResult.subtotal}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-medium text-[#07326F] bg-slate-50/50"
                placeholder="0"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="w-4 h-4 rounded text-[#07326F] focus:ring-[#07326F]"
                />
                <span className="text-xs font-heading font-semibold text-[#07326F]">
                  Agregar Impuestos aplicables (IVA)
                </span>
              </label>
              {applyTax && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={taxRatePercent}
                    onChange={(e) => setTaxRatePercent(Math.max(0, Number(e.target.value)))}
                    className="w-14 px-2 py-1 text-xs border rounded-lg text-center font-bold text-[#07326F]"
                  />
                  <span className="text-xs text-slate-500 font-medium">%</span>
                </div>
              )}
            </div>

            {applyTax && (
              <p className="text-[11px] text-slate-500 pl-6">
                Se calculará {taxRatePercent}% de IVA sobre el subtotal tras descuentos: +${financialResult.taxAmount} MXN.
              </p>
            )}
          </div>
        </Card>

        {/* Resumen del Desglose Completo */}
        <Card className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/90 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#07326F]">
              Desglose financiero de cotización
            </span>
            <span className="text-[11px] font-semibold text-[#19AA83]">
              Listo para presentar
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Costo de materiales:</span>
              <span className="font-semibold text-slate-700 tabular-nums">${financialResult.materialsCost} MXN</span>
            </div>
            <div className="flex justify-between">
              <span>Mano de obra ({hoursWorked} hrs):</span>
              <span className="font-semibold text-slate-700 tabular-nums">${financialResult.laborCost} MXN</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Costo total base:</span>
              <span className="font-medium tabular-nums">${financialResult.totalCost} MXN</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Margen objetivo sobre venta ({targetMarginPercent}%):</span>
              <span className="font-bold tabular-nums">+${financialResult.profitAmount} MXN</span>
            </div>
            <div className="pt-1 border-t border-slate-200 flex justify-between font-heading font-bold text-[#07326F]">
              <span>Subtotal (Precio base):</span>
              <span className="tabular-nums">${financialResult.subtotal} MXN</span>
            </div>
            {financialResult.discountAmount > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>Descuento aplicado:</span>
                <span className="tabular-nums">-${financialResult.discountAmount} MXN</span>
              </div>
            )}
            {applyTax && (
              <div className="flex justify-between text-slate-600">
                <span>Impuestos aplicables (IVA {taxRatePercent}%):</span>
                <span className="font-semibold text-slate-700 tabular-nums">+${financialResult.taxAmount} MXN</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-300 flex items-center justify-between font-heading font-bold text-base text-[#07326F]">
              <span>Total final cotizado:</span>
              <span className="text-lg text-[#19AA83] tabular-nums">${financialResult.finalTotal} MXN</span>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="positive"
            size="lg"
            disabled={isSaving}
            icon={<ArrowRight className="w-5 h-5 text-white" />}
          >
            {isSaving ? 'Guardando cotización...' : 'Ver resultado y desglose formal'}
          </Button>
        </div>
      </form>
    </div>
  );
};
