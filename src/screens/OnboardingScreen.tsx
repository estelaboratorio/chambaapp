import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ChambaLogo } from '../components/ChambaLogo';
import { Check, ArrowRight, ArrowLeft, Clock, DollarSign, Calendar, Sparkles } from 'lucide-react';
import { Business, Service, Subscription } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveBusiness, saveService, saveSubscription } from '../services/firebaseService';
import { ShareBusinessModal } from '../components/ShareBusinessModal';

interface OnboardingScreenProps {
  onFinish: (newBusiness?: Business, newService?: Service) => void;
  onBackToWelcome: () => void;
}

const chambaTypes = [
  { id: 'Limpieza', label: 'Limpieza', icon: '🧹', example: 'Limpieza del hogar' },
  { id: 'Reparaciones', label: 'Reparaciones', icon: '🔧', example: 'Reparación plomería/eléctrica' },
  { id: 'Paseo de perros', label: 'Paseo de perros', icon: '🐶', example: 'Paseo individual 1 hr' },
  { id: 'Belleza', label: 'Belleza', icon: '💅', example: 'Manicura a domicilio' },
  { id: 'Clases', label: 'Clases', icon: '📚', example: 'Clase particular' },
  { id: 'Jardinería', label: 'Jardinería', icon: '🌱', example: 'Mantenimiento de jardín' },
  { id: 'Otro', label: 'Otro', icon: '➕', example: 'Servicios independientes' },
];

