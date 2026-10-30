import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  CheckCircle2, 
  ExternalLink, 
  QrCode, 
  X, 
  Sparkles, 
  ArrowRight,
  MessageCircle,
  Globe,
  Calendar,
  Download
} from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ChambaLogo } from './ChambaLogo';
import { Service } from '../types';

interface ShareBusinessModalProps {
  businessName: string;
  category?: string;
  primaryService?: string;
  defaultPrice?: number;
  services?: Service[];
  phone?: string;
  userId?: string;
  onClose: () => void;
  isFullPage?: boolean;
}

export const ShareBusinessModal: React.FC<ShareBusinessModalProps> = ({
  businessName,
  category = 'Servicios Profesionales',
  primaryService,
  defaultPrice,
  services = [],
  phone = '55 1234 5678',
  userId,
  onClose,
  isFullPage = false,
}) => {
  const [copiedLink, setCopiedLink] = useState<'card' | 'booking' | null>(null);
  const [copiedBio, setCopiedBio] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [qrType, setQrType] = useState<'card' | 'booking'>('card');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 1. Resolve clean user ID for public routes
  const cleanUserId = (userId || 'demo').trim();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://chambaapp.ai.studio';
  const publicCardUrl = `${origin}/tarjeta/${encodeURIComponent(cleanUserId)}`;
  const publicBookingUrl = `${origin}/agendar/${encodeURIComponent(cleanUserId)}`;

  // 2. Identify Primary Service (strictly prioritized)
  const resolvedPrimary: Service = (() => {
    const explicitPrimary = services.find((s) => s.isPrimary);
    if (explicitPrimary) return explicitPrimary;

    if (primaryService) {
      const matchByName = services.find((s) => s.name.trim().toLowerCase() === primaryService.trim().toLowerCase());
      if (matchByName) return matchByName;
    }

    const prio1 = services.find((s) => s.priority === 1);
    if (prio1) return prio1;

    if (services.length > 0) return services[0];

    return {
      id: 'srv_main_fallback',
      businessId: 'biz_main',
      name: primaryService || 'Servicio principal',
      basePrice: defaultPrice || 500,
      durationMinutes: 180,
      active: true,
      isPrimary: true,
      priority: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  })();

  // 3. Secondary Services in priority order
  const resolvedSecondary: Service[] = services
    .filter((s) => s.id !== resolvedPrimary.id && s.active !== false)
    .sort((a, b) => {
      const pA = a.priority ?? 99;
      const pB = b.priority ?? 99;
      if (pA !== pB) return pA - pB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  // 4. Generate real scannable QR Code
  useEffect(() => {
    const targetUrl = qrType === 'card' ? publicCardUrl : publicBookingUrl;
    QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#07326F',
        light: '#FFFFFF'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.warn('QR code generation error:', err);
    });
  }, [qrType, publicCardUrl, publicBookingUrl]);

  // Promotional text for WhatsApp / Social (spaced cleanly so messaging apps parse URLs reliably)
  const promoServiceLines = [
    `⭐ Servicio principal: ${resolvedPrimary.name} ($${resolvedPrimary.basePrice} MXN)`,
    ...(resolvedSecondary.length > 0
      ? resolvedSecondary.map((s, idx) => `• Opción ${idx + 2}: ${s.name} ($${s.basePrice} MXN)`)
      : []),
  ].join('\n');

  const promoText = `¡Hola! Conoce mis servicios profesionales, tarifas y agenda tu cita directamente en mi ChambaApp:

${promoServiceLines}

💳 Tarjeta Digital:
${publicCardUrl}

📅 Agenda tu cita aquí:
${publicBookingUrl}`;

  const handleCopyLink = (type: 'card' | 'booking') => {
    const urlToCopy = type === 'card' ? publicCardUrl : publicBookingUrl;
    navigator.clipboard?.writeText(urlToCopy);
    setCopiedLink(type);
    setToastMsg(type === 'card' ? '¡Enlace de tarjeta copiado!' : '¡Enlace directo para agendar copiado!');
    setTimeout(() => {
      setCopiedLink(null);
      setToastMsg(null);
    }, 2200);
  };

  const handleCopyBio = () => {
    navigator.clipboard?.writeText(promoText);
    setCopiedBio(true);
    setToastMsg('¡Texto listo para compartir en Instagram o Facebook!');
    setTimeout(() => {
      setCopiedBio(false);
      setToastMsg(null);
    }, 2500);
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(promoText)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicCardUrl)}`;
    window.open(fbUrl, '_blank');
  };

  const content = (
    <div className="space-y-4 text-center">
      {/* Celebration Header */}
      <div>
        <div className="w-14 h-14 rounded-full bg-[#19AA83]/15 text-[#19AA83] flex items-center justify-center mx-auto mb-2 animate-bounce">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>
        <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#07326F]">
          ¡Tus Enlaces Públicos Están Listos!
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Comparte tu tarjeta digital y enlace directo para agendar citas sin necesidad de que tus clientes inicien sesión.
        </p>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Digital Business Card (Tarjeta de presentación pública) */}
      <div className="relative bg-white rounded-3xl border-2 border-[#07326F]/20 shadow-md p-5 text-left overflow-hidden">
        {/* Top accent banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#07326F] via-[#19AA83] to-[#F9D785]" />

        <div className="flex items-start justify-between mb-3 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#07326F] text-white flex items-center justify-center font-heading font-bold text-lg shrink-0 shadow-xs">
              {businessName.charAt(0)}
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#07326F] leading-tight">
                {businessName}
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-heading font-semibold text-[#19AA83] bg-[#19AA83]/10 px-2 py-0.5 rounded-full mt-0.5">
                <span>{category}</span>
                <span>✓ Verificado</span>
              </span>
            </div>
          </div>

          <ChambaLogo variant="icon" size="sm" />
        </div>

        {/* Primary Service (Servicio Principal) */}
        <div className="bg-gradient-to-br from-[#07326F]/5 to-[#19AA83]/10 p-3.5 rounded-2xl border border-[#07326F]/15 space-y-1.5 text-xs mb-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[10px] font-heading font-bold text-[#07326F] uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-[#07326F]/10">
              <Sparkles className="w-3 h-3 text-[#F9D785] fill-current" />
              <span>Servicio principal</span>
            </span>
            {resolvedPrimary.durationMinutes ? (
              <span className="text-[11px] text-slate-500 font-medium">
                {resolvedPrimary.durationMinutes >= 60 ? `${Math.round(resolvedPrimary.durationMinutes / 60)} hrs` : `${resolvedPrimary.durationMinutes} min`}
              </span>
            ) : null}
          </div>
          <div className="flex items-center justify-between font-heading font-bold text-[#07326F] text-sm">
            <span>{resolvedPrimary.name}</span>
            <span className="text-[#19AA83] text-base">${resolvedPrimary.basePrice} <span className="text-[11px] font-normal text-slate-500">MXN</span></span>
          </div>
        </div>

        {/* Public URLs Section */}
        <div className="space-y-2.5">
          {/* Card Link */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
              <span>1. Enlace público de tu tarjeta:</span>
            </span>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-[#07326F] font-mono">
              <span className="truncate mr-2 font-medium text-[11px]">{publicCardUrl}</span>
              <button
                onClick={() => handleCopyLink('card')}
                className="px-2.5 py-1 bg-white border border-slate-200 text-[#07326F] rounded-lg font-heading font-semibold text-xs hover:bg-slate-100 flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedLink === 'card' ? <Check className="w-3.5 h-3.5 text-[#19AA83]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink === 'card' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Booking Link */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
              <span>2. Enlace directo para agendar citas:</span>
            </span>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-[#07326F] font-mono">
              <span className="truncate mr-2 font-medium text-[11px]">{publicBookingUrl}</span>
              <button
                onClick={() => handleCopyLink('booking')}
                className="px-2.5 py-1 bg-white border border-slate-200 text-[#07326F] rounded-lg font-heading font-semibold text-xs hover:bg-slate-100 flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedLink === 'booking' ? <Check className="w-3.5 h-3.5 text-[#19AA83]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink === 'booking' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Sharing Buttons */}
      <div className="space-y-2 pt-1 text-left">
        <span className="text-xs font-heading font-semibold text-[#07326F] block text-center">
          Compartir con clientes
        </span>

        {/* WhatsApp Button */}
        <button
          onClick={handleShareWhatsApp}
          className="w-full py-3 px-4 rounded-xl bg-[#25D366] text-white font-heading font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#20ba59] active:scale-[0.99] transition-all shadow-xs cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>Compartir en WhatsApp (con mensaje listo)</span>
        </button>

        {/* Instagram / Redes Copy */}
        <button
          onClick={handleCopyBio}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white font-heading font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all shadow-xs cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{copiedBio ? '¡Copiado para Instagram!' : 'Copiar texto para Instagram / Redes'}</span>
        </button>

        {/* QR Code Toggle */}
        <button
          onClick={() => setShowQr(!showQr)}
          className="w-full py-2 px-4 rounded-xl bg-white border border-slate-200 text-[#07326F] font-heading font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer"
        >
          <QrCode className="w-4 h-4 text-[#19AA83]" />
          <span>{showQr ? 'Ocultar código QR' : 'Mostrar código QR para imprimir'}</span>
        </button>

        {/* Genuine Scannable QR Code Canvas */}
        {showQr && (
          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setQrType('card')}
                className={`px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-all ${
                  qrType === 'card'
                    ? 'bg-[#07326F] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                QR Tarjeta Digital
              </button>
              <button
                onClick={() => setQrType('booking')}
                className={`px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-all ${
                  qrType === 'booking'
                    ? 'bg-[#07326F] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                QR Agendar Cita
              </button>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 inline-block shadow-sm">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Código QR ChambaApp" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Generando QR...
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              Escanea con cualquier teléfono móvil para abrir directamente.
            </p>

            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`chambaapp-qr-${qrType}-${cleanUserId}.png`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#19AA83] text-white text-xs font-heading font-semibold rounded-xl hover:bg-[#159371] transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar imagen QR (.png)</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Main Action to Proceed */}
      <div className="pt-3">
        <Button
          variant="primary"
          size="lg"
          onClick={onClose}
          icon={<ArrowRight className="w-5 h-5 text-[#F9D785]" />}
        >
          Ir a mi panel de Inicio
        </Button>
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-between p-5 max-w-md mx-auto">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        {content}
      </div>
    </div>
  );
};
