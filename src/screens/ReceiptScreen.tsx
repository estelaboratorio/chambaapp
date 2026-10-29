import React, { useState } from 'react';
import { Send, Download, CheckCircle2, Home, Share2, Sparkles, Check, Banknote, CreditCard, FileText, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ChambaLogo } from '../components/ChambaLogo';
import { Receipt, Screen, InternalServiceReceiptData } from '../types';
import { InternalReceiptModal } from '../components/InternalReceiptModal';

interface ReceiptScreenProps {
  receipt?: Receipt | null;
  businessName: string;
  onNavigate: (screen: Screen) => void;
}

export const ReceiptScreen: React.FC<ReceiptScreenProps> = ({
  receipt,
  businessName,
  onNavigate,
}) => {
  const [sentToast, setSentToast] = useState<boolean>(false);
  const [downloadToast, setDownloadToast] = useState<boolean>(false);
  const [isInternalModalOpen, setIsInternalModalOpen] = useState<boolean>(false);

  const receiptNumber = receipt?.receiptNumber || 'REC-000124';
  const clientName = receipt?.clientName || 'Cliente';
  const service = receipt?.serviceName || 'Servicio profesional';
  const date = receipt?.issuedAt ? new Date(receipt.issuedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Hoy';
  const total = receipt?.amount || 500;
  const isCash = receipt?.paymentMethod === 'cash';

  const handleSendReceipt = () => {
    const methodStr = isCash ? 'Efectivo en mano (Al terminar el servicio)' : 'Transferencia / Link Digital';
    const waText = `🧾 *COMPROBANTE OFICIAL DE PAGO*\n\nNegocio: *${businessName}*\nFolio: *${receiptNumber}*\nCliente: *${clientName}*\nServicio: *${service}*\nFecha: *${date}*\nMétodo de pago: *${methodStr}*\nTotal pagado: *$${total} MXN*\nEstado: *PAGADO*\n\n_Comprobante de control interno - No válido como comprobante fiscal digital (CFDI)_\n\n¡Gracias por tu confianza y preferencia! ✨`;
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
    setSentToast(true);
    setTimeout(() => setSentToast(false), 3000);
  };

  const handleDownloadReceipt = () => {
    setDownloadToast(true);
    setTimeout(() => {
      window.print();
      setDownloadToast(false);
    }, 600);
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Title */}
      <div className="text-center px-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#19AA83]/15 text-[#19AA83] font-heading font-semibold text-xs mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isCash ? 'Pago en efectivo confirmado' : 'Pago digital confirmado'}
        </span>
        <h1 className="font-heading font-bold text-2xl text-[#07326F]">
          Recibo digital
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprobante oficial para tu cliente
        </p>
      </div>

      {/* Professional Receipt Card */}
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-md p-6 overflow-hidden">
        {/* Decorative Top Serrated edge */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isCash ? 'bg-[#19AA83]' : 'bg-[#07326F]'}`} />

        {/* Brand header */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-dashed border-slate-200">
          <ChambaLogo variant="horizontal" size="sm" className="mb-2" />
          <h2 className="font-heading font-bold text-base text-[#07326F] tracking-tight">
            {businessName}
          </h2>
          <span className="text-[11px] font-medium text-slate-400">
            Profesional independiente
          </span>
        </div>

        {/* Receipt Code and Status */}
        <div className="py-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Comprobante</span>
            <span className="font-heading font-bold text-sm text-[#07326F]">
              {receiptNumber}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Estado</span>
            <span className="inline-flex items-center gap-1.5 font-heading font-bold text-xs text-[#19AA83] bg-[#19AA83]/10 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#19AA83]" />
              {isCash ? 'PAGADO EN EFECTIVO' : 'PAGADO'}
            </span>
          </div>
        </div>

        {/* Receipt Details Table */}
        <div className="space-y-3 py-3 border-y border-dashed border-slate-200 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Cliente:</span>
            <span className="font-heading font-semibold text-[#07326F]">{clientName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Servicio:</span>
            <span className="font-medium text-slate-800">{service}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Fecha de emisión:</span>
            <span className="font-medium text-slate-800">{date}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Método de pago:</span>
            <span className="font-heading font-semibold text-[#07326F] flex items-center gap-1.5">
              {isCash ? (
                <>
                  <Banknote className="w-3.5 h-3.5 text-[#19AA83]" />
                  <span>Efectivo en mano</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5 text-[#07326F]" />
                  <span>Link digital / Tarjeta</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="py-4 flex items-baseline justify-between">
          <span className="font-heading font-bold text-base text-[#07326F]">
            Total pagado
          </span>
          <div className="text-right">
            <span className="font-heading font-bold text-3xl text-[#07326F] tabular-nums">
              ${total}
            </span>
            <span className="text-[10px] text-slate-400 block">MXN</span>
          </div>
        </div>

        {/* Mandatory CFDI Disclaimer Banner */}
        <div className="mt-3 p-2.5 bg-amber-50/90 border border-amber-300 rounded-xl text-center space-y-0.5">
          <div className="flex items-center justify-center gap-1.5 text-amber-900 font-heading font-bold text-[10px] uppercase tracking-wide">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Comprobante de control interno - No válido como comprobante fiscal digital (CFDI)</span>
          </div>
        </div>

        {/* Thank You Footer */}
        <div className="pt-2 text-center">
          <p className="font-heading font-medium text-xs text-slate-500 italic">
            “Gracias por confiar en nosotros.”
          </p>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <span>Emitido con</span>
            <span className="font-heading font-semibold text-[#07326F]">ChambaApp</span>
          </div>
        </div>
      </div>

      {/* Confirmation Toast */}
      {sentToast && (
        <div className="bg-[#19AA83]/15 border border-[#19AA83]/40 p-3.5 rounded-xl text-xs text-[#07326F] font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#19AA83] shrink-0" />
          <span>✓ Recibo listo para compartir.</span>
        </div>
      )}

      {downloadToast && (
        <div className="bg-[#07326F]/10 border border-[#07326F]/20 p-3.5 rounded-xl text-xs text-[#07326F] font-medium flex items-center gap-2 animate-in fade-in">
          <Download className="w-4 h-4 text-[#07326F] shrink-0" />
          <span>✓ Recibo digital guardado como PDF en tu dispositivo.</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSendReceipt}
          icon={<Send className="w-4 h-4 text-[#F9D785]" />}
        >
          Enviar recibo
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={handleDownloadReceipt}
          icon={<Download className="w-4 h-4 text-slate-500" />}
        >
          Descargar recibo
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={() => setIsInternalModalOpen(true)}
          icon={<FileText className="w-4 h-4 text-[#07326F]" />}
          className="bg-blue-50/80 border-blue-200 text-[#07326F] hover:bg-blue-100"
        >
          Ver Nota de Servicio / Control Interno Completa
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('home')}
          icon={<Home className="w-4 h-4 text-[#07326F]" />}
        >
          Volver al inicio
        </Button>
      </div>

      {/* Full Internal Receipt Modal */}
      {isInternalModalOpen && (
        <InternalReceiptModal
          isOpen={isInternalModalOpen}
          onClose={() => setIsInternalModalOpen(false)}
          data={{
            folio: receiptNumber,
            date: receipt?.issuedAt || new Date().toISOString(),
            businessName,
            clientName,
            serviceName: service,
            orderStatus: 'cobrado',
            materialsCost: Math.round(total * 0.3),
            laborCost: Math.round(total * 0.7),
            subtotal: total,
            total,
            payments: [
              {
                id: `pay_${receiptNumber}`,
                quoteId: 'general',
                idempotencyKey: `idem_${receiptNumber}`,
                type: 'liquidacion',
                amount: total,
                method: isCash ? 'cash' : 'payment_link',
                date: receipt?.issuedAt || new Date().toISOString(),
              }
            ],
            totalPaid: total,
            balanceDue: 0,
            paymentMethod: isCash ? 'cash' : 'payment_link',
          }}
        />
      )}
    </div>
  );
};
