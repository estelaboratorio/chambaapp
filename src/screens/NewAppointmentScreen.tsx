import React, { useState, useMemo } from 'react';
import { 
  Check, 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  Plus, 
  ShieldAlert, 
  UserCheck, 
  Timer,
  AlertTriangle 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Appointment, Client, Service, Screen } from '../types';
import { checkAppointmentConflict, saveAppointment, saveClient } from '../services/firebaseService';
import { 
  isPastDateTime, 
  checkScheduleConflict, 
  formatMinutesToTime12h, 
  parseTimeToMinutes 
} from '../utils/schedulingValidation';
import { useAuth } from '../context/AuthContext';
import { FreemiumLimitModal } from '../components/FreemiumLimitModal';

interface NewAppointmentScreenProps {
  businessId: string;
  clients: Client[];
  services: Service[];
  appointments?: Appointment[];
  prefilledClient?: Client | null;
  onRefresh: () => Promise<void>;
  onNavigate: (screen: Screen) => void;
  onAddAppointment?: (appointment: Appointment) => void;
}

export const NewAppointmentScreen: React.FC<NewAppointmentScreenProps> = ({
  businessId,
  clients,
  services,
  appointments = [],
  prefilledClient,
  onRefresh,
  onNavigate,
  onAddAppointment,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    prefilledClient ? prefilledClient.id : (clients[0]?.id || '')
  );
  const [newClientName, setNewClientName] = useState<string>('');
  const [isAddingNewClient, setIsAddingNewClient] = useState<boolean>(clients.length === 0);

  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');

  // Helper date generators for YYYY-MM-DD
  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysAheadISO = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Interactive native date & time
  const [dateISO, setDateISO] = useState<string>(getTomorrowISO());
  const [timeValue, setTimeValue] = useState<string>('11:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(services[0]?.durationMinutes || 60);

  // Technician / Resource assignment
  const [technician, setTechnician] = useState<string>('Técnico principal');
  const [customTechMode, setCustomTechMode] = useState<boolean>(false);
  const [customTechName, setCustomTechName] = useState<string>('');

  const [price, setPrice] = useState<number>(services[0]?.basePrice || 500);
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCreated, setIsCreated] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Format readable strings
  const formatReadableDate = (isoStr: string) => {
    if (!isoStr) return '';
    try {
      const [y, m, d] = isoStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${days[dateObj.getDay()]} ${d} ${months[dateObj.getMonth()]}`;
    } catch {
      return isoStr;
    }
  };

  const formatReadableTime = (time24: string) => {
    if (!time24) return '11:00 AM';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m < 10 ? '0' + m : m} ${ampm}`;
  };

  const displayFormattedDate = formatReadableDate(dateISO);
  const displayFormattedTime = formatReadableTime(timeValue);

  const effectiveTechnician = customTechMode ? customTechName.trim() : technician;

  // Real-time validation 1: Check if date/time is in the past
  const isPast = useMemo(() => {
    return isPastDateTime(dateISO, timeValue);
  }, [dateISO, timeValue]);

  // Real-time validation 2: Conflict & overlap detection with technician and schedule
  const conflictCheck = useMemo(() => {
    return checkScheduleConflict(appointments, {
      dateISO,
      startTime: timeValue,
      durationMinutes,
      technician: effectiveTechnician || undefined,
    });
  }, [appointments, dateISO, timeValue, durationMinutes, effectiveTechnician]);

  // Calculate estimated end time
  const calculatedEndTime = useMemo(() => {
    const startMins = parseTimeToMinutes(timeValue);
    return formatMinutesToTime12h(startMins + durationMinutes);
  }, [timeValue, durationMinutes]);

  // Update base price & duration when service selection changes
  const handleServiceChange = (srvId: string) => {
    setSelectedServiceId(srvId);
    const found = services.find(s => s.id === srvId);
    if (found) {
      setPrice(found.basePrice);
      if (found.durationMinutes) {
        setDurationMinutes(found.durationMinutes);
      }
    }
  };

  const { userProfile, checkCanAddService, incrementServiciosRealizados, activateProSubscription } = useAuth();
  const [showFreemiumModal, setShowFreemiumModal] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Rule 0: Freemium limit check (5 free services or quotes)
    if (!checkCanAddService()) {
      setShowFreemiumModal(true);
      return;
    }

    // Rule 1: Validate past date/time
    if (isPast) {
      setErrorMsg('No es posible agendar citas en fechas u horarios pasados. Por favor selecciona una fecha y hora futura.');
      return;
    }

    // Rule 2: Overlapping technician conflict
    if (conflictCheck.hasConflict) {
      setErrorMsg(`Conflicto de horario no resuelto: ${conflictCheck.reason}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Resolve Client
      let clientId = selectedClientId;
      let clientName = '';

      if (isAddingNewClient) {
        if (!newClientName.trim()) {
          throw new Error('Por favor escribe el nombre del cliente.');
        }
        clientId = `cli_${Date.now()}`;
        clientName = newClientName.trim();
        const now = new Date().toISOString();
        const newClient: Client = {
          id: clientId,
          businessId: businessId || 'biz_demo_ana',
          name: clientName,
          createdAt: now,
          updatedAt: now,
        };
        try {
          if (businessId && businessId !== 'biz_demo_ana') {
            await saveClient(businessId, newClient);
          }
        } catch (cErr) {
          console.warn('Could not save client to Firestore, proceeding locally:', cErr);
        }
      } else {
        const found = clients.find(c => c.id === selectedClientId);
        if (!found) {
          clientName = 'Cliente general';
        } else {
          clientName = found.name;
        }
      }

      // 2. Resolve Service
      const selectedService = services.find(s => s.id === selectedServiceId);
      const serviceName = selectedService ? selectedService.name : 'Servicio general';

      // 3. Fallback async conflict check against backend
      try {
        if (businessId && businessId !== 'biz_demo_ana') {
          const hasConflict = await checkAppointmentConflict(businessId, displayFormattedDate, displayFormattedTime);
          if (hasConflict && !effectiveTechnician) {
            throw new Error(`Ya tienes una cita registrada para el ${displayFormattedDate} a las ${displayFormattedTime}. Selecciona otro horario o asigna un técnico específico.`);
          }
        }
      } catch (confErr: any) {
        if (confErr.message?.includes('Ya tienes una cita')) {
          throw confErr;
        }
      }

      // 4. Create Appointment with full traceability initial state
      const now = new Date().toISOString();
      const newAppointment: Appointment = {
        id: `apt_${Date.now()}`,
        businessId: businessId || 'biz_demo_ana',
        clientId,
        clientName,
        serviceId: selectedServiceId || 'srv_custom',
        serviceName,
        date: displayFormattedDate,
        dateISO,
        startTime: displayFormattedTime,
        endTime: calculatedEndTime,
        durationMinutes,
        technician: effectiveTechnician || 'Técnico principal',
        price,
        status: 'confirmed',
        notes,
        createdAt: now,
        updatedAt: now,
        history: [
          {
            id: `log_init_${Date.now()}`,
            action: 'created',
            timestamp: now,
            newDate: displayFormattedDate,
            newStartTime: displayFormattedTime,
            newEndTime: calculatedEndTime,
            newTechnician: effectiveTechnician || 'Técnico principal',
            newStatus: 'confirmed',
            notes: 'Cita programada inicialmente',
          }
        ]
      };

      // Add to local state first
      if (onAddAppointment) {
        onAddAppointment(newAppointment);
      }

      // Persist to Firestore
      try {
        if (businessId && businessId !== 'biz_demo_ana') {
          await saveAppointment(businessId, newAppointment);
          await onRefresh();
        }
      } catch (dbErr) {
        console.warn('Firestore save warning, saved to local state:', dbErr);
      }

      // Increment counter of performed services
      try {
        await incrementServiciosRealizados();
      } catch (incErr) {
        console.warn('Could not increment servicios_realizados:', incErr);
      }

      setIsCreated(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo crear la cita. Revisa los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCreated) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#19AA83]/15 text-[#19AA83] flex items-center justify-center mb-5 animate-in zoom-in duration-300">
          <Check className="w-9 h-9 stroke-[3]" />
        </div>

        <h2 className="font-heading font-bold text-2xl text-[#07326F] mb-2">
          ✓ Cita programada con éxito
        </h2>

        <p className="text-sm text-slate-600 max-w-sm mb-4">
          La cita quedó agendada para el <strong className="text-[#07326F]">{displayFormattedDate}</strong> de <strong className="text-[#07326F]">{displayFormattedTime}</strong> a <strong className="text-[#07326F]">{calculatedEndTime}</strong> con el técnico <strong className="text-[#07326F]">{effectiveTechnician || 'Técnico principal'}</strong>.
        </p>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 max-w-sm text-xs text-slate-500 mb-6 text-left">
          <span className="font-semibold text-[#07326F] block mb-1">🛡️ Trazabilidad iniciada:</span>
          Se ha creado el historial de la cita. Cualquier reprogramación o cambio de horario quedará documentado con fecha y motivo sin eliminar registros.
        </div>

        <div className="w-full max-w-xs space-y-3">
          <Button
            variant="positive"
            size="lg"
            onClick={() => onNavigate('appointments')}
            icon={<ArrowRight className="w-4 h-4 text-white" />}
          >
            Ver mis citas
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => onNavigate('home')}
          >
            Ir al Inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Header with back button */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <button
          type="button"
          onClick={() => onNavigate('appointments')}
          className="flex items-center gap-1.5 text-xs font-heading font-semibold text-[#07326F] hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#07326F]" />
          <span>Volver a Mis citas</span>
        </button>
      </div>

      <div className="px-1">
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#07326F]">
          Nueva cita
        </h1>
        <p className="text-xs text-slate-500">
          Programación de servicios con detección de cruces de horario y trazabilidad
        </p>
      </div>

      {/* Real-time Past Date/Time Warning */}
      {isPast && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs shadow-xs animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-heading font-bold text-rose-900 block">Horario en el pasado no permitido</span>
            <span>La fecha ({displayFormattedDate}) y hora ({displayFormattedTime}) ya transcurrieron. Selecciona una fecha u hora presente o futura.</span>
          </div>
        </div>
      )}

      {/* Real-time Overlap Conflict Alert */}
      {conflictCheck.hasConflict && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs shadow-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-heading font-bold text-amber-950 block">⚠️ Solapamiento de horario detectado</span>
            <p className="text-amber-900">{conflictCheck.reason}</p>
            <p className="text-[11px] text-amber-700">
              Ventana ocupada: <strong>{conflictCheck.conflictingTimeRange}</strong>. Cambia el horario o reasigna a otro técnico para evitar empalmes.
            </p>
          </div>
        </div>
      )}

      {errorMsg && !isPast && !conflictCheck.hasConflict && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4 bg-white border border-slate-200 space-y-4">
          {/* Cliente selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-heading font-medium text-slate-500">
                Cliente
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewClient(!isAddingNewClient)}
                className="text-[11px] font-heading font-semibold text-[#19AA83] hover:underline cursor-pointer flex items-center gap-1"
              >
                {isAddingNewClient ? 'Seleccionar existente' : '+ Nuevo cliente'}
              </button>
            </div>

            {isAddingNewClient ? (
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nombre completo del cliente"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-semibold text-[#07326F] bg-slate-50/50"
                  autoFocus
                />
              </div>
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

          {/* Servicio selector */}
          <div>
            <label className="block text-xs font-heading font-medium text-slate-500 mb-1.5">
              Servicio
            </label>
            {services.length > 0 ? (
              <select
                value={selectedServiceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-medium text-[#07326F] bg-slate-50/50"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (${s.basePrice} · {s.durationMinutes} min)
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                defaultValue="Limpieza del hogar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-[#07326F] bg-slate-50/50"
              />
            )}
          </div>

          {/* Técnico o Recurso asignado (Regla 1: Conflicto de recursos) */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-heading font-semibold text-[#07326F] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#19AA83]" />
                <span>Técnico o Recurso asignado</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setCustomTechMode(!customTechMode);
                  if (!customTechMode && !customTechName) setCustomTechName('Técnico 2 (Carlos)');
                }}
                className="text-[11px] font-heading font-semibold text-[#19AA83] hover:underline cursor-pointer"
              >
                {customTechMode ? 'Elegir de lista' : '+ Escribir otro'}
              </button>
            </div>

            {customTechMode ? (
              <input
                type="text"
                value={customTechName}
                onChange={(e) => setCustomTechName(e.target.value)}
                placeholder="Nombre del técnico o equipo..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs font-semibold text-[#07326F] bg-white"
              />
            ) : (
              <select
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs font-semibold text-[#07326F] bg-white"
              >
                <option value="Técnico principal">Técnico principal (Propietario)</option>
                <option value="Carlos Mendoza (Técnico 1)">Carlos Mendoza (Técnico 1)</option>
                <option value="Luis Morales (Técnico 2)">Luis Morales (Técnico 2)</option>
                <option value="Equipo Cuadrilla A">Equipo Cuadrilla A</option>
              </select>
            )}
            <p className="text-[10px] text-slate-500">
              El sistema verificará si este técnico tiene cruces de horario con otras citas en el mismo día.
            </p>
          </div>

          {/* Fecha con Calendario Interactivo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-heading font-medium text-slate-500">
                Fecha de la cita
              </label>
              <span className={`text-[11px] font-semibold ${isPast ? 'text-rose-600' : 'text-[#19AA83]'}`}>
                {displayFormattedDate}
              </span>
            </div>

            <div className="relative">
              <Calendar className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isPast ? 'text-rose-500' : 'text-[#19AA83]'}`} />
              <input
                type="date"
                required
                value={dateISO}
                min={getTodayISO()}
                onChange={(e) => setDateISO(e.target.value)}
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border focus:outline-hidden text-sm font-semibold cursor-pointer ${
                  isPast 
                    ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-600' 
                    : 'border-slate-200 bg-slate-50/70 text-[#07326F] focus:border-[#07326F]'
                }`}
              />
            </div>

            {/* Quick date presets */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <button
                type="button"
                onClick={() => setDateISO(getTodayISO())}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setDateISO(getTomorrowISO())}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Mañana
              </button>
              <button
                type="button"
                onClick={() => setDateISO(getDaysAheadISO(2))}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                En 2 días
              </button>
              <button
                type="button"
                onClick={() => setDateISO(getDaysAheadISO(3))}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                En 3 días
              </button>
            </div>
          </div>

          {/* Hora y Duración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Hora de inicio */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-heading font-medium text-slate-500">
                  Hora de inicio
                </label>
                <span className={`text-[11px] font-semibold ${isPast ? 'text-rose-600' : 'text-[#07326F]'}`}>
                  {displayFormattedTime}
                </span>
              </div>

              <div className="relative">
                <Clock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isPast ? 'text-rose-500' : 'text-[#07326F]'}`} />
                <input
                  type="time"
                  required
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border focus:outline-hidden text-sm font-semibold cursor-pointer ${
                    isPast 
                      ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-600' 
                      : 'border-slate-200 bg-slate-50/70 text-[#07326F] focus:border-[#07326F]'
                  }`}
                />
              </div>

              {/* Quick time presets */}
              <div className="flex items-center gap-1 flex-wrap mt-2">
                {['09:00', '11:00', '14:00', '16:00'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeValue(t)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    {formatReadableTime(t)}
                  </button>
                ))}
              </div>
            </div>

            {/* Duración estimada */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-heading font-medium text-slate-500">
                  Duración
                </label>
                <span className="text-[11px] font-semibold text-slate-600">
                  Hasta las {calculatedEndTime}
                </span>
              </div>

              <div className="relative">
                <Timer className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-medium text-[#07326F] bg-slate-50/70"
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora (60 min)</option>
                  <option value={90}>1 hora y media (90 min)</option>
                  <option value={120}>2 horas (120 min)</option>
                  <option value={180}>3 horas (180 min)</option>
                </select>
              </div>

              <span className="text-[10px] text-slate-400 block mt-1.5">
                Ventana: {displayFormattedTime} – {calculatedEndTime}
              </span>
            </div>
          </div>

          {/* Precio modificado para esta cita */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-heading font-medium text-slate-500">
                Precio para esta cita
              </label>
              <span className="text-[10px] text-slate-400">
                (Afecta solo esta cita)
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                $
              </span>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-bold text-[#07326F] font-heading bg-slate-50/50"
              />
            </div>
          </div>

          {/* Nota */}
          <div>
            <label className="block text-xs font-heading font-medium text-slate-500 mb-1.5">
              Nota (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre materiales, acceso o requerimientos..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-slate-700 bg-slate-50/50 resize-none"
            />
          </div>
        </Card>

        <div className="pt-2 space-y-2">
          <Button
            type="submit"
            variant="positive"
            size="lg"
            disabled={isSubmitting || isPast || conflictCheck.hasConflict}
            icon={<Check className="w-5 h-5 text-white" />}
          >
            {isSubmitting 
              ? 'Guardando cita...' 
              : isPast 
                ? 'Elige una fecha/hora válida' 
                : conflictCheck.hasConflict 
                  ? 'Resolver conflicto de horario' 
                  : 'Crear cita'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => onNavigate('appointments')}
            icon={<ArrowLeft className="w-4 h-4 text-slate-600" />}
          >
            Cancelar y volver
          </Button>
        </div>
      </form>

      {/* Clean Freemium 5 Services Limit Modal */}
      <FreemiumLimitModal
        isOpen={showFreemiumModal}
        onClose={() => setShowFreemiumModal(false)}
        onActivatePlan={activateProSubscription}
        serviceCount={userProfile?.servicios_realizados ?? 5}
      />
    </div>
  );
};
