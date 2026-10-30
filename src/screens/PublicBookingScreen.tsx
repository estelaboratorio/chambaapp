import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  CheckCircle2, 
  ArrowLeft, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  MessageCircle,
  Home,
  Check
} from 'lucide-react';
import { Business, Service, Appointment } from '../types';
import { 
  getPublicBusinessProfile, 
  getPublicServices, 
  getPublicAppointments, 
  createPublicAppointment 
} from '../services/firebaseService';
import { ChambaLogo } from '../components/ChambaLogo';

interface PublicBookingScreenProps {
  userId: string;
  initialServiceId?: string;
  onBackToCard: () => void;
  onGoToAppHome?: () => void;
}

const AVAILABLE_TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export const PublicBookingScreen: React.FC<PublicBookingScreenProps> = ({
  userId,
  initialServiceId,
  onBackToCard,
  onGoToAppHome,
}) => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Tomorrow as default recommendation
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const cleanUserId = userId || 'demo';

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const biz = await getPublicBusinessProfile(cleanUserId);
        if (!isMounted) return;
        setBusiness(biz);

        if (biz) {
          const [srvs, apts] = await Promise.all([
            getPublicServices(biz.id),
            getPublicAppointments(biz.id),
          ]);
          if (!isMounted) return;
          setServices(srvs);
          setExistingAppointments(apts);

          if (initialServiceId && srvs.some(s => s.id === initialServiceId)) {
            setSelectedServiceId(initialServiceId);
          } else if (srvs.length > 0) {
            const primary = srvs.find(s => s.isPrimary) || srvs[0];
            setSelectedServiceId(primary.id);
          }
        }
      } catch (err) {
        console.warn('Error loading public booking data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [cleanUserId, initialServiceId]);

  const selectedService = services.find(s => s.id === selectedServiceId) || services[0];

  // Helper to determine if a time slot is already booked for the selected date
  const isSlotBooked = (timeStr: string) => {
    return existingAppointments.some(apt => {
      if (apt.status === 'cancelled') return false;
      const sameDate = apt.dateISO === selectedDate || apt.date === selectedDate;
      const cleanSlot = timeStr.replace(/\s/g, '');
      const aptSlot = (apt.startTime || '').replace(/\s/g, '');
      return sameDate && aptSlot.startsWith(cleanSlot);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!clientName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!clientPhone.trim() || clientPhone.replace(/\D/g, '').length < 8) {
      setErrorMsg('Por favor ingresa un número de teléfono o WhatsApp válido.');
      return;
    }
    if (!clientAddress.trim()) {
      setErrorMsg('Por favor indica la dirección o colonia donde se realizará el servicio.');
      return;
    }
    if (!selectedService) {
      setErrorMsg('Por favor selecciona el servicio que deseas solicitar.');
      return;
    }

    if (isSlotBooked(selectedTime)) {
      setErrorMsg(`El horario de las ${selectedTime} ya está ocupado para esta fecha. Por favor elige otro horario disponible.`);
      return;
    }

    setSubmitting(true);
    try {
      const bizId = business?.id || `biz_${cleanUserId}`;
      const now = new Date().toISOString();
      const newAptId = `apt_pub_${Date.now()}`;
      const newClientId = `cli_pub_${Date.now()}`;

      const newAppointment: Appointment = {
        id: newAptId,
        businessId: bizId,
        clientId: newClientId,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: selectedDate,
        dateISO: selectedDate,
        startTime: `${selectedTime} hrs`,
        durationMinutes: selectedService.durationMinutes || 120,
        price: selectedService.basePrice,
        status: 'pending',
        address: clientAddress.trim(),
        notes: notes.trim() || 'Cita registrada en línea por el cliente',
        createdAt: now,
        updatedAt: now,
      };

      await createPublicAppointment(bizId, newAppointment);
      setConfirmedAppointment(newAppointment);
    } catch (err: any) {
      console.error('Error creating public appointment:', err);
      setErrorMsg('Ocurrió un error al agendar tu cita. Por favor intenta de nuevo o comunícate por WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWhatsAppConfirmation = () => {
    if (!confirmedAppointment || !business) return;
    const rawPhone = business.whatsapp || business.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const msg = `¡Hola ${business.name}! Acabo de solicitar una cita en tu ChambaApp:\n\n` +
      `📅 *Fecha:* ${confirmedAppointment.date}\n` +
      `⏰ *Hora:* ${confirmedAppointment.startTime}\n` +
      `🛠️ *Servicio:* ${confirmedAppointment.serviceName} ($${confirmedAppointment.price} MXN)\n` +
      `👤 *Cliente:* ${confirmedAppointment.clientName}\n` +
      `📍 *Dirección:* ${confirmedAppointment.address || 'A convenir'}\n` +
      (confirmedAppointment.notes ? `📝 *Notas:* ${confirmedAppointment.notes}\n\n` : '\n') +
      `¿Podrías confirmarme si está todo en orden? ¡Gracias!`;

    const waUrl = `https://wa.me/${cleanPhone ? (cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone) : ''}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#07326F]/20 border-t-[#07326F] rounded-full animate-spin mb-4" />
        <p className="text-sm font-heading font-medium text-[#07326F]">Cargando agenda de citas...</p>
      </div>
    );
  }

  const effectiveBiz = business || {
    id: `biz_${cleanUserId}`,
    ownerId: cleanUserId,
    name: 'Servicios Profesionales',
    category: 'Servicios a Domicilio',
    city: 'Ciudad de México',
    phone: '55 1234 5678',
    whatsapp: '55 1234 5678',
    createdAt: '',
    updatedAt: '',
  };

  // SUCCESS CONFIRMATION VIEW
  if (confirmedAppointment) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-[11px] font-heading font-bold text-[#19AA83] uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Cita solicitada con éxito
            </span>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#07326F] mt-2">
              ¡Gracias, {confirmedAppointment.clientName}!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Tu solicitud fue enviada a <strong>{effectiveBiz.name}</strong>.
            </p>
          </div>

          {/* Appointment Summary Box */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Servicio solicitado:</span>
              <span className="font-heading font-bold text-[#07326F]">{confirmedAppointment.serviceName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Fecha:</span>
              <span className="font-medium text-slate-800">{confirmedAppointment.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Horario:</span>
              <span className="font-medium text-slate-800">{confirmedAppointment.startTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ubicación:</span>
              <span className="font-medium text-slate-800 truncate max-w-[180px]">{confirmedAppointment.address}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="font-heading font-semibold text-slate-700">Precio estimado:</span>
              <span className="font-heading font-bold text-[#19AA83] text-sm">${confirmedAppointment.price} MXN</span>
            </div>
          </div>

          {/* Quick WhatsApp Action to notify provider */}
          <div className="space-y-2">
            <button
              onClick={handleSendWhatsAppConfirmation}
              className="w-full py-3 px-4 rounded-xl bg-[#25D366] text-white font-heading font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#20ba59] active:scale-[0.99] transition-all shadow-md cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Avisar al profesional por WhatsApp</span>
            </button>

            <button
              onClick={onBackToCard}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-heading font-semibold text-xs hover:bg-slate-200 transition-all cursor-pointer"
            >
              Volver a la tarjeta digital
            </button>
          </div>

          <p className="text-[10px] text-slate-400">
            El pago se realiza directamente con el profesional al término o anticipo acordado.
          </p>
        </div>
      </div>
    );
  }

  // BOOKING FORM VIEW
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col items-center pb-16">
      {/* Top Header */}
      <header className="w-full bg-[#07326F] text-white py-4 px-4 shadow-md sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onBackToCard}
            className="flex items-center gap-1.5 text-xs font-heading font-semibold text-white/90 hover:text-white bg-white/10 px-3 py-1.5 rounded-full transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver tarjeta</span>
          </button>

          <div className="flex items-center gap-1.5">
            <ChambaLogo variant="icon" size="sm" />
            <span className="font-heading font-bold text-xs">Agendar Cita</span>
          </div>

          {onGoToAppHome && (
            <button
              onClick={onGoToAppHome}
              className="text-xs bg-white text-[#07326F] font-heading font-semibold px-2.5 py-1 rounded-full shadow-xs cursor-pointer"
            >
              App
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-md px-4 py-5 space-y-4">
        {/* Business Preview Badge */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#07326F] to-[#19AA83] text-white flex items-center justify-center font-heading font-bold text-lg shrink-0">
            {effectiveBiz.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className="font-heading font-bold text-sm text-[#07326F] truncate">
              {effectiveBiz.name}
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-[#19AA83] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{effectiveBiz.category} • Agenda abierta</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Select Service */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#07326F] text-white flex items-center justify-center text-[10px]">1</span>
                <span>Selecciona el servicio</span>
              </span>
              <span className="text-[11px] text-slate-400">Requerido</span>
            </div>

            <div className="space-y-2">
              {services.map((srv) => (
                <label
                  key={srv.id}
                  onClick={() => setSelectedServiceId(srv.id)}
                  className={`block p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedServiceId === srv.id
                      ? 'border-[#07326F] bg-blue-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedServiceId === srv.id ? 'border-[#07326F] bg-[#07326F]' : 'border-slate-300'
                      }`}>
                        {selectedServiceId === srv.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <span className="font-heading font-semibold text-xs text-[#07326F] block">
                          {srv.name}
                        </span>
                        {srv.durationMinutes && (
                          <span className="text-[10px] text-slate-400">
                            Aprox. {srv.durationMinutes >= 60 ? `${Math.round(srv.durationMinutes / 60)} hrs` : `${srv.durationMinutes} min`}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-heading font-bold text-xs text-[#19AA83]">
                      ${srv.basePrice} MXN
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Step 2: Date & Time Slot */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#07326F] text-white flex items-center justify-center text-[10px]">2</span>
                <span>Fecha y Horario disponible</span>
              </span>
            </div>

            {/* Date Input */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 block">
                Fecha del servicio:
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#07326F]/20 focus:border-[#07326F]"
                required
              />
            </div>

            {/* Time Slot Picker with conflict checking */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 block">
                  Horario de inicio:
                </label>
                <span className="text-[10px] text-slate-400">Verificado en tiempo real</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 pt-1">
                {AVAILABLE_TIME_SLOTS.map((time) => {
                  const booked = isSlotBooked(time);
                  const isSelected = selectedTime === time;

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={booked}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-1 rounded-xl text-xs font-heading transition-all cursor-pointer ${
                        booked
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-[#07326F] text-white font-bold shadow-xs'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                      title={booked ? 'Horario ya ocupado' : 'Disponible'}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 3: Contact & Location Info */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#07326F] text-white flex items-center justify-center text-[10px]">3</span>
              <span>Tus datos de contacto</span>
            </span>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Tu nombre completo:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. Roberto Gómez"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#07326F]/20 focus:border-[#07326F]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Teléfono / WhatsApp:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ej. 55 1234 5678"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#07326F]/20 focus:border-[#07326F]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Dirección o colonia para el servicio:
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Ej. Calle Palmas 123, Col. del Valle"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#07326F]/20 focus:border-[#07326F]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Notas adicionales (opcional):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Llevar escalera, timbre descompuesto, etc."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#07326F]/20 focus:border-[#07326F]"
                />
              </div>
            </div>
          </div>

          {/* Pricing Summary & Submit */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
              <span className="text-slate-500">Total estimado:</span>
              <span className="font-heading font-bold text-lg text-[#19AA83]">
                ${selectedService?.basePrice || 500} MXN
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#07326F] to-[#0c448f] text-white font-heading font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Registrando tu cita...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#F9D785]" />
                  <span>Confirmar y Solicitar Cita</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              Sin comisiones para ti. Acuerda los detalles directamente con el profesional.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
