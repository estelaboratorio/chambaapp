import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MessageCircle, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Clock, 
  Sparkles, 
  ChevronRight,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2
} from 'lucide-react';
import QRCode from 'qrcode';
import { Business, Service } from '../types';
import { getPublicBusinessProfile, getPublicServices } from '../services/firebaseService';
import { ChambaLogo } from '../components/ChambaLogo';

interface PublicCardScreenProps {
  userId: string;
  onNavigateToBooking: (serviceId?: string) => void;
  onGoToAppHome?: () => void;
  isOwnerPreview?: boolean;
}

export const PublicCardScreen: React.FC<PublicCardScreenProps> = ({
  userId,
  onNavigateToBooking,
  onGoToAppHome,
  isOwnerPreview = false,
}) => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://chambaapp.ai.studio';
  const cleanUserId = userId || 'demo';
  const publicCardUrl = `${currentOrigin}/tarjeta/${cleanUserId}`;
  const publicBookingUrl = `${currentOrigin}/agendar/${cleanUserId}`;

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const biz = await getPublicBusinessProfile(cleanUserId);
        if (!isMounted) return;
        setBusiness(biz);

        if (biz) {
          const srvs = await getPublicServices(biz.id);
          if (isMounted) setServices(srvs);
        }
      } catch (err) {
        console.warn('Error loading public card:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [cleanUserId]);

  useEffect(() => {
    // Generate genuine high-res scannable QR Code
    QRCode.toDataURL(publicCardUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#07326F',
        light: '#FFFFFF'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.warn('QR generation error:', err);
    });
  }, [publicCardUrl]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicCardUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleWhatsAppContact = () => {
    const rawPhone = business?.whatsapp || business?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const text = `¡Hola ${business?.name || ''}! Vi tu tarjeta digital en ChambaApp (${publicCardUrl}) y me interesa consultar por tus servicios.`;
    const waUrl = `https://wa.me/${cleanPhone ? (cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone) : ''}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = `Te comparto la tarjeta digital de ${business?.name || 'servicios profesionales'} en ChambaApp:\n\n${business?.description || 'Servicios garantizados a domicilio'}\n\nConoce sus servicios y agenda tu cita aquí:\n${publicCardUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#07326F]/20 border-t-[#07326F] rounded-full animate-spin mb-4" />
        <p className="text-sm font-heading font-medium text-[#07326F]">Cargando tarjeta digital...</p>
      </div>
    );
  }

  const effectiveBiz = business || {
    id: `biz_${cleanUserId}`,
    ownerId: cleanUserId,
    name: 'Servicios Profesionales',
    category: 'Servicios a Domicilio',
    description: 'Atención personalizada y servicios profesionales con calidad garantizada.',
    phone: '55 1234 5678',
    whatsapp: '55 1234 5678',
    city: 'Ciudad de México',
    serviceArea: 'Área metropolitana',
    createdAt: '',
    updatedAt: '',
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col items-center pb-20">
      {/* Top Banner & Header */}
      <div className="w-full bg-[#07326F] text-white pt-6 pb-12 px-4 relative overflow-hidden flex flex-col items-center">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-[#19AA83]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-44 h-44 bg-[#F9D785]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top small brand indicator */}
        <div className="w-full max-w-md flex items-center justify-between mb-4 z-10">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-[11px] font-heading font-medium">
            <ChambaLogo variant="icon" size="sm" />
            <span>ChambaApp • Tarjeta Digital</span>
          </div>

          {isOwnerPreview && onGoToAppHome && (
            <button
              onClick={onGoToAppHome}
              className="text-xs bg-white text-[#07326F] font-heading font-semibold px-3 py-1 rounded-full shadow-xs hover:bg-slate-100 transition-all cursor-pointer"
            >
              Mi panel
            </button>
          )}
        </div>

        {/* Profile Card Container */}
        <div className="w-full max-w-md flex flex-col items-center text-center z-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#19AA83] to-[#07326F] border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-heading font-bold mb-3">
            {effectiveBiz.name.charAt(0)}
          </div>

          <h1 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">
            {effectiveBiz.name}
          </h1>

          <div className="inline-flex items-center gap-1.5 bg-[#19AA83]/30 border border-[#19AA83]/50 text-emerald-200 text-xs px-3 py-0.5 rounded-full mt-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F9D785]" />
            <span>{effectiveBiz.category} • Verificado</span>
          </div>

          {effectiveBiz.description && (
            <p className="text-xs text-white/80 mt-2.5 max-w-sm px-2 leading-relaxed">
              {effectiveBiz.description}
            </p>
          )}

          {effectiveBiz.city && (
            <div className="flex items-center gap-1 text-[11px] text-white/70 mt-2">
              <MapPin className="w-3.5 h-3.5 text-[#F9D785]" />
              <span>{effectiveBiz.city} {effectiveBiz.serviceArea ? `(${effectiveBiz.serviceArea})` : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Container Overlapping Header */}
      <div className="w-full max-w-md px-4 -mt-6 z-20 space-y-4">
        {/* Quick Contact & Booking CTAs */}
        <div className="bg-white rounded-3xl p-4 shadow-xl border border-slate-100 space-y-3">
          {/* Primary Action: Book Online */}
          <button
            onClick={() => onNavigateToBooking()}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#07326F] to-[#0d4594] text-white font-heading font-bold text-sm flex items-center justify-between shadow-md hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-[#F9D785]">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-heading font-bold">Agendar Cita en Línea</span>
                <span className="block text-[11px] font-normal text-white/80">Selecciona fecha y hora disponible</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#F9D785]" />
          </button>

          {/* Secondary Action: WhatsApp */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsAppContact}
              className="py-3 px-3 rounded-2xl bg-[#25D366]/10 text-[#128C7E] font-heading font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-all border border-[#25D366]/30 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current text-[#25D366]" />
              <span>WhatsApp</span>
            </button>

            {effectiveBiz.phone && (
              <a
                href={`tel:${effectiveBiz.phone.replace(/\D/g, '')}`}
                className="py-3 px-3 rounded-2xl bg-slate-50 text-slate-700 font-heading font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#07326F]" />
                <span>Llamar</span>
              </a>
            )}
          </div>
        </div>

        {/* Services Catalog */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500">
              Catálogo de Servicios ({services.length})
            </h2>
            <span className="text-[11px] text-[#19AA83] font-medium">Precios transparentes</span>
          </div>

          {services.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-500 text-xs">
              <p>El profesional ofrece servicios personalizados a domicilio.</p>
              <button
                onClick={() => onNavigateToBooking()}
                className="mt-3 text-[#07326F] font-heading font-semibold text-xs underline cursor-pointer"
              >
                Solicitar cotización o agendar
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {services.map((srv, idx) => (
                <div
                  key={srv.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-[#19AA83]/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading font-bold text-sm text-[#07326F]">
                          {srv.name}
                        </span>
                        {srv.isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F9D785]/30 text-[#07326F] border border-[#F9D785]/50">
                            <Sparkles className="w-2.5 h-2.5 text-[#07326F]" />
                            <span>Principal</span>
                          </span>
                        )}
                      </div>

                      {srv.description && (
                        <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                          {srv.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                        {srv.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{srv.durationMinutes >= 60 ? `${Math.round(srv.durationMinutes / 60)} hrs` : `${srv.durationMinutes} min`}</span>
                          </span>
                        )}
                        <span>• Atención a domicilio</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block font-heading font-bold text-base text-[#19AA83]">
                        ${srv.basePrice}
                      </span>
                      <span className="block text-[10px] text-slate-400">MXN</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">¿Deseas este servicio?</span>
                    <button
                      onClick={() => onNavigateToBooking(srv.id)}
                      className="px-3.5 py-1.5 bg-[#07326F] text-white rounded-xl font-heading font-semibold text-xs flex items-center gap-1 hover:bg-[#093d84] transition-all cursor-pointer"
                    >
                      <span>Agendar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share & QR Code Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
              Compartir tarjeta de contacto
            </h3>
            <button
              onClick={() => setShowQrModal(true)}
              className="text-xs text-[#07326F] font-heading font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#19AA83]" />
              <span>Ver QR</span>
            </button>
          </div>

          {/* Copy link box */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <span className="truncate mr-2 font-mono text-[11px] text-slate-600">
              {publicCardUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1 bg-white border border-slate-200 text-[#07326F] rounded-xl font-heading font-semibold text-xs hover:bg-slate-100 flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#19AA83]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <button
            onClick={handleShareWhatsApp}
            className="w-full py-2.5 px-3 rounded-2xl bg-[#25D366] text-white font-heading font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#20ba59] transition-all cursor-pointer shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Recomendar por WhatsApp</span>
          </button>
        </div>

        {/* Footer Brand Banner */}
        <div className="text-center pt-4 pb-6 space-y-2">
          <div className="flex items-center justify-center gap-1.5">
            <ChambaLogo variant="full" size="sm" />
          </div>
          <p className="text-[11px] text-slate-400">
            Tarjeta digital oficial y sistema de citas de servicios a domicilio.
          </p>
          <a
            href="/"
            className="inline-block text-xs font-heading font-semibold text-[#07326F] hover:underline"
          >
            ¿Ofreces servicios? Crea tu cuenta gratis en ChambaApp
          </a>
        </div>
      </div>

      {/* Floating Bottom Quick Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-center">
        <div className="w-full max-w-md flex items-center gap-2">
          <button
            onClick={handleWhatsAppContact}
            className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shrink-0 hover:bg-[#20ba59] active:scale-95 transition-all shadow-md cursor-pointer"
            title="Enviar mensaje por WhatsApp"
          >
            <MessageCircle className="w-6 h-6 fill-current" />
          </button>

          <button
            onClick={() => onNavigateToBooking()}
            className="flex-1 h-12 rounded-2xl bg-[#07326F] text-white font-heading font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0a428c] active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#F9D785]" />
            <span>Agendar Cita en Línea</span>
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-[#07326F]">
                Código QR de Contacto
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Escanea con la cámara de cualquier teléfono para abrir la tarjeta digital y agendar citas.
            </p>

            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 inline-block shadow-inner">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Código QR ChambaApp" className="w-56 h-56 mx-auto rounded-lg" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  Generando QR...
                </div>
              )}
            </div>

            <div className="space-y-2">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`qr-${cleanUserId}.png`}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#19AA83] text-white font-heading font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#159472] cursor-pointer shadow-xs"
                >
                  <span>Descargar imagen QR para imprimir</span>
                </a>
              )}
              <button
                onClick={handleCopyLink}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 text-slate-700 font-heading font-semibold text-xs hover:bg-slate-200 cursor-pointer"
              >
                {copiedLink ? '¡Enlace copiado!' : 'Copiar enlace directo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
