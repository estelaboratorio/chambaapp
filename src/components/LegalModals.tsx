import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, Lock } from 'lucide-react';
import { Button } from './ui/Button';
import { platformConfig } from '../services/configService';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] relative animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#07326F]/10 text-[#07326F] flex items-center justify-center">
              {type === 'privacy' ? (
                <ShieldCheck className="w-5 h-5 text-[#19AA83]" />
              ) : (
                <FileText className="w-5 h-5 text-[#07326F]" />
              )}
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#07326F]">
                {type === 'privacy' ? 'Política de Privacidad' : 'Términos del Servicio'}
              </h3>
              <p className="text-[11px] text-slate-400">
                ChambaApp · Última actualización: Octubre 2026
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Legal Content */}
        <div className="py-4 space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto pr-1">
          {type === 'privacy' ? (
            <>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-2.5 text-emerald-900">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px]">
                  En ChambaApp tu privacidad es prioridad. Cumplimos con los lineamientos de Google Play Console y normativas internacionales de protección de datos.
                </p>
              </div>

              <div>
                <h4 className="font-heading font-bold text-slate-800 text-xs mb-1">
                  1. Información que recopilamos
                </h4>
                <p>
                  Recopilamos únicamente los datos necesarios para brindar el servicio: nombre, correo electrónico, teléfono o WhatsApp comercial, datos de tu negocio (servicios, precios y horarios) y los nombres y teléfonos de clientes que registres para tus citas y recibos.
                </p>
              </div>

              <div>
                <h4 className="font-heading font-bold text-slate-800 text-xs mb-1">
                  2. Uso de la información
                </h4>
                <p>
                  La información se utiliza exclusivamente para:
                </p>
                <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-600">
                  <li>Organizar tu agenda de citas sin traslapes.</li>
                  <li>Generar tu tarjeta digital y enlace público para clientes.</li>
                  <li>Calcular precios recomendados con base en tus costos.</li>
                  <li>Emitir recibos digitales para compartir con tus clientes.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-heading font-bold text-slate-800 text-xs mb-1">
                  3. Pagos y seguridad financiera
                </h4>
                <p>
                  ChambaApp no almacena números de tarjeta de crédito ni claves bancarias. Todas las transacciones con tarjeta se procesan a través de proveedores certificados como Mercado Pago mediante protocolos seguros TLS/HTTPS.
                </p>
              </div>

              <div>
                <h4 className="font-heading font-bold text-slate-800 text-xs mb-1">
                  4. Eliminación de cuenta y datos
                </h4>
                <p>
                  Puedes eliminar tu cuenta y todos tus datos en cualquier momento directamente desde la app en <strong>Mi negocio → Eliminar cuenta</strong>, o enviando una solicitud a <strong>{platformConfig.supportEmail}</strong>. Al solicitar la eliminación, todos tus registros de citas, servicios y clientes se borran permanentemente.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="font-heading font-bold text-slate-800 text-xs mb-1">
                  1. Naturaleza del servicio
                </h4>
                <p>
                  ChambaApp es una plataforma tecnológica móvil para trabajadores y profesionales independientes que facilita la gestión de presupuestos, citas, clientes y emisión de recibos.
                </p>
              </div>

              <div>
                <h4 className="font-heading font-bold text-slate-800 text-xs mb-1">
                  2. Planes y Suscripción
                </h4>
                <p>
                  <strong>Plan GRATIS:</strong> Permite gestionar hasta un límite de 5 clientes con todas las funciones esenciales.<br />
                  <strong>Plan PRO ($200 MXN/mes):</strong> Permite clientes ilimitados, estadísticas avanzadas y catálogo ilimitado.<br />
                  <strong>Plan PRO + PAGOS ($300 MXN/mes):</strong> Incluye cobros digitales con tarjeta vía Mercado Pago.
                </p>
              </div>

              <div>
                <h4 className="font-heading font-bold text-slate-800 text-xs mb-1">
                  3. Responsabilidad sobre los servicios prestados
                </h4>
                <p>
                  Cada usuario independiente es el único responsable de la calidad, cumplimiento y garantías de los trabajos que realice para sus propios clientes finales.
                </p>
              </div>

              <div>
                <h4 className="font-heading font-bold text-slate-800 text-xs mb-1">
                  4. Soporte y Contacto
                </h4>
                <p>
                  Para asistencia técnica o facturación, escribe a <strong>{platformConfig.supportEmail}</strong>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <Button variant="primary" size="sm" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
};
