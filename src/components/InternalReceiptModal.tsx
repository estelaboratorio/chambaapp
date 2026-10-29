import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Share2, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  DollarSign, 
  FileText, 
  ShieldAlert, 
  Banknote, 
  CreditCard,
  Briefcase
} from 'lucide-react';
import { Button } from './ui/Button';
import { InternalServiceReceiptData } from '../types';
import { ChambaLogo } from './ChambaLogo';

interface InternalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InternalServiceReceiptData;
}

export const InternalReceiptModal: React.FC<InternalReceiptModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const isFullyPaid = data.balanceDue <= 0.01;
  const isCompletedOrCobrado = data.orderStatus === 'completado' || data.orderStatus === 'cobrado' || data.orderStatus === 'completed';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = `
============================================================
           NOTA DE SERVICIO / RECIBO INTERNO
============================================================
Comprobante de control interno - No válido como comprobante fiscal digital (CFDI)
------------------------------------------------------------
Folio: ${data.folio}
Fecha de emisión: ${new Date(data.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
Negocio: ${data.businessName}
${data.businessPhone ? `Tel/WhatsApp: ${data.businessPhone}` : ''}
${data.businessCity ? `Ubicación: ${data.businessCity}` : ''}

DATOS DEL CLIENTE:
Cliente: ${data.clientName}
${data.clientPhone ? `Teléfono: ${data.clientPhone}` : ''}
${data.clientAddress ? `Dirección: ${data.clientAddress}` : ''}

RESUMEN DEL TRABAJO:
Servicio: ${data.serviceName}
${data.serviceDescription ? `Descripción: ${data.serviceDescription}` : ''}
${data.technician ? `Técnico responsable: ${data.technician}` : ''}
${data.executionDate ? `Fecha de ejecución: ${data.executionDate}` : ''}
Estado de la orden: ${data.orderStatus.toUpperCase()}

DESGLOSE DE COSTOS:
• Costo de materiales: $${data.materialsCost} MXN
• Mano de obra especializada: $${data.laborCost} MXN
• Subtotal (Precio base): $${data.subtotal} MXN
${data.discountAmount && data.discountAmount > 0 ? `• Descuento: -$${data.discountAmount} MXN\n` : ''}${data.taxAmount && data.taxAmount > 0 ? `• Impuestos (IVA): +$${data.taxAmount} MXN\n` : ''}------------------------------------------------------------
TOTAL DEL SERVICIO: $${data.total} MXN
------------------------------------------------------------

CONTROL DE COBRANZA Y SALDO:
• Total pagado a la fecha: $${data.totalPaid} MXN
• Saldo pendiente: $${data.balanceDue} MXN
• Estado financiero: ${isFullyPaid ? '100% LIQUIDADO' : 'SALDO PENDIENTE'}

============================================================
Comprobante de control interno - No válido como comprobante fiscal digital (CFDI)
Emitido con ChambaApp
============================================================
`.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nota_Servicio_${data.folio.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleShareWhatsApp = () => {
    let msg = `📄 *NOTA DE SERVICIO / RECIBO INTERNO*\n`;
    msg += `*${data.businessName}*\n`;
    msg += `Folio: *${data.folio}*\n`;
    msg += `Fecha: ${new Date(data.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}\n\n`;
    
    msg += `*DATOS DEL CLIENTE*\n`;
    msg += `Cliente: *${data.clientName}*\n\n`;

    msg += `*RESUMEN DEL TRABAJO*\n`;
    msg += `• Servicio: *${data.serviceName}*\n`;
    if (data.technician) msg += `• Técnico: ${data.technician}\n`;
    msg += `• Estado: ${data.orderStatus.toUpperCase()}\n\n`;

    msg += `*DESGLOSE DE COSTOS*\n`;
    msg += `• Materiales: $${data.materialsCost} MXN\n`;
    msg += `• Mano de obra: $${data.laborCost} MXN\n`;
    msg += `• Subtotal: $${data.subtotal} MXN\n`;
    if (data.discountAmount && data.discountAmount > 0) {
      msg += `• Descuento: -$${data.discountAmount} MXN\n`;
    }
    if (data.taxAmount && data.taxAmount > 0) {
      msg += `• IVA: +$${data.taxAmount} MXN\n`;
    }
    msg += `*TOTAL DEL SERVICIO:* *$${data.total} MXN*\n\n`;

    msg += `*ESTADO DE PAGO*\n`;
    msg += `• Total pagado: *$${data.totalPaid} MXN*\n`;
    msg += `• *Saldo pendiente:* *$${data.balanceDue} MXN*\n`;
    if (isFullyPaid) {
      msg += `✅ *Servicio 100% liquidado.*\n\n`;
    } else {
      msg += `⚠️ Saldo restante por liquidar.\n\n`;
    }

    // LEYENDA OBLIGATORIA
    msg += `_Comprobante de control interno - No válido como comprobante fiscal digital (CFDI)_`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      {/* Container - printable section has ID #printable-internal-receipt */}
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Modal Top Bar (Hidden during print) */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#07326F] text-white">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-heading font-bold text-sm text-[#07326F]">
                Nota de Servicio / Recibo Interno
              </h3>
              <p className="text-[11px] text-slate-500">
                Folio: {data.folio}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Printable Document Body */}
        <div id="printable-internal-receipt" className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 print:p-6 print:m-0 print:text-black">
          
          {/* Header: Business & Folio */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <ChambaLogo variant="horizontal" size="sm" />
              </div>
              <h2 className="font-heading font-bold text-base text-[#07326F] mt-1.5">
                {data.businessName}
              </h2>
              {data.businessCategory && (
                <p className="text-[11px] text-slate-500 font-medium">
                  {data.businessCategory}
                </p>
              )}
              {data.businessPhone && (
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#19AA83]" />
                  <span>{data.businessPhone}</span>
                </p>
              )}
              {data.businessCity && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{data.businessCity}</span>
                </p>
              )}
            </div>

            <div className="text-right space-y-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-[#07326F] border border-slate-200 inline-block">
                {data.folio}
              </span>
              <p className="text-[11px] text-slate-400">
                {new Date(data.date).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              <div className="pt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider inline-block ${
                  isFullyPaid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : isCompletedOrCobrado
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {isFullyPaid ? '✓ Pagado / Liquidado' : isCompletedOrCobrado ? 'Completado (Saldo pendiente)' : 'En servicio'}
                </span>
              </div>
            </div>
          </div>

          {/* ================= MANDATORY CFDI DISCLAIMER BOX ================= */}
          <div className="p-3 bg-amber-50/90 border-2 border-amber-300 rounded-xl text-center space-y-0.5 print:border print:border-black print:bg-gray-100">
            <div className="flex items-center justify-center gap-1.5 text-amber-900 font-heading font-bold text-[11px] uppercase tracking-wide print:text-black">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 print:hidden" />
              <span>Comprobante de control interno - No válido como comprobante fiscal digital (CFDI)</span>
            </div>
            <p className="text-[10px] text-amber-800/90 print:text-black">
              Documento emitido exclusivamente para fines de control operativo, entrega de trabajo y cobranza administrativa interna.
            </p>
          </div>

          {/* Client Information Card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-heading font-bold text-[11px] uppercase tracking-wider text-[#07326F] block">
              Datos del cliente
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Nombre completo:</span>
                <span className="font-heading font-bold text-slate-800">{data.clientName}</span>
              </div>
              {data.clientPhone && (
                <div>
                  <span className="text-slate-400 text-[10px] block">Teléfono de contacto:</span>
                  <span className="font-medium text-slate-700">{data.clientPhone}</span>
                </div>
              )}
              {data.clientAddress && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 text-[10px] block">Dirección de servicio:</span>
                  <span className="text-slate-700">{data.clientAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resumen del Trabajo */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
            <span className="font-heading font-bold text-[11px] uppercase tracking-wider text-[#07326F] block">
              Resumen del trabajo realizado
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">{data.serviceName}</span>
                {data.technician && (
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    Técnico: {data.technician}
                  </span>
                )}
              </div>
              {data.serviceDescription && (
                <p className="text-slate-600 text-xs mt-1 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                  {data.serviceDescription}
                </p>
              )}
              {data.executionDate && (
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Fecha programada / realizada: {data.executionDate}</span>
                </p>
              )}
            </div>
          </div>

          {/* Costos Desglosados */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
            <span className="font-heading font-bold text-[11px] uppercase tracking-wider text-[#07326F] block">
              Desglose financiero de costos
            </span>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Costo de materiales e insumos:</span>
                <span className="font-mono font-semibold text-slate-800">${data.materialsCost} MXN</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Mano de obra especializada:</span>
                <span className="font-mono font-semibold text-slate-800">${data.laborCost} MXN</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 font-semibold text-[#07326F]">
                <span>Subtotal (Precio base calculado):</span>
                <span className="font-mono font-bold">${data.subtotal} MXN</span>
              </div>
              {data.discountAmount && data.discountAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-red-600">
                  <span>Descuento aplicado:</span>
                  <span className="font-mono font-semibold">-${data.discountAmount} MXN</span>
                </div>
              )}
              {data.taxAmount && data.taxAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>IVA ({data.taxRate ? Math.round(data.taxRate * 100) : 16}%):</span>
                  <span className="font-mono font-semibold">+${data.taxAmount} MXN</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 font-heading font-bold text-sm text-[#07326F]">
                <span>Total formal del servicio:</span>
                <span className="font-mono text-base text-[#07326F]">${data.total} MXN</span>
              </div>
            </div>
          </div>

          {/* Control de Cobranza y Saldo Pagado */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2.5 print:bg-white print:text-black print:border print:border-black">
            <span className="font-heading font-bold text-[11px] uppercase tracking-wider text-[#F9D785] print:text-black block">
              Control de cobranza y estado de cuenta
            </span>

            {/* Payments breakdown */}
            {data.payments && data.payments.length > 0 ? (
              <div className="space-y-1.5 pb-2 border-b border-slate-700 print:border-black text-[11px]">
                {data.payments.map((p, idx) => (
                  <div key={p.id || idx} className="flex justify-between text-slate-300 print:text-black">
                    <span className="capitalize">
                      {p.type === 'anticipo' ? 'Anticipo inicial' : p.type === 'abono' ? 'Abono parcial' : 'Liquidación'}:
                    </span>
                    <span className="font-mono font-semibold text-emerald-400 print:text-black">
                      +${p.amount} MXN ({p.method === 'cash' ? 'Efectivo' : p.method === 'transfer' ? 'Transferencia' : 'Digital'})
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block print:text-black">
                  Total Pagado a la Fecha
                </span>
                <span className="font-heading font-bold text-base text-[#19AA83] print:text-black">
                  ${data.totalPaid} MXN
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block print:text-black">
                  Saldo Pendiente
                </span>
                <span className={`font-heading font-bold text-base ${isFullyPaid ? 'text-emerald-400' : 'text-amber-400'} print:text-black`}>
                  ${data.balanceDue} MXN
                </span>
              </div>
            </div>

            {isFullyPaid && (
              <div className="pt-1 text-center">
                <span className="text-[10px] font-heading font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800 print:text-black print:border-black">
                  ✓ Cuenta 100% saldada y liquidada
                </span>
              </div>
            )}
          </div>

          {/* Signature Boxes (Clean for printed paper voucher) */}
          <div className="pt-4 grid grid-cols-2 gap-4 text-center">
            <div className="pt-8 border-t border-slate-300">
              <span className="text-[10px] font-medium text-slate-500 block">
                Firma de conformidad del cliente
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5 block">
                Recibí el servicio a mi entera satisfacción
              </span>
            </div>

            <div className="pt-8 border-t border-slate-300">
              <span className="text-[10px] font-medium text-slate-500 block">
                Firma del técnico / prestador
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5 block">
                {data.businessName}
              </span>
            </div>
          </div>

          {/* Second mandatory visible disclaimer at the bottom */}
          <div className="pt-2 text-center text-[10px] text-slate-400 font-medium border-t border-slate-100">
            <span>Comprobante de control interno - No válido como comprobante fiscal digital (CFDI) · ChambaApp</span>
          </div>

        </div>

        {/* Modal Action Buttons Footer (Hidden during print) */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2 print:hidden">
          {downloadSuccess && (
            <span className="text-xs text-emerald-700 font-medium mr-auto flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Archivo descargado</span>
            </span>
          )}
          {shareSuccess && (
            <span className="text-xs text-[#19AA83] font-medium mr-auto flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#19AA83]" />
              <span>Compartido por WhatsApp</span>
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cerrar
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleShareWhatsApp}
            icon={<Share2 className="w-3.5 h-3.5 text-[#19AA83]" />}
          >
            WhatsApp
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            icon={<Download className="w-3.5 h-3.5 text-slate-600" />}
          >
            Descargar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="w-3.5 h-3.5 text-[#F9D785]" />}
          >
            Imprimir / Guardar PDF
          </Button>
        </div>

      </div>
    </div>
  );
};
