import React, { useState, useEffect } from 'react';
import { CreditCard, Share2, Copy, Check, CheckCircle2, ArrowRight, Sparkles, ExternalLink, AlertCircle, Info, MessageCircle, Banknote, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Client, Service, Payment, Receipt, Screen, InternalServiceReceiptData } from '../types';
import { platformConfig } from '../services/configService';
import { savePayment, saveReceipt, getNextReceiptNumber, updatePaymentStatus } from '../services/firebaseService';
import { InternalReceiptModal } from '../components/InternalReceiptModal';

interface ChargeScreenProps {
  businessId: string;
  businessName: string;
  clients: Client[];
  services: Service[];
  initialAmount?: number;
  initialClient?: string;
  initialService?: string;
  onPaymentCompleted: (receipt: Receipt) => void;
  onNavigate: (screen: Screen) => void;
  onRefresh: () => Promise<void>;
  onAddPaymentLocal?: (payment: Payment) => void;
  onAddReceiptLocal?: (receipt: Receipt) => void;
}

export const ChargeScreen: React.FC<ChargeScreenProps> = ({
  businessId,
  businessName,
  clients,
  services,
  initialAmount = 750,
  initialClient,
  initialService,
  onPaymentCompleted,
  onNavigate,
  onRefresh,
  onAddPaymentLocal,
  onAddReceiptLocal,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients.find(c => c.name === initialClient)?.id || clients[0]?.id || ''
  );
  const [customClientName, setCustomClientName] = useState<string>(initialClient || (clients[0]?.name ?? 'Cliente'));
  const [isNewClient, setIsNewClient] = useState<boolean>(clients.length === 0);

  const [selectedService, setSelectedService] = useState<string>(initialService || services[0]?.name || 'Servicio profesional');
  const [amount, setAmount] = useState<number>(initialAmount);
  const [method, setMethod] = useState<Payment['method']>('payment_link');

  // State: 'form' | 'created'
  const [stage, setStage] = useState<'form' | 'created'>('form');
  const [createdPayment, setCreatedPayment] = useState<Payment | null>(null);
  const [createdReceipt, setCreatedReceipt] = useState<Receipt | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [sharedToast, setSharedToast] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isInternalModalOpen, setIsInternalModalOpen] = useState<boolean>(false);

  // Sync state whenever props change (e.g. from "¿Cuánto cobrar?" or Home)
  useEffect(() => {
    if (initialAmount && initialAmount > 0) {
      setAmount(initialAmount);
    }
    if (initialService) {
      setSelectedService(initialService);
    }
    if (initialClient) {
      setCustomClientName(initialClient);
      const found = clients.find(c => c.name === initialClient);
      if (found) {
        setSelectedClientId(found.id);
        setIsNewClient(false);
      } else {
        setIsNewClient(true);
      }
    }
    setStage('form');
  }, [initialAmount, initialService, initialClient, clients]);

  // Fee calculation formulas
  const currentAmt = Number(amount) || 0;
  const isCash = method === 'cash';
  // Mercado Pago standard fee: ~3.49% + $4.00 MXN (only applies to payment_link)
  const mpFee = isCash ? 0 : Math.round((currentAmt * 0.0349 + 4) * 100) / 100;
  // ChambaApp fee: platformFeePercentage (e.g. 3.5% for digital, 0 for cash)
  const chambaFee = isCash ? 0 : Math.round((currentAmt * (platformConfig.platformFeePercentage / 100)) * 100) / 100;
  const netSeller = isCash ? currentAmt : Math.max(0, Math.round((currentAmt - mpFee - chambaFee) * 100) / 100);

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const client = clients.find(c => c.id === selectedClientId);
      const clientName = !isNewClient && client ? client.name : (customClientName.trim() || 'Cliente');
      const clientId = !isNewClient && client ? client.id : `cli_${Date.now()}`;
      const now = new Date().toISOString();
      const paymentId = `pay_${Date.now()}`;

      // Guaranteed local receipt number
      let receiptNumber = `REC-${String(Date.now()).slice(-6)}`;
      try {
        if (businessId && businessId !== 'biz_demo_ana') {
          const remoteNum = await getNextReceiptNumber(businessId);
          if (remoteNum) receiptNumber = remoteNum;
        }
      } catch (err) {
        console.warn('Receipt number generation fallback to local:', err);
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const paymentUrl = `${origin}${pathname}?pay=${paymentId}`;

      const payment: Payment = {
        id: paymentId,
        businessId,
        clientId,
        clientName,
        serviceName: selectedService || 'Servicio profesional',
        amount: currentAmt || 500,
        status: 'pending',
        method,
        paymentUrl,
        mercadoPagoFee: mpFee,
        chambaAppFee: chambaFee,
        sellerNetAmount: netSeller,
        createdAt: now,
      };

      const receipt: Receipt = {
        id: `rec_${paymentId}`,
        businessId,
        clientId,
        clientName,
        receiptNumber,
        serviceName: selectedService || 'Servicio profesional',
        amount: currentAmt || 500,
        status: 'pending',
        issuedAt: now,
        paymentMethod: method,
      };

      // 1. Immediately advance UI to created stage
      setCreatedPayment(payment);
      setCreatedReceipt(receipt);
      setStage('created');

      // 2. Propagate to parent state & localStorage
      if (onAddPaymentLocal) {
        onAddPaymentLocal(payment);
      }
      if (onAddReceiptLocal) {
        onAddReceiptLocal(receipt);
      }

      // 3. Best-effort Firestore write without blocking user
      try {
        if (businessId && businessId !== 'biz_demo_ana') {
          await savePayment(businessId, payment);
          await saveReceipt(businessId, receipt);
          await onRefresh();
        }
      } catch (dbErr) {
        console.warn('Firestore payment save warning (persisted locally):', dbErr);
      }
    } catch (err) {
      console.error('Error creating charge:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdPayment?.paymentUrl) return;
    navigator.clipboard?.writeText(createdPayment.paymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (!createdPayment) return;
    const isPaymentCash = createdPayment.method === 'cash';
    const waText = isPaymentCash
      ? `¡Hola ${createdPayment.clientName}! Te comparto el resumen de tu cobro por el servicio de ${createdPayment.serviceName} por un total de $${createdPayment.amount} MXN a liquidar en efectivo al finalizar el trabajo.`
      : `¡Hola ${createdPayment.clientName}! Aquí tienes el enlace seguro para realizar tu pago de $${createdPayment.amount} por el servicio de ${createdPayment.serviceName}: ${createdPayment.paymentUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');
    setSharedToast(true);
    setTimeout(() => setSharedToast(false), 2500);
  };

  const handleSimulatePayment = async () => {
    if (!createdPayment || !createdReceipt) return;
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const paidReceipt: Receipt = {
        ...createdReceipt,
        status: 'paid',
        issuedAt: now,
        paymentMethod: createdPayment.method,
      };

      if (onAddReceiptLocal) {
        onAddReceiptLocal(paidReceipt);
      }

      try {
        if (businessId && businessId !== 'biz_demo_ana') {
          await updatePaymentStatus(businessId, createdPayment.id, 'paid', now);
          await saveReceipt(businessId, paidReceipt);
          await onRefresh();
        }
      } catch (dbErr) {
        console.warn('Firestore simulate payment warning:', dbErr);
      }

      onPaymentCompleted(paidReceipt);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stage === 'created' && createdPayment && createdReceipt) {
    const isPaymentCash = createdPayment.method === 'cash';

    return (
      <div className="space-y-4 pb-24 pt-1">
        {/* Header feedback */}
        <div className="text-center px-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-heading font-semibold text-xs mb-2 ${
            isPaymentCash ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isPaymentCash ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            {isPaymentCash ? 'Cobro en efectivo' : 'Cobro digital'} · {createdReceipt.receiptNumber}
          </span>
          <h1 className="font-heading font-bold text-2xl text-[#07326F]">
            {isPaymentCash ? 'Cobro en efectivo registrado' : 'Cobro creado'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPaymentCash
              ? 'Avísale a tu cliente y genera su recibo digital oficial al terminar.'
              : 'Comparte este enlace para recibir el pago de tu cliente.'}
          </p>
        </div>

        {/* Status Card */}
        <Card className="p-5 bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="text-center py-2">
            <span className="text-xs text-slate-400 block mb-0.5 font-medium">Monto a cobrar</span>
            <div className="font-heading font-bold text-4xl text-[#07326F] tabular-nums">
              ${createdPayment.amount}
            </div>
            <p className="font-heading font-semibold text-sm text-[#07326F] mt-1">
              {createdPayment.clientName}
            </p>
            <p className="text-xs text-slate-500">
              {createdPayment.serviceName}
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <span className="text-slate-500">Método de cobro:</span>
            <div className="inline-flex items-center gap-1.5 font-heading font-semibold text-[#07326F]">
              {isPaymentCash ? (
                <>
                  <Banknote className="w-4 h-4 text-[#19AA83]" />
                  <span>Efectivo (Al terminar el servicio)</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-[#07326F]" />
                  <span>Link de pago digital</span>
                </>
              )}
            </div>
          </div>

          {/* Desglose de Cobro */}
          {isPaymentCash ? (
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/70 space-y-2 text-xs">
              <span className="font-heading font-semibold text-[10px] text-emerald-700 uppercase tracking-wider block">
                Cobro directo en efectivo (Sin intermediarios)
              </span>
              <div className="flex items-center justify-between text-slate-700">
                <span>Efectivo a recibir del cliente:</span>
                <span className="font-heading font-bold text-[#07326F] text-sm">${createdPayment.amount}.00 MXN</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Comisión de pasarela:</span>
                <span className="text-emerald-700 font-semibold">$0.00 (Sin comisiones)</span>
              </div>
              <div className="pt-1.5 border-t border-emerald-200 flex items-center justify-between font-heading font-bold text-xs text-[#19AA83]">
                <span>Total íntegro en tu mano:</span>
                <span className="text-sm">${createdPayment.amount}.00 MXN</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1.5 text-xs">
              <span className="font-heading font-semibold text-[10px] text-slate-400 uppercase tracking-wider block">
                Desglose transparente de cobro digital
              </span>
              <div className="flex items-center justify-between text-slate-600">
                <span>Monto pagado por cliente:</span>
                <span className="font-heading font-medium text-[#07326F]">${createdPayment.amount}.00</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Comisión de Mercado Pago (pasarela):</span>
                <span>-${mpFee}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Comisión ChambaApp ({platformConfig.platformFeePercentage}% plataforma):</span>
                <span>-${chambaFee}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-heading font-bold text-xs text-[#19AA83]">
                <span>Monto neto que recibes:</span>
                <span>${netSeller} MXN</span>
              </div>
            </div>
          )}

          {/* Link box (only if digital payment) */}
          {!isPaymentCash && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400">Enlace de cobro único</span>
              <div className="flex items-center gap-2 p-2.5 bg-slate-100/80 rounded-xl text-xs text-slate-600 font-mono overflow-hidden">
                <span className="truncate flex-1">{createdPayment.paymentUrl}</span>
                <button
                  onClick={handleCopyLink}
                  className="shrink-0 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-xs font-heading font-semibold text-[#07326F] hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#19AA83]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          )}
        </Card>

        {sharedToast && (
          <div className="bg-[#19AA83]/15 border border-[#19AA83]/40 p-3 rounded-xl text-xs text-[#07326F] font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#19AA83] shrink-0" />
            <span>{isPaymentCash ? 'Mensaje para cliente abierto en WhatsApp' : 'Enlace de cobro listo para compartir'}</span>
          </div>
        )}

        {/* Buttons for CASH vs DIGITAL */}
        <div className="space-y-2.5 pt-2">
          {isPaymentCash ? (
            <>
              {/* Primary action for cash: Mark as paid and get official receipt */}
              <Button
                variant="positive"
                size="lg"
                disabled={isSubmitting}
                onClick={handleSimulatePayment}
                icon={<CheckCircle2 className="w-5 h-5 text-white" />}
              >
                {isSubmitting ? 'Generando recibo...' : '✓ Registrar efectivo recibido → Generar recibo'}
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleShareLink}
                icon={<Share2 className="w-4 h-4 text-[#F9D785]" />}
              >
                Avisar al cliente por WhatsApp
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="lg"
                onClick={handleShareLink}
                icon={<Share2 className="w-4 h-4 text-[#F9D785]" />}
              >
                Compartir link de pago
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={handleCopyLink}
                icon={<Copy className="w-4 h-4 text-slate-500" />}
              >
                {copied ? '¡Link copiado al portapapeles!' : 'Copiar link'}
              </Button>

              <div className="pt-2">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-heading font-semibold text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-[#19AA83]" />
                    <span>Simulación de pago recibido</span>
                  </div>
                  <Button
                    variant="positive"
                    size="md"
                    disabled={isSubmitting}
                    onClick={handleSimulatePayment}
                    icon={<CheckCircle2 className="w-4 h-4 text-white" />}
                  >
                    {isSubmitting ? 'Actualizando...' : 'Marcar como pagado → Ver recibo'}
                  </Button>
                </div>
              </div>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsInternalModalOpen(true)}
            icon={<FileText className="w-4 h-4 text-[#07326F]" />}
            className="w-full text-[#07326F] font-semibold"
          >
            Ver Nota de Servicio / Control Interno (No CFDI)
          </Button>
        </div>

        {/* Modal: Nota de Servicio / Recibo Interno */}
        {isInternalModalOpen && createdPayment && (
          <InternalReceiptModal
            isOpen={isInternalModalOpen}
            onClose={() => setIsInternalModalOpen(false)}
            data={{
              folio: createdReceipt?.receiptNumber || `REC-${createdPayment.id.slice(-6)}`,
              date: createdPayment.createdAt,
              businessName,
              clientName: createdPayment.clientName,
              serviceName: createdPayment.serviceName,
              orderStatus: createdPayment.status === 'paid' ? 'cobrado' : 'completado',
              materialsCost: Math.round(createdPayment.amount * 0.3),
              laborCost: Math.round(createdPayment.amount * 0.7),
              subtotal: createdPayment.amount,
              total: createdPayment.amount,
              payments: [
                {
                  id: `pay_${createdPayment.id}`,
                  quoteId: 'general',
                  idempotencyKey: `idem_${createdPayment.id}`,
                  type: 'liquidacion',
                  amount: createdPayment.amount,
                  method: createdPayment.method,
                  date: createdPayment.createdAt,
                }
              ],
              totalPaid: createdPayment.status === 'paid' ? createdPayment.amount : 0,
              balanceDue: createdPayment.status === 'paid' ? 0 : createdPayment.amount,
              paymentMethod: createdPayment.method,
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 pt-1">
      <div>
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#07326F]">
          Nuevo cobro
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          ¿A quién quieres cobrarle y cómo?
        </p>
      </div>

      {/* Quick link to Cotizaciones y Saldos */}
      <div 
        onClick={() => onNavigate('quotes')}
        className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:bg-blue-100/70 transition-all text-xs"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#07326F]" />
          <span className="font-heading font-semibold text-[#07326F]">
            ¿Cobrar anticipo o abono de cotización?
          </span>
        </div>
        <span className="text-[#19AA83] font-heading font-semibold text-[11px]">
          Ver cotizaciones y saldos →
        </span>
      </div>

      <form onSubmit={handleCreateCharge} className="space-y-3.5">
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs space-y-3.5">
          {/* Cliente */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-heading font-medium text-slate-500">
                Cliente
              </label>
              <button
                type="button"
                onClick={() => setIsNewClient(!isNewClient)}
                className="text-[11px] text-[#07326F] hover:underline font-heading font-semibold cursor-pointer"
              >
                {isNewClient ? 'Seleccionar existente' : '+ Escribir otro'}
              </button>
            </div>

            {isNewClient ? (
              <input
                type="text"
                required
                value={customClientName}
                onChange={(e) => setCustomClientName(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-semibold text-[#07326F] bg-slate-50/50"
              />
            ) : (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-semibold text-[#07326F] bg-slate-50/50"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Servicio */}
          <div>
            <label className="block text-xs font-heading font-medium text-slate-500 mb-1.5">
              Servicio o concepto
            </label>
            {services.length > 0 ? (
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-medium text-[#07326F] bg-slate-50/50"
              >
                {services.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                placeholder="Ej. Limpieza del hogar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-medium text-[#07326F] bg-slate-50/50"
              />
            )}
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-xs font-heading font-medium text-slate-500 mb-1.5">
              Cantidad a cobrar
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">
                $
              </span>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-base font-bold text-[#07326F] font-heading bg-slate-50/50"
              />
            </div>
            {amount === 750 && (
              <span className="text-[11px] text-[#19AA83] font-medium mt-1 inline-flex items-center gap-1">
                ✓ Monto sugerido por la calculadora de ganancias
              </span>
            )}
          </div>

          {/* Selector de Método de Cobro: Efectivo o Link Digital */}
          <div>
            <label className="block text-xs font-heading font-medium text-slate-500 mb-1.5">
              Método de cobro
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  method === 'cash'
                    ? 'border-[#19AA83] bg-[#19AA83]/10 text-[#07326F] ring-2 ring-[#19AA83]/30'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${method === 'cash' ? 'bg-[#19AA83] text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Banknote className="w-4 h-4" />
                  </div>
                  {method === 'cash' && <span className="text-[10px] font-heading font-bold bg-[#19AA83] text-white px-1.5 py-0.5 rounded-md">Activo</span>}
                </div>
                <span className="font-heading font-bold text-xs block text-[#07326F]">En efectivo</span>
                <span className="text-[10px] text-slate-500 leading-tight mt-0.5">Cobras en mano al terminar</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('payment_link')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  method === 'payment_link'
                    ? 'border-[#07326F] bg-[#07326F]/10 text-[#07326F] ring-2 ring-[#07326F]/30'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${method === 'payment_link' ? 'bg-[#07326F] text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  {method === 'payment_link' && <span className="text-[10px] font-heading font-bold bg-[#07326F] text-white px-1.5 py-0.5 rounded-md">Activo</span>}
                </div>
                <span className="font-heading font-bold text-xs block text-[#07326F]">Link digital</span>
                <span className="text-[10px] text-slate-500 leading-tight mt-0.5">Tarjeta y transferencia</span>
              </button>
            </div>

            {/* Cash explanation banner */}
            {method === 'cash' && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-800 flex items-start gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>100% íntegro para ti.</strong> Podrás avisarle a tu cliente por WhatsApp y al terminar el servicio generar su <strong>recibo oficial en efectivo</strong>.
                </span>
              </div>
            )}
          </div>
        </Card>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            icon={<ArrowRight className="w-5 h-5 text-[#F9D785]" />}
          >
            {isSubmitting
              ? 'Procesando...'
              : method === 'cash'
                ? 'Registrar cobro en efectivo'
                : 'Crear cobro y generar link'}
          </Button>
        </div>
      </form>
    </div>
  );
};