const daysList = [
  { id: 'Lun', label: 'Lun' },
  { id: 'Mar', label: 'Mar' },
  { id: 'Mié', label: 'Mié' },
  { id: 'Jue', label: 'Jue' },
  { id: 'Vie', label: 'Vie' },
  { id: 'Sáb', label: 'Sáb' },
  { id: 'Dom', label: 'Dom' },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onFinish,
  onBackToWelcome,
}) => {
  const { currentUser, userProfile, refreshBusinessData } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<string>('Limpieza');
  const defaultInitialBizName = userProfile?.name ? `Servicios de ${userProfile.name}` : '';
  const [businessName, setBusinessName] = useState<string>(defaultInitialBizName);
  const [serviceName, setServiceName] = useState<string>('Limpieza del hogar');
  const [servicePrice, setServicePrice] = useState<number>(500);
  const [serviceDuration, setServiceDuration] = useState<number>(180);
  
  // Interactive working days
  const [selectedDays, setSelectedDays] = useState<string[]>(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']);
  
  // Interactive working hours (24h for native pickers)
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('18:00');

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdBusiness, setCreatedBusiness] = useState<Business | null>(null);
  const [createdService, setCreatedService] = useState<Service | null>(null);

  // Helper to format time into 12h readable string
  const formatTime12 = (time24: string) => {
    if (!time24) return '9:00 AM';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m < 10 ? '0' + m : m} ${ampm}`;
  };

  const getDaysSummary = () => {
    if (selectedDays.length === 7) return 'Toda la semana (Lun a Dom)';
    if (selectedDays.length === 6 && !selectedDays.includes('Dom')) return 'Lunes a sábado';
    if (selectedDays.length === 5 && !selectedDays.includes('Sáb') && !selectedDays.includes('Dom')) return 'Lunes a viernes';
    if (selectedDays.length === 2 && selectedDays.includes('Sáb') && selectedDays.includes('Dom')) return 'Fines de semana';
    if (selectedDays.length === 0) return 'Por definir';
    return selectedDays.join(', ');
  };

  const displayDays = getDaysSummary();
  const displayHours = `${formatTime12(startTime)} — ${formatTime12(endTime)}`;

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) return; // keep at least 1 day
      setSelectedDays(prev => prev.filter(d => d !== dayId));
    } else {
      setSelectedDays(prev => [...prev, dayId]);
    }
  };

  const handleNextStep = async () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsSubmitting(true);
      try {
        const now = new Date().toISOString();
        const ownerId = currentUser?.uid || userProfile?.id || `usr_${Date.now()}`;
        const businessId = `biz_${ownerId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 14)}`;

        const registeredPrimaryName = serviceName.trim() || 'Servicio principal';
        const finalBizName = businessName.trim() || (userProfile?.name ? `Servicios de ${userProfile.name}` : `${selectedType} Profesional`);

        const business: Business = {
          id: businessId,
          ownerId,
          name: finalBizName,
          category: selectedType,
          primaryService: registeredPrimaryName,
          defaultPrice: servicePrice || 500,
          description: `Servicios profesionales de ${selectedType.toLowerCase()}. Horario: ${displayDays}, ${displayHours}.`,
          city: 'Ciudad de México',
          phone: userProfile?.phone || '55 1234 5678',
          whatsapp: userProfile?.phone || '55 1234 5678',
          createdAt: now,
          updatedAt: now,
        };

        const service: Service = {
          id: `srv_${Date.now()}`,
          businessId,
          name: registeredPrimaryName,
          basePrice: servicePrice || 500,
          durationMinutes: serviceDuration || 180,
          active: true,
          isPrimary: true, // EXPLICIT PRIMARY SERVICE DEFINED BY USER
          priority: 1,     // PRIORITY #1
          createdAt: now,
          updatedAt: now,
        };

        const sub: Subscription = {
          id: `sub_${businessId}`,
          userId: ownerId,
          businessId,
          plan: 'free',
          status: 'active',
          currency: 'MXN',
          amount: 0,
          createdAt: now,
          updatedAt: now,
        };

        setCreatedBusiness(business);
        setCreatedService(service);

        // Immediate persistence to localStorage so data is NEVER lost even on browser refresh
        try {
          localStorage.setItem('chamba_custom_business', JSON.stringify(business));
          localStorage.setItem(`chamba_services_${businessId}`, JSON.stringify([service]));
        } catch {}

        // Attempt Firestore save if user or connection is active
        try {
          if (currentUser) {
            await saveBusiness(business);
            await saveService(businessId, service);
            await saveSubscription(businessId, sub);
            await refreshBusinessData();
          }
        } catch (dbErr) {
          console.warn('Firestore write warning:', dbErr);
        }

        setIsSuccess(true);
      } catch (err) {
        console.error('Error in onboarding:', err);
        setIsSuccess(true);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSkipToHome = async () => {
    const now = new Date().toISOString();
    const ownerId = currentUser?.uid || userProfile?.id || `usr_${Date.now()}`;
    const businessId = `biz_${ownerId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 14)}`;

    const registeredPrimaryName = serviceName.trim() || 'Servicio principal';
    const finalBizName = businessName.trim() || (userProfile?.name ? `Servicios de ${userProfile.name}` : `${selectedType} Profesional`);

    const business: Business = createdBusiness || {
      id: businessId,
      ownerId,
      name: finalBizName,
      category: selectedType,
      primaryService: registeredPrimaryName,
      defaultPrice: servicePrice || 500,
      description: `Servicios profesionales de ${selectedType.toLowerCase()}.`,
      city: 'Ciudad de México',
      phone: userProfile?.phone || '55 1234 5678',
      whatsapp: userProfile?.phone || '55 1234 5678',
      createdAt: now,
      updatedAt: now,
    };

    const service: Service = createdService || {
      id: `srv_${Date.now()}`,
      businessId,
      name: registeredPrimaryName,
      basePrice: servicePrice || 500,
      durationMinutes: serviceDuration || 180,
      active: true,
      isPrimary: true,
      priority: 1,
      createdAt: now,
      updatedAt: now,
    };

    try {
      localStorage.setItem('chamba_custom_business', JSON.stringify(business));
      localStorage.setItem(`chamba_services_${businessId}`, JSON.stringify([service]));
    } catch {}

    onFinish(business, service);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBackToWelcome();
    }
  };

  if (isSuccess && createdBusiness) {
    return (
      <ShareBusinessModal
        businessName={createdBusiness.name}
        category={createdBusiness.category}
        primaryService={createdService?.name || serviceName}
        defaultPrice={createdService?.basePrice || servicePrice}
        services={createdService ? [createdService] : []}
        phone={createdBusiness.phone || createdBusiness.whatsapp}
        onClose={() => onFinish(createdBusiness, createdService || undefined)}
        isFullPage={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-between p-5 max-w-md mx-auto">
      {/* Top Header / Progress Indicator & Skip Action */}
      <div>
        <div className="flex items-center justify-between pt-2 mb-4">
          <button
            onClick={handlePrevStep}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#07326F] hover:bg-slate-200/60 active:scale-95 transition-all cursor-pointer"
            aria-label="Atrás"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === currentStep
                    ? 'w-7 bg-[#07326F]'
                    : step < currentStep
                    ? 'w-4 bg-[#19AA83]'
                    : 'w-4 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleSkipToHome}
            className="text-xs font-heading font-semibold text-[#07326F] hover:underline cursor-pointer"
          >
            Saltar e ir a Inicio →
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-6">
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#07326F] leading-tight">
            Vamos a preparar tu ChambaApp
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Solo necesitamos algunos datos para comenzar.
          </p>
        </div>

        {/* STEP 1: ¿Qué tipo de chamba haces? */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-sm text-[#07326F]">
              Paso 1: ¿Qué tipo de chamba haces?
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {chambaTypes.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setSelectedType(type.id);
                      setServiceName(type.example);
                      if (!businessName || businessName === 'Servicios de Limpieza Ana') {
                        setBusinessName(userProfile?.name ? `${type.label} ${userProfile.name}` : `Servicios de ${type.label}`);
                      }
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-2 border-[#07326F] shadow-sm text-[#07326F]'
                        : 'bg-white/80 border border-slate-200/80 hover:bg-white text-slate-700'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-xs truncate">
                        {type.label}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#19AA83] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: ¿Cómo quieres que aparezca tu negocio? */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-sm text-[#07326F]">
              Paso 2: ¿Cómo quieres que aparezca tu negocio?
            </h2>

            <Card className="p-4 bg-white border border-slate-200">
              <label className="block text-xs font-heading font-medium text-slate-500 mb-2">
                Nombre de tu negocio o servicio
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={userProfile?.name ? `Ej. ${selectedType} ${userProfile.name}` : `Ej. ${selectedType} Pro, Mi Taller`}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] font-heading font-semibold text-base text-[#07326F] bg-slate-50/50"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                Así aparecerá en tus recibos digitales y al compartir citas con tus clientes.
              </p>
            </Card>

            <div className="bg-[#F9D785]/20 p-3.5 rounded-xl border border-[#F9D785]/50 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#07326F] shrink-0 mt-0.5" />
              <p className="text-xs text-[#07326F]">
                Tip: Un nombre claro genera confianza inmediata desde el primer contacto.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: ¿Qué servicio ofreces? */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-sm text-[#07326F]">
              Paso 3: ¿Qué servicio ofreces? (Servicio principal)
            </h2>

            <Card className="p-4 bg-white border border-slate-200 space-y-3.5">
              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1.5">
                  Servicio principal (Prioridad 1)
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder={`Ej. ${selectedType === 'Limpieza' ? 'Limpieza profunda' : 'Servicio principal'}`}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-medium text-[#07326F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-heading font-medium text-slate-500 mb-1.5">
                    Precio base
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-semibold text-[#07326F] font-heading"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-heading font-medium text-slate-500 mb-1.5">
                    Duración (min)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={serviceDuration}
                      onChange={(e) => setServiceDuration(Number(e.target.value))}
                      placeholder="180"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-medium text-[#07326F]"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 4: ¿Cuándo trabajas? */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-sm text-[#07326F]">
              Paso 4: ¿Cuándo trabajas? (Días y Horarios)
            </h2>

            <Card className="p-4 bg-white border border-slate-200 space-y-4">
              {/* Días disponibles interactivos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-heading font-medium text-slate-500">
                    Días disponibles
                  </label>
                  <span className="text-[11px] font-semibold text-[#19AA83]">
                    {displayDays}
                  </span>
                </div>

                {/* Day of week buttons */}
                <div className="grid grid-cols-7 gap-1.5 mb-2.5">
                  {daysList.map((d) => {
                    const isSelected = selectedDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDay(d.id)}
                        className={`py-2 text-xs font-heading font-bold rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#07326F] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedDays(['Lun', 'Mar', 'Mié', 'Jue', 'Vie'])}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Lun a Vie
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDays(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'])}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Lun a Sáb
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDays(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'])}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Toda la semana
                  </button>
                </div>
              </div>

              {/* Horario de atención con selectores de hora nativos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-heading font-medium text-slate-500">
                    Horario de atención
                  </label>
                  <span className="text-[11px] font-semibold text-[#07326F]">
                    {displayHours}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Hora de inicio
                    </span>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-[#19AA83] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full pl-9 pr-2 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs font-semibold text-[#07326F] bg-slate-50 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Hora de cierre
                    </span>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-[#07326F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full pl-9 pr-2 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs font-semibold text-[#07326F] bg-slate-50 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick hour presets */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStartTime('09:00');
                      setEndTime('18:00');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    9:00 AM — 6:00 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStartTime('08:00');
                      setEndTime('16:00');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    8:00 AM — 4:00 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStartTime('08:00');
                      setEndTime('20:00');
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    8:00 AM — 8:00 PM
                  </button>
                </div>
              </div>
            </Card>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5 shadow-2xs">
              <p className="font-heading font-semibold text-[#07326F] flex items-center justify-between">
                <span>{businessName}</span>
                <span className="text-[#19AA83] font-bold">${servicePrice}</span>
              </p>
              <p className="text-slate-500">
                {serviceName} · {serviceDuration} min · {selectedType}
              </p>
              <p className="text-[11px] text-slate-400">
                {displayDays} · {displayHours}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action CTA & Navigation Buttons */}
      <div className="pt-6 pb-2 space-y-2.5">
        {currentStep < 4 ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleNextStep}
            icon={<ArrowRight className="w-4 h-4 text-[#F9D785]" />}
          >
            Continuar al paso siguiente
          </Button>
        ) : (
          <Button
            variant="positive"
            size="lg"
            disabled={isSubmitting}
            onClick={handleNextStep}
            icon={<Check className="w-5 h-5 text-white" />}
          >
            {isSubmitting ? 'Guardando...' : 'Crear mi ChambaApp'}
          </Button>
        )}

        {/* Back navigation button */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handlePrevStep}
            className="flex items-center gap-1.5 text-xs font-heading font-semibold text-slate-600 hover:text-[#07326F] py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver {currentStep > 1 ? 'al paso anterior' : 'al inicio'}</span>
          </button>

          <button
            type="button"
            onClick={handleSkipToHome}
            className="text-xs font-heading font-medium text-slate-400 hover:text-[#07326F] py-2 px-2 cursor-pointer"
          >
            Saltar e ir a Inicio →
          </button>
        </div>
      </div>
    </div>
  );
};
