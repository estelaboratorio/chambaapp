import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Share2, 
  CreditCard, 
  MessageSquare, 
  Check, 
  Calendar as CalendarIcon,
  RotateCcw,
  Ban,
  History,
  AlertTriangle,
  UserCheck,
  Timer,
  FileText,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Appointment, Screen, AppointmentChangeLog, InternalServiceReceiptData } from '../types';
import { updateAppointment } from '../services/firebaseService';
import { 
  isPastDateTime, 
  checkScheduleConflict, 
  formatMinutesToTime12h, 
  parseTimeToMinutes 
} from '../utils/schedulingValidation';
import { InternalReceiptModal } from '../components/InternalReceiptModal';

interface AppointmentsScreenProps {
  businessId?: string;
  businessName?: string;
  appointments: Appointment[];
  isLoading?: boolean;
  onNavigate: (screen: Screen) => void;
  onSelectForCharge?: (appointment: Appointment) => void;
  onRefresh: () => Promise<void>;
  onUpdateAppointment?: (updated: Appointment) => void;
}

export const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({
  businessId,
  businessName = 'Mi Negocio',
  appointments,
  isLoading = false,
  onNavigate,
  onSelectForCharge,
  onRefresh,
  onUpdateAppointment,
}) => {
  const [filter, setFilter] = useState<'hoy' | 'manana' | 'semana' | 'canceladas' | 'todas'>('hoy');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Internal Service Note / Receipt State
  const [isInternalReceiptOpen, setIsInternalReceiptOpen] = useState<boolean>(false);
  const [activeReceiptData, setActiveReceiptData] = useState<InternalServiceReceiptData | null>(null);

  // Reschedule Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState<boolean>(false);
  const [rescheduleDateISO, setRescheduleDateISO] = useState<string>('');
  const [rescheduleTimeValue, setRescheduleTimeValue] = useState<string>('11:00');
  const [rescheduleDuration, setRescheduleDuration] = useState<number>(60);
  const [rescheduleTechnician, setRescheduleTechnician] = useState<string>('Técnico principal');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [rescheduleCustomReason, setRescheduleCustomReason] = useState<string>('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelCustomReason, setCancelCustomReason] = useState<string>('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  // Open Reschedule Modal
  const handleOpenReschedule = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setRescheduleDateISO(apt.dateISO || getTodayISO());
    setRescheduleTimeValue('11:00');
    setRescheduleDuration(apt.durationMinutes || 60);
    setRescheduleTechnician(apt.technician || 'Técnico principal');
    setRescheduleReason('');
    setRescheduleCustomReason('');
    setRescheduleError(null);
    setIsRescheduleModalOpen(true);
  };

  // Open Cancel Modal
  const handleOpenCancel = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setCancelReason('');
    setCancelCustomReason('');
    setCancelError(null);
    setIsCancelModalOpen(true);
  };

  // Reschedule validation
  const rescheduleIsPast = useMemo(() => {
    if (!rescheduleDateISO || !rescheduleTimeValue) return false;
    return isPastDateTime(rescheduleDateISO, rescheduleTimeValue);
  }, [rescheduleDateISO, rescheduleTimeValue]);

  const rescheduleConflict = useMemo(() => {
    if (!selectedAppointment || !rescheduleDateISO || !rescheduleTimeValue) {
      return { hasConflict: false };
    }
    return checkScheduleConflict(appointments, {
      id: selectedAppointment.id,
      dateISO: rescheduleDateISO,
      startTime: rescheduleTimeValue,
      durationMinutes: rescheduleDuration,
      technician: rescheduleTechnician || undefined,
    });
  }, [appointments, selectedAppointment, rescheduleDateISO, rescheduleTimeValue, rescheduleDuration, rescheduleTechnician]);

  // Execute Reschedule with Traceability Audit Log
  const handleConfirmReschedule = async () => {
    if (!selectedAppointment) return;

    const finalReason = rescheduleReason === 'Otro' 
      ? rescheduleCustomReason.trim() 
      : (rescheduleReason || rescheduleCustomReason).trim();

    if (!finalReason) {
      setRescheduleError('Por favor selecciona o escribe el motivo obligatorio de la reprogramación.');
      return;
    }

    if (rescheduleIsPast) {
      setRescheduleError('No puedes reprogramar a una fecha u hora pasada.');
      return;
    }

    if (rescheduleConflict.hasConflict) {
      setRescheduleError(`Conflicto de horario: ${rescheduleConflict.reason}`);
      return;
    }

    setIsUpdating(true);
    setRescheduleError(null);

    const now = new Date().toISOString();
    const newFormattedDate = formatReadableDate(rescheduleDateISO);
    const newFormattedTime = formatReadableTime(rescheduleTimeValue);
    const startMins = parseTimeToMinutes(rescheduleTimeValue);
    const newCalculatedEndTime = formatMinutesToTime12h(startMins + rescheduleDuration);

    const logEntry: AppointmentChangeLog = {
      id: `log_reschedule_${Date.now()}`,
      action: 'rescheduled',
      timestamp: now,
      reason: finalReason,
      previousDate: selectedAppointment.date,
      previousStartTime: selectedAppointment.startTime,
      previousEndTime: selectedAppointment.endTime,
      previousTechnician: selectedAppointment.technician || 'Sin técnico asignado',
      newDate: newFormattedDate,
      newStartTime: newFormattedTime,
      newEndTime: newCalculatedEndTime,
      newTechnician: rescheduleTechnician,
      previousStatus: selectedAppointment.status,
      newStatus: 'rescheduled',
      notes: `Reprogramado por: ${finalReason}`,
    };

    const updatedApt: Appointment = {
      ...selectedAppointment,
      status: 'rescheduled',
      date: newFormattedDate,
      dateISO: rescheduleDateISO,
      startTime: newFormattedTime,
      endTime: newCalculatedEndTime,
      durationMinutes: rescheduleDuration,
      technician: rescheduleTechnician,
      rescheduleReason: finalReason,
      history: [...(selectedAppointment.history || []), logEntry],
      updatedAt: now,
    };

    try {
      if (businessId && businessId !== 'biz_demo_ana') {
        await updateAppointment(businessId, selectedAppointment.id, {
          status: 'rescheduled',
          date: newFormattedDate,
          dateISO: rescheduleDateISO,
          startTime: newFormattedTime,
          endTime: newCalculatedEndTime,
          durationMinutes: rescheduleDuration,
          technician: rescheduleTechnician,
          rescheduleReason: finalReason,
          history: updatedApt.history,
        });
        await onRefresh();
      }

      if (onUpdateAppointment) {
        onUpdateAppointment(updatedApt);
      }

      setSelectedAppointment(updatedApt);
      setIsRescheduleModalOpen(false);
      showToast('✓ Cita reprogramada con éxito. Motivo y trazabilidad guardados.');
    } catch (err: any) {
      setRescheduleError(err.message || 'No se pudo guardar la reprogramación.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Execute Cancellation with Traceability Audit Log (NEVER DELETES)
  const handleConfirmCancellation = async () => {
    if (!selectedAppointment) return;

    const finalReason = cancelReason === 'Otro' 
      ? cancelCustomReason.trim() 
      : (cancelReason || cancelCustomReason).trim();

    if (!finalReason) {
      setCancelError('Por favor selecciona o escribe el motivo de la cancelación.');
      return;
    }

    setIsUpdating(true);
    setCancelError(null);

    const now = new Date().toISOString();
    const logEntry: AppointmentChangeLog = {
      id: `log_cancel_${Date.now()}`,
      action: 'cancelled',
      timestamp: now,
      reason: finalReason,
      previousDate: selectedAppointment.date,
      previousStartTime: selectedAppointment.startTime,
      previousTechnician: selectedAppointment.technician,
      previousStatus: selectedAppointment.status,
      newStatus: 'cancelled',
      notes: `Cancelado por: ${finalReason}`,
    };

    const updatedApt: Appointment = {
      ...selectedAppointment,
      status: 'cancelled',
      cancellationReason: finalReason,
      history: [...(selectedAppointment.history || []), logEntry],
      updatedAt: now,
    };

    try {
      if (businessId && businessId !== 'biz_demo_ana') {
        await updateAppointment(businessId, selectedAppointment.id, {
          status: 'cancelled',
          cancellationReason: finalReason,
          history: updatedApt.history,
        });
        await onRefresh();
      }

      if (onUpdateAppointment) {
        onUpdateAppointment(updatedApt);
      }

      setSelectedAppointment(updatedApt);
      setIsCancelModalOpen(false);
      showToast('✓ Cita cancelada. Registro conservado en historial para auditoría.');
    } catch (err: any) {
      setCancelError(err.message || 'No se pudo registrar la cancelación.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Build and open Internal Service Note / Receipt
  const handleOpenInternalReceipt = (apt: Appointment) => {
    const materialsCost = apt.materialsCost || Math.round(apt.price * 0.3);
    const laborCost = apt.laborCost || Math.round(apt.price * 0.7);
    const subtotal = apt.subtotal || apt.price;
    const total = apt.price;
    const totalPaid = apt.totalPaid !== undefined ? apt.totalPaid : (apt.status === 'completed' ? apt.price : 0);
    const balanceDue = apt.balanceDue !== undefined ? apt.balanceDue : Math.max(0, total - totalPaid);

    const rData: InternalServiceReceiptData = {
      folio: apt.quoteNumber ? `NS-${apt.quoteNumber.replace('COT-', '')}` : `NS-${apt.id.slice(-6)}`,
      quoteNumber: apt.quoteNumber,
      date: new Date().toISOString(),
      businessName,
      clientName: apt.clientName,
      clientPhone: apt.clientPhone,
      clientAddress: apt.address,
      serviceName: apt.serviceName,
      serviceDescription: apt.notes || `Servicio realizado: ${apt.serviceName}`,
      technician: apt.technician || 'Técnico asignado',
      orderStatus: 'completado',
      executionDate: `${apt.date} ${apt.startTime}`,
      materialsCost,
      laborCost,
      subtotal,
      discountAmount: apt.discountAmount || 0,
      taxAmount: apt.taxAmount || 0,
      total,
      payments: totalPaid > 0 ? [
        {
          id: `pay_${apt.id}`,
          quoteId: apt.quoteId || 'general',
          idempotencyKey: `idem_${apt.id}`,
          type: 'liquidacion',
          amount: totalPaid,
          method: 'cash',
          date: new Date().toISOString(),
        }
      ] : [],
      totalPaid,
      balanceDue,
      paymentMethod: 'cash',
    };

    setActiveReceiptData(rData);
    setIsInternalReceiptOpen(true);
  };

  // Standard status updates (confirmed, completed)
  const handleUpdateStatus = async (apt: Appointment, newStatus: Appointment['status']) => {
    setIsUpdating(true);
    const now = new Date().toISOString();
    const logEntry: AppointmentChangeLog = {
      id: `log_status_${Date.now()}`,
      action: 'status_change',
      timestamp: now,
      previousStatus: apt.status,
      newStatus: newStatus,
      notes: `Estado cambiado a ${newStatus}`,
    };

    const updatedApt: Appointment = {
      ...apt,
      status: newStatus,
      history: [...(apt.history || []), logEntry],
      updatedAt: now,
    };

    try {
      if (businessId && businessId !== 'biz_demo_ana') {
        await updateAppointment(businessId, apt.id, {
          status: newStatus,
          history: updatedApt.history,
        });
        await onRefresh();
      }

      if (onUpdateAppointment) {
        onUpdateAppointment(updatedApt);
      }

      setSelectedAppointment(updatedApt);
      showToast(`Cita ${newStatus === 'confirmed' ? 'confirmada' : 'marcada como realizada'}.`);

      // Al completar el servicio, se genera la vista de Nota de Servicio / Recibo Interno
      if (newStatus === 'completed') {
        handleOpenInternalReceipt(updatedApt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter logic
  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'todas') return true;
    if (filter === 'canceladas') {
      return apt.status === 'cancelled' || apt.status === 'rescheduled';
    }

    const now = new Date();
    const todayNum = now.getDate();
    const tomorrowNum = todayNum + 1;
    const d = apt.date.toLowerCase();

    if (filter === 'hoy') {
      return (
        d.includes('hoy') ||
        d.includes(`${todayNum} oct`) ||
        d.includes(`${todayNum} de oct`) ||
        d.includes('3 oct') ||
        d.includes('4 oct') ||
        d.includes('23 oct') ||
        d.includes('24 oct')
      );
    }
    if (filter === 'manana') {
      return (
        d.includes('mañana') ||
        d.includes(`${tomorrowNum} oct`) ||
        d.includes(`${tomorrowNum} de oct`) ||
        d.includes('5 oct') ||
        d.includes('25 oct')
      );
    }
    if (filter === 'semana') {
      return apt.status !== 'cancelled';
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Title & Filter Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#07326F]">
              Mis citas y agenda
            </h1>
            <p className="text-xs text-slate-500">
              Control de servicios con detección de cruces y trazabilidad
            </p>
          </div>
          <span className="font-heading text-xs font-semibold px-2.5 py-1 rounded-full bg-[#07326F]/10 text-[#07326F] shrink-0">
            {appointments.length} citas
          </span>
        </div>

        {/* Filter Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 p-1 bg-slate-200/60 rounded-xl">
          <button
            onClick={() => setFilter('hoy')}
            className={`py-2 px-2 text-xs font-heading font-medium rounded-lg transition-all cursor-pointer text-center ${
              filter === 'hoy'
                ? 'bg-white text-[#07326F] font-semibold shadow-xs'
                : 'text-slate-600 hover:text-[#07326F]'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setFilter('manana')}
            className={`py-2 px-2 text-xs font-heading font-medium rounded-lg transition-all cursor-pointer text-center ${
              filter === 'manana'
                ? 'bg-white text-[#07326F] font-semibold shadow-xs'
                : 'text-slate-600 hover:text-[#07326F]'
            }`}
          >
            Mañana
          </button>
          <button
            onClick={() => setFilter('semana')}
            className={`py-2 px-2 text-xs font-heading font-medium rounded-lg transition-all cursor-pointer text-center ${
              filter === 'semana'
                ? 'bg-white text-[#07326F] font-semibold shadow-xs'
                : 'text-slate-600 hover:text-[#07326F]'
            }`}
          >
            Esta semana
          </button>
          <button
            onClick={() => setFilter('canceladas')}
            className={`py-2 px-2 text-xs font-heading font-medium rounded-lg transition-all cursor-pointer text-center ${
              filter === 'canceladas'
                ? 'bg-white text-[#07326F] font-semibold shadow-xs'
                : 'text-slate-600 hover:text-[#07326F]'
            }`}
          >
            Historial / Cambios
          </button>
          <button
            onClick={() => setFilter('todas')}
            className={`py-2 px-2 text-xs font-heading font-medium rounded-lg transition-all cursor-pointer text-center ${
              filter === 'todas'
                ? 'bg-white text-[#07326F] font-semibold shadow-xs'
                : 'text-slate-600 hover:text-[#07326F]'
            }`}
          >
            Todas ({appointments.length})
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-[#19AA83]/15 border border-[#19AA83]/40 p-3 rounded-xl text-xs text-[#07326F] font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#19AA83] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Appointment Cards List */}
      {isLoading ? (
        <div className="space-y-3 py-6">
          <div className="h-24 bg-white/70 animate-pulse rounded-2xl" />
          <div className="h-24 bg-white/70 animate-pulse rounded-2xl" />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <Card className="p-8 text-center bg-white border border-slate-200/80 shadow-xs space-y-3">
          <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-heading font-bold text-sm text-[#07326F]">
            {filter === 'canceladas' 
              ? 'No hay citas canceladas ni reprogramadas' 
              : 'No hay citas para este filtro'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {filter === 'canceladas'
              ? 'Cuando reprogrames o canceles citas, se conservarán aquí con su motivo para trazabilidad.'
              : 'Cuando agendes un servicio, aparecerá aquí con validación de horarios y trazabilidad completa.'}
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('new-appointment')}
              icon={<Plus className="w-4 h-4 text-[#F9D785]" />}
            >
              Crear nueva cita
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => {
            const isConfirmed = apt.status === 'confirmed';
            const isCompleted = apt.status === 'completed';
            const isCancelled = apt.status === 'cancelled';
            const isRescheduled = apt.status === 'rescheduled';

            return (
              <Card
                key={apt.id}
                className={`p-4 bg-white border transition-all shadow-xs ${
                  isCancelled 
                    ? 'border-rose-200 bg-rose-50/20' 
                    : isRescheduled 
                      ? 'border-amber-200 bg-amber-50/20 hover:border-amber-400' 
                      : 'border-slate-200/80 hover:border-[#07326F]/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                      isCancelled 
                        ? 'bg-rose-50 border-rose-200 text-rose-700' 
                        : isRescheduled 
                          ? 'bg-amber-50 border-amber-200 text-amber-700' 
                          : 'bg-slate-100 border-slate-200/60 text-[#07326F]'
                    }`}>
                      <span className="font-heading font-bold text-xs tracking-tight">
                        {apt.startTime.split(' ')[0]}
                      </span>
                      <span className="text-[10px] font-medium uppercase opacity-75">
                        {apt.startTime.split(' ')[1] || ''}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-sm text-[#07326F]">
                          {apt.clientName}
                        </h3>
                        {apt.history && apt.history.length > 1 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono flex items-center gap-0.5" title="Tiene historial de cambios">
                            <History className="w-3 h-3 text-slate-400" />
                            {apt.history.length}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        {apt.serviceName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span>{apt.date}</span>
                        {apt.technician && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-[#19AA83]" />
                              {apt.technician}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-heading font-bold text-base text-[#07326F] tabular-nums block">
                      ${apt.price}
                    </span>

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-heading font-medium">
                      {isConfirmed && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#19AA83]" />
                          <span className="text-[#19AA83]">Confirmada</span>
                        </>
                      )}
                      {isCompleted && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span className="text-slate-600">Realizada</span>
                        </>
                      )}
                      {isRescheduled && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-amber-700 font-semibold">Reprogramada</span>
                        </>
                      )}
                      {isCancelled && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="text-rose-600 font-semibold">Cancelada</span>
                        </>
                      )}
                      {!isConfirmed && !isCompleted && !isCancelled && !isRescheduled && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="text-amber-600">Pendiente</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Motivo display if cancelled or rescheduled */}
                {isCancelled && apt.cancellationReason && (
                  <div className="mt-2.5 p-2 bg-rose-50/80 border border-rose-200 rounded-lg text-[11px] text-rose-800 flex items-start gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span><strong>Motivo de cancelación:</strong> {apt.cancellationReason}</span>
                  </div>
                )}

                {isRescheduled && apt.rescheduleReason && (
                  <div className="mt-2.5 p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Motivo de reprogramación:</strong> {apt.rescheduleReason}</span>
                  </div>
                )}

                {/* Card Footer with actions */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-slate-400 truncate max-w-[180px]">
                    {apt.notes || 'Sin notas adicionales'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {!isCancelled && (
                      <button
                        onClick={() => handleOpenReschedule(apt)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-heading font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-600" />
                        <span>Reprogramar</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedAppointment(apt)}
                      className="px-3 py-1.5 rounded-lg text-xs font-heading font-semibold text-[#07326F] bg-slate-100 hover:bg-[#07326F] hover:text-white transition-colors cursor-pointer"
                    >
                      Ver detalle
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Action Button: + Nueva cita */}
      <div className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:translate-x-28 z-30">
        <button
          onClick={() => onNavigate('new-appointment')}
          className="flex items-center gap-2 px-4 py-3 bg-[#07326F] text-white rounded-full font-heading font-semibold text-sm shadow-lg shadow-[#07326F]/30 hover:bg-[#032863] active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 text-[#F9D785]" />
          <span>Nueva cita</span>
        </button>
      </div>

      {/* MODAL 1: Detail & Audit Trail Modal */}
      {selectedAppointment && !isRescheduleModalOpen && !isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-200 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider">
                  Detalle y Trazabilidad de cita
                </span>
                <h3 className="font-heading font-bold text-lg text-[#07326F]">
                  {selectedAppointment.clientName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* General Details */}
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-500 font-medium">Servicio:</span>
                <span className="font-heading font-semibold text-[#07326F] text-sm">
                  {selectedAppointment.serviceName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Fecha y hora</span>
                  <span className="font-heading font-semibold text-[#07326F]">
                    {selectedAppointment.date} · {selectedAppointment.startTime}
                  </span>
                  {selectedAppointment.endTime && (
                    <span className="text-[10px] text-slate-400 block">
                      Hasta {selectedAppointment.endTime} ({selectedAppointment.durationMinutes || 60} min)
                    </span>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Precio pactado</span>
                  <span className="font-heading font-bold text-[#19AA83] text-sm tabular-nums">
                    ${selectedAppointment.price}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Técnico / Recurso</span>
                  <span className="font-heading font-semibold text-[#07326F] flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#19AA83]" />
                    {selectedAppointment.technician || 'Técnico principal'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Estado actual</span>
                  <span className="font-heading font-semibold flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        selectedAppointment.status === 'confirmed' 
                          ? 'bg-[#19AA83]' 
                          : selectedAppointment.status === 'completed' 
                            ? 'bg-slate-400' 
                            : selectedAppointment.status === 'rescheduled'
                              ? 'bg-amber-500'
                              : selectedAppointment.status === 'cancelled' 
                                ? 'bg-rose-500' 
                                : 'bg-amber-400'
                      }`}
                    />
                    <span className="capitalize">
                      {selectedAppointment.status === 'confirmed' 
                        ? 'Confirmada' 
                        : selectedAppointment.status === 'completed' 
                          ? 'Realizada' 
                          : selectedAppointment.status === 'rescheduled'
                            ? 'Reprogramada'
                            : selectedAppointment.status === 'cancelled' 
                              ? 'Cancelada' 
                              : 'Pendiente'}
                    </span>
                  </span>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Notas generales</span>
                  <span className="text-slate-700">
                    {selectedAppointment.notes}
                  </span>
                </div>
              )}

              {/* Status Reason Highlights */}
              {selectedAppointment.status === 'cancelled' && selectedAppointment.cancellationReason && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800">
                  <span className="font-heading font-bold block mb-0.5">Motivo registrado de cancelación:</span>
                  <p>{selectedAppointment.cancellationReason}</p>
                  <p className="text-[10px] text-rose-600 mt-1">Este registro se conserva para propósitos de trazabilidad contable y operativa.</p>
                </div>
              )}

              {selectedAppointment.status === 'rescheduled' && selectedAppointment.rescheduleReason && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800">
                  <span className="font-heading font-bold block mb-0.5">Motivo registrado de reprogramación:</span>
                  <p>{selectedAppointment.rescheduleReason}</p>
                </div>
              )}

              {/* Trazabilidad: Change Log History Timeline */}
              <div className="bg-slate-50/80 border border-slate-200 p-3.5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-[#07326F] flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#19AA83]" />
                    <span>Historial de cambios y trazabilidad ({selectedAppointment.history?.length || 1})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Auditoría no destructiva</span>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200/60">
                  {selectedAppointment.history && selectedAppointment.history.length > 0 ? (
                    selectedAppointment.history.map((log, index) => (
                      <div key={log.id || index} className="text-xs bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`font-heading font-bold uppercase tracking-wider ${
                            log.action === 'cancelled' 
                              ? 'text-rose-600' 
                              : log.action === 'rescheduled' 
                                ? 'text-amber-600' 
                                : 'text-[#07326F]'
                          }`}>
                            {log.action === 'created' ? '✓ Cita creada' : log.action === 'rescheduled' ? '🔄 Reprogramación' : log.action === 'cancelled' ? '🚫 Cancelación' : 'Estado actualizado'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleString('es-MX', { 
                              day: '2-digit', 
                              month: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {log.reason && (
                          <div className="text-slate-700 text-xs">
                            <span className="text-slate-500 font-medium">Motivo:</span> {log.reason}
                          </div>
                        )}

                        {log.previousDate && log.newDate && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded-lg flex flex-col gap-0.5">
                            <span><strong>Anterior:</strong> {log.previousDate} {log.previousStartTime} ({log.previousTechnician || 'Sin técnico'})</span>
                            <span><strong>Nueva:</strong> {log.newDate} {log.newStartTime} ({log.newTechnician || 'Sin técnico'})</span>
                          </div>
                        )}

                        {log.notes && !log.reason && (
                          <div className="text-slate-500 text-[11px]">
                            {log.notes}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-500 italic p-1">
                      Cita programada inicialmente el {selectedAppointment.createdAt ? new Date(selectedAppointment.createdAt).toLocaleDateString() : selectedAppointment.date}.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {selectedAppointment.status !== 'cancelled' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    if (onSelectForCharge) onSelectForCharge(selectedAppointment);
                    setSelectedAppointment(null);
                    onNavigate('charge');
                  }}
                  icon={<CreditCard className="w-4 h-4 text-[#19AA83]" />}
                >
                  Cobrar esta cita (${selectedAppointment.price})
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                {/* Reprogramar Button */}
                {selectedAppointment.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => handleOpenReschedule(selectedAppointment)}
                    icon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                    className="border-amber-300 text-amber-800 hover:bg-amber-50"
                  >
                    Reprogramar
                  </Button>
                )}

                {/* Cancelar Button */}
                {selectedAppointment.status !== 'cancelled' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => handleOpenCancel(selectedAppointment)}
                    icon={<Ban className="w-3.5 h-3.5 text-rose-600" />}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    Cancelar cita
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => handleOpenReschedule(selectedAppointment)}
                    icon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                    className="col-span-2 border-amber-300 text-amber-800 hover:bg-amber-50"
                  >
                    Reactivar y reprogramar cita
                  </Button>
                )}

                {/* Confirmar status */}
                {selectedAppointment.status !== 'confirmed' && selectedAppointment.status !== 'cancelled' && (
                  <Button
                    variant="positive"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedAppointment, 'confirmed')}
                  >
                    Confirmar
                  </Button>
                )}

                {/* Marcar realizada */}
                {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedAppointment, 'completed')}
                  >
                    Marcar realizada
                  </Button>
                )}

                {/* Ver Nota de Servicio Interna (Si ya está realizada/completada) */}
                {selectedAppointment.status === 'completed' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenInternalReceipt(selectedAppointment)}
                    icon={<FileText className="w-3.5 h-3.5 text-[#07326F]" />}
                    className="col-span-2 bg-blue-50 border border-blue-200 text-[#07326F] hover:bg-blue-100 font-semibold"
                  >
                    Ver / Imprimir Nota de Servicio Interna
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Dedicated Reschedule Modal with Conflict & Past Validation */}
      {isRescheduleModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#07326F]">
                    Reprogramar servicio
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedAppointment.clientName} · {selectedAppointment.serviceName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRescheduleModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Validation Alerts */}
            {rescheduleIsPast && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>No es posible reprogramar a una fecha u hora pasada. Selecciona un horario presente o futuro.</span>
              </div>
            )}

            {rescheduleConflict.hasConflict && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2 text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Cruce de horario para este técnico:</strong>
                  <span>{rescheduleConflict.reason}</span>
                </div>
              </div>
            )}

            {rescheduleError && !rescheduleIsPast && !rescheduleConflict.hasConflict && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                {rescheduleError}
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              {/* Nueva fecha */}
              <div>
                <label className="block font-heading font-medium text-slate-600 mb-1">
                  Nueva fecha
                </label>
                <input
                  type="date"
                  required
                  min={getTodayISO()}
                  value={rescheduleDateISO}
                  onChange={(e) => setRescheduleDateISO(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-semibold text-[#07326F] bg-slate-50/60 cursor-pointer"
                />
              </div>

              {/* Nueva hora y duración */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-heading font-medium text-slate-600 mb-1">
                    Nueva hora inicio
                  </label>
                  <input
                    type="time"
                    required
                    value={rescheduleTimeValue}
                    onChange={(e) => setRescheduleTimeValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-semibold text-[#07326F] bg-slate-50/60 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-heading font-medium text-slate-600 mb-1">
                    Duración
                  </label>
                  <select
                    value={rescheduleDuration}
                    onChange={(e) => setRescheduleDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs font-semibold text-[#07326F] bg-slate-50/60"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hora (60 min)</option>
                    <option value={90}>1 hr 30 min</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
              </div>

              {/* Técnico asignado */}
              <div>
                <label className="block font-heading font-medium text-slate-600 mb-1">
                  Técnico o Recurso asignado
                </label>
                <select
                  value={rescheduleTechnician}
                  onChange={(e) => setRescheduleTechnician(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs font-semibold text-[#07326F] bg-slate-50/60"
                >
                  <option value="Técnico principal">Técnico principal (Propietario)</option>
                  <option value="Carlos Mendoza (Técnico 1)">Carlos Mendoza (Técnico 1)</option>
                  <option value="Luis Morales (Técnico 2)">Luis Morales (Técnico 2)</option>
                  <option value="Equipo Cuadrilla A">Equipo Cuadrilla A</option>
                </select>
              </div>

              {/* Motivo OBLIGATORIO de reprogramación (Trazabilidad) */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="block font-heading font-bold text-[#07326F]">
                  Motivo de la reprogramación <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Solicitud del cliente',
                    'Atraso por tráfico o ruta',
                    'Falta de refacción o insumo',
                    'Condiciones climáticas',
                    'Reasignación técnica',
                    'Otro'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setRescheduleReason(chip)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        rescheduleReason === chip
                          ? 'bg-[#07326F] text-white font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  required
                  value={rescheduleCustomReason}
                  onChange={(e) => setRescheduleCustomReason(e.target.value)}
                  placeholder="Escribe o amplía el motivo del cambio..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-slate-700 bg-slate-50/50 resize-none mt-1.5"
                />
                <span className="text-[10px] text-slate-400 block">
                  El motivo y la fecha original ({selectedAppointment.date} {selectedAppointment.startTime}) se registrarán en la bitácora de auditoría.
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-2 border-t border-slate-100">
              <Button
                variant="positive"
                size="md"
                disabled={isUpdating || rescheduleIsPast || rescheduleConflict.hasConflict}
                onClick={handleConfirmReschedule}
                icon={<RotateCcw className="w-4 h-4 text-white" />}
              >
                {isUpdating ? 'Guardando en historial...' : 'Confirmar reprogramación'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsRescheduleModalOpen(false)}
              >
                Volver sin cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Dedicated Cancellation Modal with Traceability Guarantee */}
      {isCancelModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-rose-800">
                    Cancelar cita
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedAppointment.clientName} · {selectedAppointment.serviceName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Traceability policy banner */}
            <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#19AA83] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#07326F] block">Trazabilidad garantizada:</strong>
                <span>Esta cita no se eliminará de la base de datos. Se marcará como <strong>Cancelada</strong> y se guardará el motivo en el historial para tus registros.</span>
              </div>
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                {cancelError}
              </div>
            )}

            {/* Motivo OBLIGATORIO de cancelación */}
            <div className="space-y-2">
              <label className="block text-xs font-heading font-bold text-[#07326F]">
                Motivo de la cancelación <span className="text-rose-500">*</span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {[
                  'Cancelado por el cliente',
                  'Cliente ausente en domicilio',
                  'Cotización no aceptada',
                  'Técnico no disponible',
                  'Duplicado accidental',
                  'Otro'
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setCancelReason(chip)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      cancelReason === chip
                        ? 'bg-rose-700 text-white font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                required
                value={cancelCustomReason}
                onChange={(e) => setCancelCustomReason(e.target.value)}
                placeholder="Escribe detalles adicionales de la cancelación..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-600 text-xs text-slate-700 bg-slate-50/50 resize-none mt-1"
              />
            </div>

            <div className="pt-2 space-y-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                disabled={isUpdating}
                onClick={handleConfirmCancellation}
                icon={<Ban className="w-4 h-4 text-rose-600" />}
                className="w-full border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold"
              >
                {isUpdating ? 'Registrando cancelación...' : 'Confirmar cancelación y archivar'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCancelModalOpen(false)}
              >
                No cancelar, mantener cita
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nota de Servicio / Recibo Interno con leyenda CFDI obligatoria */}
      {isInternalReceiptOpen && activeReceiptData && (
        <InternalReceiptModal
          isOpen={isInternalReceiptOpen}
          onClose={() => setIsInternalReceiptOpen(false)}
          data={activeReceiptData}
        />
      )}
    </div>
  );
};
