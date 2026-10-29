import React, { useState } from 'react';
import { 
  Briefcase, 
  Clock, 
  Calendar, 
  DollarSign, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles, 
  Store, 
  ExternalLink, 
  Edit2, 
  LogOut, 
  Trash2, 
  Phone, 
  MapPin, 
  Mail, 
  CreditCard, 
  Volume2, 
  Check, 
  AlertCircle,
  Share2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Business, Screen, Subscription } from '../types';
import { useAuth } from '../context/AuthContext';
import { updateBusiness, savePaymentConnection } from '../services/firebaseService';
import { platformConfig } from '../services/configService';

interface BusinessScreenProps {
  business: Business | null;
  subscription: Subscription | null;
  onNavigate: (screen: Screen) => void;
  onOpenTutorial: () => void;
  onOpenShare?: () => void;
  onOpenLegal?: (type: 'privacy' | 'terms') => void;
  onRefresh: () => Promise<void>;
  onUpdateBusinessLocal?: (updatedBiz: Business) => void;
}

export const BusinessScreen: React.FC<BusinessScreenProps> = ({
  business,
  subscription,
  onNavigate,
  onOpenTutorial,
  onOpenShare,
  onOpenLegal,
  onRefresh,
  onUpdateBusinessLocal,
}) => {
  const { userProfile, signOut, loadDemoData } = useAuth();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [bizName, setBizName] = useState<string>(business?.name || (userProfile?.name ? `Servicios de ${userProfile.name}` : 'Mi Negocio'));
  const [description, setDescription] = useState<string>(business?.description || '');
  const [phone, setPhone] = useState<string>(business?.phone || userProfile?.phone || '');
  const [whatsapp, setWhatsapp] = useState<string>(business?.whatsapp || userProfile?.phone || '');
  const [city, setCity] = useState<string>(business?.city || 'Ciudad de México');
  const [serviceArea, setServiceArea] = useState<string>(business?.serviceArea || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [mpConnected, setMpConnected] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setIsSaving(true);
    try {
      const updated: Business = {
        ...business,
        name: bizName,
        description,
        phone,
        whatsapp,
        city,
        serviceArea,
      };

      if (onUpdateBusinessLocal) {
        onUpdateBusinessLocal(updated);
      }

      try {
        if (business.id && business.id !== 'biz_demo_ana') {
          await updateBusiness(business.id, {
            name: bizName,
            description,
            phone,
            whatsapp,
            city,
            serviceArea,
          });
        }
      } catch (dbErr) {
        console.warn('Firestore business update warning:', dbErr);
      }

      try {
        await onRefresh();
      } catch {}
      setIsEditing(false);
      showToast('Perfil de negocio actualizado.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectMercadoPago = async () => {
    if (!business) return;
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await savePaymentConnection(business.id, {
        id: `conn_mp_${business.id}`,
        businessId: business.id,
        provider: 'mercadopago',
        providerUserId: 'TEST_USER_987654321',
        status: 'connected',
        connectedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      setMpConnected(true);
      showToast('¡Cuenta de Mercado Pago conectada exitosamente!');
    } finally {
      setIsSaving(false);
    }
  };

  const planLabel = subscription?.plan === 'pro_payments' 
    ? 'PRO + PAGOS' 
    : subscription?.plan === 'pro' 
    ? 'PRO ($200 MXN/mes)' 
    : 'GRATIS (Hasta 5 clientes)';

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#07326F]">
            Mi negocio
          </h1>
          <p className="text-xs text-slate-500">
            Perfil y ajustes de tu servicio profesional
          </p>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Profile Card */}
      {isEditing ? (
        <Card className="p-4 bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-heading font-bold text-sm text-[#07326F]">
              Editar perfil de negocio
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                Nombre de tu negocio
              </label>
              <input
                type="text"
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-semibold text-[#07326F] bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                Descripción del negocio
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-[#07326F] bg-slate-50/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-[#07326F] bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-[#07326F] bg-slate-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-[#07326F] bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                  Zona de servicio
                </label>
                <input
                  type="text"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-[#07326F] bg-slate-50/50"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving}
              icon={<Check className="w-4 h-4 text-[#19AA83]" />}
            >
              Guardar cambios
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="p-5 bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#07326F] text-white flex items-center justify-center font-heading font-bold text-xl shrink-0 shadow-sm shadow-[#07326F]/20">
                {(business?.name || 'A').charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-heading font-bold text-base text-[#07326F]">
                    {business?.name || 'Mi Negocio'}
                  </h2>
                  <span className="w-4 h-4 rounded-full bg-[#19AA83]/15 text-[#19AA83] flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {userProfile?.name || 'Propietario'} · {business?.category || 'Servicios'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-heading font-semibold text-[#07326F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          </div>

          {business?.description && (
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {business.description}
            </p>
          )}

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#07326F]" />
                Ciudad / Zona:
              </span>
              <span className="font-heading font-semibold text-[#07326F]">
                {business?.city || 'Ciudad de México'} ({business?.serviceArea || 'General'})
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#07326F]" />
                Teléfono:
              </span>
              <span className="font-medium text-slate-700">
                {business?.phone || userProfile?.phone || 'No configurado'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Navigation Cards */}
      <div className="space-y-2.5">
        {/* Catálogo de Servicios */}
        <div
          onClick={() => onNavigate('services-manager')}
          className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-[#07326F]/30 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#07326F]/10 text-[#07326F] flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-[#07326F]">
                Catálogo de servicios
              </h3>
              <p className="text-[11px] text-slate-500">
                Administrar nombres, precios y duraciones
              </p>
            </div>
          </div>
          <span className="text-xs font-heading font-semibold text-[#07326F]">
            Ver →
          </span>
        </div>

        {/* Compartir Tarjeta Digital */}
        {onOpenShare && (
          <div
            onClick={onOpenShare}
            className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-[#19AA83]/40 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#19AA83]/15 text-[#19AA83] flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-[#07326F]">
                  Mi tarjeta digital y enlace público
                </h3>
                <p className="text-[11px] text-slate-500">
                  Compartir en WhatsApp, redes y ver código QR
                </p>
              </div>
            </div>
            <span className="text-xs font-heading font-semibold text-[#19AA83] shrink-0">
              Compartir →
            </span>
          </div>
        )}

        {/* Mi Plan */}
        <div
          onClick={() => onNavigate('plan-manager')}
          className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-[#19AA83]/40 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#19AA83]/15 text-[#19AA83] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-sm text-[#07326F]">
                  Mi plan
                </h3>
                <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full bg-[#19AA83]/15 text-[#19AA83]">
                  {planLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Límite de 5 clientes · Activa PRO para clientes ilimitados
              </p>
            </div>
          </div>
          <span className="text-xs font-heading font-semibold text-[#19AA83]">
            Gestionar →
          </span>
        </div>

        {/* Audio Tutorial Button */}
        <div
          onClick={onOpenTutorial}
          className="p-4 bg-[#F9D785]/20 rounded-2xl border border-[#F9D785]/60 shadow-2xs hover:bg-[#F9D785]/30 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#07326F] flex items-center justify-center shadow-2xs">
              <Volume2 className="w-5 h-5 text-[#19AA83]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-[#07326F]">
                Audio recorrido guiado
              </h3>
              <p className="text-[11px] text-slate-600">
                Escucha la explicación paso a paso de ChambaApp
              </p>
            </div>
          </div>
          <span className="text-xs font-heading font-semibold text-[#07326F]">
            Reproducir ▶
          </span>
        </div>
      </div>

      {/* Conectar Mercado Pago (Sección 57) */}
      <Card className="p-4 bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2.5">
          <CreditCard className="w-4 h-4 text-[#07326F]" />
          <h3 className="font-heading font-bold text-sm text-[#07326F]">
            Métodos de cobro: Mercado Pago
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          “Conecta tu cuenta de Mercado Pago para recibir pagos directamente de tus clientes.”
        </p>

        {mpConnected ? (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Cuenta conectada exitosamente (Modo prueba activo).</span>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={isSaving}
            onClick={handleConnectMercadoPago}
            icon={<ExternalLink className="w-3.5 h-3.5 text-[#07326F]" />}
          >
            Conectar Mercado Pago
          </Button>
        )}
      </Card>

      {/* Support & Help Banner */}
      <div className="p-3.5 bg-slate-100 rounded-2xl text-xs text-slate-600 space-y-1">
        <span className="font-heading font-semibold text-[#07326F] block">
          ¿Necesitas ayuda con ChambaApp?
        </span>
        <p className="text-[11px] text-slate-500">
          Escríbenos directamente para soporte o sugerencias a:
        </p>
        <a
          href={`mailto:${platformConfig.supportEmail}`}
          className="font-mono text-xs font-semibold text-[#07326F] underline block"
        >
          {platformConfig.supportEmail}
        </a>
      </div>

      {/* Account Settings / Logout */}
      <div className="pt-2 space-y-2">
        <Button
          variant="secondary"
          size="md"
          onClick={loadDemoData}
          icon={<RotateCcw className="w-4 h-4 text-[#07326F]" />}
        >
          Cargar datos de ejemplo para pruebas
        </Button>

        <Button
          variant="outline"
          size="md"
          onClick={signOut}
          icon={<LogOut className="w-4 h-4 text-slate-600" />}
        >
          Cerrar sesión
        </Button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full text-center text-xs text-slate-400 hover:text-rose-600 py-1.5 cursor-pointer font-medium"
        >
          Eliminar cuenta
        </button>

        {/* Legal & Compliance Links for Google Play */}
        {onOpenLegal && (
          <div className="pt-2 flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <button
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-[#07326F] hover:underline cursor-pointer"
            >
              Política de Privacidad
            </button>
            <span>·</span>
            <button
              onClick={() => onOpenLegal('terms')}
              className="hover:text-[#07326F] hover:underline cursor-pointer"
            >
              Términos del Servicio
            </button>
          </div>
        )}
      </div>

      {/* Delete Account Modal (Section 34) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 space-y-3">
            <h3 className="font-heading font-bold text-base text-rose-700">
              ¿Eliminar cuenta?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Esta acción es irreversible y eliminará todos tus registros, servicios y clientes asociados.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  signOut();
                }}
                className="text-rose-600 border-rose-300 hover:bg-rose-50"
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
