import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Share2, 
  AlertCircle, 
  Banknote, 
  CreditCard, 
  Receipt as ReceiptIcon, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  TrendingUp,
  Percent,
  ChevronRight,
  Filter,
  Calendar,
  Lock,
  Check,
  CheckCheck,
  Play,
  Wrench,
  ShieldAlert,
  Printer,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  Quote, 
  QuotePayment, 
  Client, 
  Service, 
  Screen, 
  PaymentMethod, 
  PaymentRecordType, 
  Receipt,
  Appointment,
  ServiceOrderStatus,
  ServiceOrderTransitionLog,
  InternalServiceReceiptData
} from '../types';
import { 
  calculateFinancialQuote, 
  recordQuotePayment, 
  generateIdempotencyKey,
  recalculateQuoteBalances 
} from '../services/quoteService';
import { 
  saveQuote, 
  saveReceipt,
  saveAppointment 
} from '../services/firebaseService';
import { 
  SERVICE_ORDER_STEPS,
  canGenerateWorkOrder,
  isTransitionAllowed,
  createServiceOrderTransitionLog,
  ORDER_LIFECYCLE_SEQUENCE
} from '../utils/serviceOrderStateMachine';
import { 
  isPastDateTime, 
  checkScheduleConflict, 
  formatMinutesToTime12h, 
  parseTimeToMinutes 
} from '../utils/schedulingValidation';
import { InternalReceiptModal } from '../components/InternalReceiptModal';
import { useAuth } from '../context/AuthContext';
import { FreemiumLimitModal } from '../components/FreemiumLimitModal';

interface QuotesScreenProps {
  businessId: string;
  businessName: string;
  quotes: Quote[];
  clients: Client[];
  services: Service[];
  appointments?: Appointment[];
  initialActiveQuoteId?: string;
  onNavigate: (screen: Screen) => void;
  onSaveQuote: (quote: Quote) => Promise<void>;
  onViewReceipt: (receipt: Receipt) => void;
  onAddAppointment?: (appointment: Appointment) => void;
}

export const QuotesScreen: React.FC<QuotesScreenProps> = ({
  businessId,
  businessName,
  quotes,
  clients,
  services,
  appointments = [],
  initialActiveQuoteId,
  onNavigate,
  onSaveQuote,
  onViewReceipt,
  onAddAppointment,
}) => {
  // Helper to ensure all quotes have a valid serviceOrderStatus
  const resolvedQuotes = useMemo(() => {
    return quotes.map(q => {
      let resolvedStatus = q.serviceOrderStatus;
      if (!resolvedStatus) {
        if (q.balanceDue <= 0.01 && q.payments && q.payments.length > 0) {
          resolvedStatus = 'cobrado';
        } else if (q.appointmentId || q.scheduledDate) {
          resolvedStatus = 'agendado';
        } else if (q.status === 'con_anticipo' || q.status === 'abonos') {
          resolvedStatus = 'aprobado';
        } else {
          resolvedStatus = 'cotizado';
        }
      }
      return {
        ...q,
        serviceOrderStatus: resolvedStatus,
      };
    });
  }, [quotes]);

  // Filter state
  const [filter, setFilter] = useState<'all' | 'solicitud' | 'cotizado' | 'aprobado' | 'agendado' | 'en_ejecucion' | 'completado' | 'cobrado'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected quote for detailed view / collection control
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(() => {
    if (initialActiveQuoteId) return initialActiveQuoteId;
    return resolvedQuotes[0]?.id || null;
  });

  const activeQuote = useMemo(() => {
    return resolvedQuotes.find(q => q.id === activeQuoteId) || resolvedQuotes[0] || null;
  }, [resolvedQuotes, activeQuoteId]);

  const { userProfile, checkCanAddService, incrementServiciosRealizados, activateProSubscription } = useAuth();
  const [showFreemiumModal, setShowFreemiumModal] = useState<boolean>(false);

  // Modal states
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState<boolean>(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState<boolean>(false);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState<boolean>(false);
  const [isInternalReceiptOpen, setIsInternalReceiptOpen] = useState<boolean>(false);
  const [activeReceiptData, setActiveReceiptData] = useState<InternalServiceReceiptData | null>(null);

  // New Quote Form State
  const [newClientName, setNewClientName] = useState<string>(clients[0]?.name || '');
  const [newClientPhone, setNewClientPhone] = useState<string>(clients[0]?.phone || '');
  const [newClientAddress, setNewClientAddress] = useState<string>(clients[0]?.address || '');
  const [newServiceName, setNewServiceName] = useState<string>(services[0]?.name || 'Servicio profesional');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newMaterialsCost, setNewMaterialsCost] = useState<number>(250);
  const [newLaborHours, setNewLaborHours] = useState<number>(4);
  const [newRatePerHour, setNewRatePerHour] = useState<number>(150);
  const [newTargetMargin, setNewTargetMargin] = useState<number>(30); // 30%
  const [newDiscount, setNewDiscount] = useState<number>(0);
  const [newApplyTax, setNewApplyTax] = useState<boolean>(false);
  const [newTaxRate, setNewTaxRate] = useState<number>(16);

  // Work Order Generation State (Only accessible when quote is 'aprobado')
  const getTomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [workOrderDateISO, setWorkOrderDateISO] = useState<string>(getTomorrowISO());
  const [workOrderTime, setWorkOrderTime] = useState<string>('10:00');
  const [workOrderDuration, setWorkOrderDuration] = useState<number>(180);
  const [workOrderTechnician, setWorkOrderTechnician] = useState<string>('Técnico principal');
  const [workOrderAddress, setWorkOrderAddress] = useState<string>('');
  const [workOrderError, setWorkOrderError] = useState<string | null>(null);
  const [isSubmittingWorkOrder, setIsSubmittingWorkOrder] = useState<boolean>(false);

  // Payment Recording State with Idempotency Lock
  const [paymentType, setPaymentType] = useState<PaymentRecordType>('anticipo');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  
  // Anti-duplicate protection state & ref
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const currentIdempotencyKeyRef = useRef<string>(generateIdempotencyKey());
  const lastSubmitTimestampRef = useRef<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper date/time formatting
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
    if (!time24) return '10:00 AM';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m < 10 ? '0' + m : m} ${ampm}`;
  };

  // Build Internal Service Note / Receipt Data object
  const buildReceiptData = (quote: Quote): InternalServiceReceiptData => {
    return {
      folio: `NS-${quote.quoteNumber.replace('COT-', '')}`,
      quoteNumber: quote.quoteNumber,
      date: new Date().toISOString(),
      businessName,
      clientName: quote.clientName,
      clientPhone: quote.clientPhone,
      clientAddress: quote.clientAddress,
      serviceName: quote.serviceName,
      serviceDescription: quote.description || `Servicio cotizado y ejecutado: ${quote.serviceName}`,
      technician: quote.technician || 'Técnico certificado',
      orderStatus: quote.serviceOrderStatus,
      executionDate: quote.scheduledDate ? `${formatReadableDate(quote.scheduledDate)} ${quote.scheduledTime ? formatReadableTime(quote.scheduledTime) : ''}` : 'En coordinación',
      materialsCost: quote.materialsCost,
      laborCost: quote.laborCost,
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      taxAmount: quote.taxAmount,
      taxRate: quote.taxRate,
      total: quote.total,
      payments: quote.payments,
      totalPaid: quote.totalPaid,
      balanceDue: quote.balanceDue,
      paymentMethod: quote.payments.length > 0 ? quote.payments[quote.payments.length - 1].method : 'cash',
    };
  };

  const handleOpenInternalReceipt = (quote: Quote) => {
    const data = buildReceiptData(quote);
    setActiveReceiptData(data);
    setIsInternalReceiptOpen(true);
  };

  // State Machine Transition Handler
  const handleTransitionStatus = async (
    quote: Quote, 
    newStatus: ServiceOrderStatus, 
    reason?: string
  ) => {
    const fromStatus = quote.serviceOrderStatus;
    
    // Strict Work Order Constraint Validation
    if (newStatus === 'agendado' && !canGenerateWorkOrder(fromStatus)) {
      showToast('⚠️ No se puede generar orden de trabajo: La cotización debe estar expresamente en estado "Aprobado".');
      return;
    }

    const log = createServiceOrderTransitionLog(fromStatus, newStatus, reason);
    const updatedQuote: Quote = {
      ...quote,
      serviceOrderStatus: newStatus,
      statusHistory: [...(quote.statusHistory || []), log],
      updatedAt: new Date().toISOString(),
    };

    // If transitioned to completado or cobrado, auto-open internal receipt preview
    if (newStatus === 'completado' || newStatus === 'cobrado') {
      const rData = buildReceiptData(updatedQuote);
      setActiveReceiptData(rData);
      setIsInternalReceiptOpen(true);
    }

    await onSaveQuote(updatedQuote);
    showToast(`✓ Estado actualizado a: ${SERVICE_ORDER_STEPS[newStatus].label}`);
  };

  // Open Work Order Creation Modal (Strictly gated to Aprobado)
  const handleOpenWorkOrderModal = (quote: Quote) => {
    if (!canGenerateWorkOrder(quote.serviceOrderStatus)) {
      showToast('🔒 Acción bloqueada: Solo las cotizaciones marcadas expresamente como "Aprobadas" pueden generar una orden de trabajo.');
      return;
    }

    setWorkOrderDateISO(getTomorrowISO());
    setWorkOrderTime('10:00');
    setWorkOrderDuration(180);
    setWorkOrderTechnician(quote.technician || 'Técnico principal');
    setWorkOrderAddress(quote.clientAddress || '');
    setWorkOrderError(null);
    setIsWorkOrderModalOpen(true);
  };

  // Work Order Validation: Past date/time & technician conflict check
  const workOrderIsPast = useMemo(() => {
    if (!workOrderDateISO || !workOrderTime) return false;
    return isPastDateTime(workOrderDateISO, workOrderTime);
  }, [workOrderDateISO, workOrderTime]);

  const workOrderConflict = useMemo(() => {
    if (!workOrderDateISO || !workOrderTime) return { hasConflict: false };
    return checkScheduleConflict(appointments, {
      dateISO: workOrderDateISO,
      startTime: workOrderTime,
      durationMinutes: workOrderDuration,
      technician: workOrderTechnician,
    });
  }, [appointments, workOrderDateISO, workOrderTime, workOrderDuration, workOrderTechnician]);

  // Submit Work Order Generation
  const handleConfirmGenerateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuote) return;

    if (!canGenerateWorkOrder(activeQuote.serviceOrderStatus)) {
      setWorkOrderError('No se puede generar la orden: La cotización no ha sido expresamente aprobada.');
      return;
    }

    if (workOrderIsPast) {
      setWorkOrderError('No se puede agendar en una fecha u hora pasada.');
      return;
    }

    if (workOrderConflict.hasConflict) {
      setWorkOrderError(`Conflicto de horario: ${workOrderConflict.reason}`);
      return;
    }

    setIsSubmittingWorkOrder(true);
    setWorkOrderError(null);

    try {
      const now = new Date().toISOString();
      const newFormattedDate = formatReadableDate(workOrderDateISO);
      const newFormattedTime = formatReadableTime(workOrderTime);
      const startMins = parseTimeToMinutes(workOrderTime);
      const newCalculatedEndTime = formatMinutesToTime12h(startMins + workOrderDuration);
      const newAptId = `apt_ord_${Date.now()}`;

      // 1. Create Appointment (Work Order)
      const newAppointment: Appointment = {
        id: newAptId,
        businessId,
        clientId: activeQuote.clientId || `cli_${Date.now()}`,
        clientName: activeQuote.clientName,
        clientPhone: activeQuote.clientPhone,
        serviceId: activeQuote.serviceId || 'srv_gen',
        serviceName: activeQuote.serviceName,
        date: newFormattedDate,
        dateISO: workOrderDateISO,
        startTime: newFormattedTime,
        endTime: newCalculatedEndTime,
        durationMinutes: workOrderDuration,
        technician: workOrderTechnician,
        price: activeQuote.total,
        status: 'confirmed',
        quoteId: activeQuote.id,
        quoteNumber: activeQuote.quoteNumber,
        serviceOrderStatus: 'agendado',
        materialsCost: activeQuote.materialsCost,
        laborCost: activeQuote.laborCost,
        subtotal: activeQuote.subtotal,
        discountAmount: activeQuote.discountAmount,
        taxAmount: activeQuote.taxAmount,
        totalPaid: activeQuote.totalPaid,
        balanceDue: activeQuote.balanceDue,
        notes: `Orden generada desde cotización aprobada ${activeQuote.quoteNumber}. ${activeQuote.description || ''}`,
        address: workOrderAddress.trim() || activeQuote.clientAddress || undefined,
        createdAt: now,
        updatedAt: now,
        history: [
          {
            id: `log_init_${Date.now()}`,
            action: 'created',
            timestamp: now,
            newDate: newFormattedDate,
            newStartTime: newFormattedTime,
            newTechnician: workOrderTechnician,
            newStatus: 'confirmed',
            notes: `Orden de trabajo generada desde cotización formal aprobada ${activeQuote.quoteNumber}`,
          }
        ]
      };

      // Persist appointment to Firestore
      if (businessId && businessId !== 'biz_demo_ana') {
        try {
          await saveAppointment(businessId, newAppointment);
        } catch (err) {
          console.warn('Appointment sync error:', err);
        }
      }

      if (onAddAppointment) {
        onAddAppointment(newAppointment);
      }

      // 2. Advance Quote to 'agendado' with transition log
      const log = createServiceOrderTransitionLog(
        activeQuote.serviceOrderStatus, 
        'agendado', 
        `Orden de trabajo #${newAppointment.id} programada para el ${newFormattedDate} a las ${newFormattedTime} con ${workOrderTechnician}`
      );

      const updatedQuote: Quote = {
        ...activeQuote,
        serviceOrderStatus: 'agendado',
        appointmentId: newAptId,
        scheduledDate: workOrderDateISO,
        scheduledTime: workOrderTime,
        technician: workOrderTechnician,
        clientAddress: workOrderAddress.trim() || activeQuote.clientAddress,
        statusHistory: [...(activeQuote.statusHistory || []), log],
        updatedAt: now,
      };

      await onSaveQuote(updatedQuote);
      setIsWorkOrderModalOpen(false);
      showToast(`✓ ¡Orden de trabajo generada y agendada con éxito para el ${newFormattedDate}!`);
    } catch (err: any) {
      setWorkOrderError(err.message || 'Error al generar la orden de trabajo.');
    } finally {
      setIsSubmittingWorkOrder(false);
    }
  };

  // Open payment dialog with fresh idempotency key and preset amount
  const handleOpenPaymentModal = (quote: Quote, presetType?: PaymentRecordType) => {
    const determinedType = presetType || (quote.payments.length === 0 ? 'anticipo' : 'abono');
    setPaymentType(determinedType);
    
    // Default suggested amount: 50% for anticipo if no payments yet, or remaining balance
    if (determinedType === 'anticipo' && quote.payments.length === 0) {
      setPaymentAmount(Math.round(quote.total * 0.5));
    } else {
      setPaymentAmount(quote.balanceDue);
    }
    
    setPaymentNotes('');
    setPaymentError(null);
    currentIdempotencyKeyRef.current = generateIdempotencyKey();
    setIsRecordPaymentOpen(true);
  };

  // Submit payment with strict duplicate blocking and auto-trigger of internal receipt
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuote) return;

    // 1. Guard against rapid multiple clicks (debounce / burst lock)
    const now = Date.now();
    if (now - lastSubmitTimestampRef.current < 2000) {
      setPaymentError('Reintento detectado. Por favor espera un momento.');
      return;
    }
    lastSubmitTimestampRef.current = now;

    if (isSubmittingPayment) return;

    setIsSubmittingPayment(true);
    setPaymentError(null);

    try {
      const idempotencyKey = currentIdempotencyKeyRef.current;
      
      const recordResult = recordQuotePayment({
        quote: activeQuote,
        type: paymentType,
        amount: Number(paymentAmount),
        method: paymentMethod,
        notes: paymentNotes,
        idempotencyKey,
      });

      if (!recordResult.success || !recordResult.updatedQuote) {
        setPaymentError(recordResult.error || 'No se pudo registrar el pago.');
        setIsSubmittingPayment(false);
        return;
      }

      let updatedQuote = recordResult.updatedQuote;

      // Auto advance to 'cobrado' if the service was completed and is now fully paid
      if (updatedQuote.balanceDue <= 0.01 && (updatedQuote.serviceOrderStatus === 'completado' || updatedQuote.serviceOrderStatus === 'en_ejecucion')) {
        const transLog = createServiceOrderTransitionLog(
          updatedQuote.serviceOrderStatus, 
          'cobrado', 
          'Saldo 100% liquidado'
        );
        updatedQuote = {
          ...updatedQuote,
          serviceOrderStatus: 'cobrado',
          statusHistory: [...(updatedQuote.statusHistory || []), transLog],
        };
      }

      // Persist quote and generated receipt
      await onSaveQuote(updatedQuote);
      if (recordResult.receipt && businessId && businessId !== 'biz_demo_ana') {
        try {
          await saveReceipt(businessId, recordResult.receipt);
        } catch (err) {
          console.warn('Receipt sync error:', err);
        }
      }

      setIsRecordPaymentOpen(false);
      showToast(`✓ Pago registrado con éxito (${paymentType === 'anticipo' ? 'Anticipo' : paymentType === 'abono' ? 'Abono' : 'Liquidación'}). Saldo restante: $${updatedQuote.balanceDue} MXN.`);

      // Automatically present the internal service note / receipt view as requested!
      const receiptData = buildReceiptData(updatedQuote);
      setActiveReceiptData(receiptData);
      setIsInternalReceiptOpen(true);

      // Generate next key for subsequent transactions
      currentIdempotencyKeyRef.current = generateIdempotencyKey();
    } catch (err: any) {
      setPaymentError(err?.message || 'Error inesperado al procesar el pago.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Create new quote handler
  const handleCreateNewQuote = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rule 0: Freemium limit check (5 free services or quotes)
    if (!checkCanAddService()) {
      setShowFreemiumModal(true);
      return;
    }

    const laborCost = newLaborHours * newRatePerHour;
    const calc = calculateFinancialQuote({
      materialsCost: newMaterialsCost,
      laborCost,
      targetMargin: newTargetMargin / 100,
      discountAmount: newDiscount,
      taxRate: newApplyTax ? newTaxRate / 100 : 0,
    });

    const quoteId = `cot_${Date.now()}`;
    const quoteNumber = `COT-${String(quotes.length + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const initialLog = createServiceOrderTransitionLog(
      'solicitud', 
      'cotizado', 
      'Cotización calculada por margen sobre ventas'
    );

    const newQuote: Quote = {
      id: quoteId,
      businessId,
      quoteNumber,
      clientName: newClientName.trim() || 'Cliente particular',
      clientPhone: newClientPhone.trim() || undefined,
      clientAddress: newClientAddress.trim() || undefined,
      serviceName: newServiceName.trim() || 'Servicio profesional',
      description: newDescription.trim() || undefined,
      materialsCost: calc.materialsCost,
      laborCost: calc.laborCost,
      totalCost: calc.totalCost,
      targetMargin: calc.targetMargin,
      basePrice: calc.basePrice,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxRate: calc.taxRate,
      taxAmount: calc.taxAmount,
      total: calc.finalTotal,
      payments: [],
      totalPaid: 0,
      balanceDue: calc.finalTotal,
      status: 'pendiente',
      serviceOrderStatus: 'cotizado', // Calculated and ready for customer review
      statusHistory: [initialLog],
      createdAt: now,
      updatedAt: now,
    };

    await onSaveQuote(newQuote);
    try {
      await incrementServiciosRealizados();
    } catch (incErr) {
      console.warn('Could not increment counter:', incErr);
    }

    setActiveQuoteId(newQuote.id);
    setIsNewQuoteOpen(false);
    showToast(`✓ Cotización ${quoteNumber} creada exitosamente en estado "Cotizado".`);
  };

  // WhatsApp share generator
  const handleShareWhatsApp = (quote: Quote) => {
    const anticipoPayments = quote.payments.filter(p => p.type === 'anticipo');
    const abonoPayments = quote.payments.filter(p => p.type === 'abono');
    
    let text = `📄 *COTIZACIÓN FORMAL - ${businessName}*\n`;
    text += `Folio: *${quote.quoteNumber}*\n`;
    text += `Cliente: *${quote.clientName}*\n`;
    text += `Servicio: *${quote.serviceName}*\n`;
    text += `Estado: *${SERVICE_ORDER_STEPS[quote.serviceOrderStatus].label.toUpperCase()}*\n\n`;
    text += `*DESGLOSE FINANCIERO:*\n`;
    text += `• Costo de materiales: $${quote.materialsCost} MXN\n`;
    text += `• Mano de obra especializada: $${quote.laborCost} MXN\n`;
    text += `• Subtotal (Precio base): $${quote.subtotal} MXN\n`;
    if (quote.discountAmount > 0) {
      text += `• Descuento: -$${quote.discountAmount} MXN\n`;
    }
    if (quote.taxAmount > 0) {
      text += `• IVA (${Math.round(quote.taxRate * 100)}%): +$${quote.taxAmount} MXN\n`;
    }
    text += `*TOTAL COTIZADO:* $${quote.total} MXN\n\n`;

    text += `*ESTADO DE COBRANZA Y SALDO:*\n`;
    if (anticipoPayments.length > 0) {
      const sumAnticipo = anticipoPayments.reduce((s, p) => s + p.amount, 0);
      text += `✓ Anticipo recibido: $${sumAnticipo} MXN\n`;
    }
    if (abonoPayments.length > 0) {
      const sumAbonos = abonoPayments.reduce((s, p) => s + p.amount, 0);
      text += `✓ Abonos parciales: $${sumAbonos} MXN\n`;
    }
    text += `• Total pagado a la fecha: $${quote.totalPaid} MXN\n`;
    text += `• *SALDO PENDIENTE:* *$${quote.balanceDue} MXN*\n\n`;

    if (quote.balanceDue <= 0) {
      text += `🎉 *Esta cotización se encuentra 100% liquidada.*\n\n`;
    } else {
      text += `Puedes liquidar tu saldo en efectivo, transferencia o enlace digital.\n\n`;
    }
    text += `_Comprobante de control interno - No válido como comprobante fiscal digital (CFDI)_\n`;
    text += `¡Gracias por tu confianza!`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filtered quotes list
  const filteredQuotes = resolvedQuotes.filter(q => {
    if (filter === 'all') return true;
    return q.serviceOrderStatus === filter;
  }).filter(q => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return q.clientName.toLowerCase().includes(query) || 
           q.serviceName.toLowerCase().includes(query) ||
           q.quoteNumber.toLowerCase().includes(query);
  });

  // Calculate live preview for new quote form
  const newLaborCostPreview = newLaborHours * newRatePerHour;
  const newCalcPreview = calculateFinancialQuote({
    materialsCost: newMaterialsCost,
    laborCost: newLaborCostPreview,
    targetMargin: newTargetMargin / 100,
    discountAmount: newDiscount,
    taxRate: newApplyTax ? newTaxRate / 100 : 0,
  });

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#07326F]">
            Órdenes de Servicio y Cotizaciones
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Máquina de estados estricta, comprobantes de control interno y cobranza.
          </p>
        </div>

        <Button
          variant="positive"
          size="sm"
          onClick={() => setIsNewQuoteOpen(true)}
          icon={<Plus className="w-4 h-4 text-white" />}
        >
          Nueva cotización
        </Button>
      </div>

      {/* Global Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Search & Filter Chips (All 8 strict states) */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, folio o servicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:border-[#07326F]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'solicitud', label: '1. Solicitud' },
            { id: 'cotizado', label: '2. Cotizado' },
            { id: 'aprobado', label: '3. Aprobado' },
            { id: 'agendado', label: '4. Agendado' },
            { id: 'en_ejecucion', label: '5. En Ejecución' },
            { id: 'completado', label: '6. Completado' },
            { id: 'cobrado', label: '7. Cobrado' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full font-heading text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                filter === tab.id
                  ? 'bg-[#07326F] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredQuotes.length === 0 && (
        <Card className="p-8 text-center bg-white border border-slate-200/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-[#07326F]">
              No hay cotizaciones u órdenes en esta vista
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Crea una cotización calculando costos, mano de obra y margen sobre ventas.
            </p>
          </div>
          <Button
            variant="positive"
            size="md"
            onClick={() => setIsNewQuoteOpen(true)}
            icon={<Plus className="w-4 h-4 text-white" />}
          >
            Crear cotización
          </Button>
        </Card>
      )}

      {/* List of Quotes & Orders */}
      <div className="space-y-3">
        {filteredQuotes.map((quote) => {
          const isSelected = activeQuote?.id === quote.id;
          const percentPaid = quote.total > 0 ? Math.min(100, Math.round((quote.totalPaid / quote.total) * 100)) : 0;
          const isLiquidated = quote.balanceDue <= 0.01;
          const stepMeta = SERVICE_ORDER_STEPS[quote.serviceOrderStatus] || SERVICE_ORDER_STEPS.cotizado;
          const isApproved = quote.serviceOrderStatus === 'aprobado';

          return (
            <Card
              key={quote.id}
              className={`p-4 bg-white transition-all cursor-pointer border ${
                isSelected
                  ? 'border-[#07326F] ring-2 ring-[#07326F]/10 shadow-sm'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
              onClick={() => setActiveQuoteId(quote.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {quote.quoteNumber}
                    </span>
                    <h3 className="font-heading font-bold text-sm text-[#07326F]">
                      {quote.clientName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {quote.serviceName}
                  </p>
                </div>

                {/* State Machine Badge */}
                <div className="text-right shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-heading font-bold border ${stepMeta.bgClass} ${stepMeta.textClass} ${stepMeta.borderClass}`}>
                    {stepMeta.label}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>Cubierto: {percentPaid}%</span>
                  <span>Total: ${quote.total} MXN</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isLiquidated ? 'bg-[#19AA83]' : 'bg-[#07326F]'
                    }`}
                    style={{ width: `${percentPaid}%` }}
                  />
                </div>
              </div>

              {/* Balance Summary Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Pagado a la fecha:</span>
                  <span className="font-heading font-bold text-slate-700">${quote.totalPaid}</span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Saldo pendiente:</span>
                  <span className={`font-heading font-bold text-sm ${isLiquidated ? 'text-[#19AA83]' : 'text-amber-600'}`}>
                    ${quote.balanceDue} MXN
                  </span>
                </div>
              </div>

              {/* Quick Actions if selected */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  {/* Strict Work Order Action */}
                  {isApproved ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWorkOrderModal(quote);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Generar orden de trabajo
                    </button>
                  ) : quote.serviceOrderStatus === 'solicitud' || quote.serviceOrderStatus === 'cotizado' || quote.serviceOrderStatus === 'rechazado' ? (
                    <button
                      type="button"
                      disabled
                      title="Bloqueado: La cotización debe estar expresamente en estado 'Aprobada'"
                      className="py-1.5 px-3 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-heading font-medium flex items-center gap-1.5 cursor-not-allowed"
                    >
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Orden bloqueada (Requiere Aprobación)</span>
                    </button>
                  ) : null}

                  {/* Internal Service Note / Receipt Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenInternalReceipt(quote);
                    }}
                    className="py-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#07326F] border border-blue-200 text-xs font-heading font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#07326F]" />
                    <span>Nota / Recibo Interno</span>
                  </button>

                  {!isLiquidated && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPaymentModal(quote);
                      }}
                      className="py-1.5 px-2.5 rounded-xl bg-[#19AA83] hover:bg-[#169674] text-white text-xs font-heading font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Registrar pago
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareWhatsApp(quote);
                    }}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#07326F] text-xs font-heading font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ================= DETALLE EXTENDIDO DE LA COTIZACIÓN SELECCIONADA ================= */}
      {activeQuote && (
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-[#07326F]">
              Ciclo de Vida y Cobranza: {activeQuote.quoteNumber}
            </h2>
            <button
              onClick={() => handleOpenInternalReceipt(activeQuote)}
              className="text-xs font-heading font-bold text-[#07326F] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 inline-flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#07326F]" />
              Ver Nota de Servicio Interna
            </button>
          </div>

          {/* ================= PIPELINE VISUAL DE LA MÁQUINA DE ESTADOS ================= */}
          <Card className="p-4 bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#07326F] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Máquina de estados estricta del servicio
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase ${SERVICE_ORDER_STEPS[activeQuote.serviceOrderStatus].bgClass} ${SERVICE_ORDER_STEPS[activeQuote.serviceOrderStatus].textClass}`}>
                {SERVICE_ORDER_STEPS[activeQuote.serviceOrderStatus].label}
              </span>
            </div>

            {/* Stepper Pipeline */}
            <div className="overflow-x-auto pb-2 scrollbar-none">
              <div className="flex items-center min-w-[500px] justify-between relative px-2">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 -z-0" />
                {ORDER_LIFECYCLE_SEQUENCE.map((stepKey, idx) => {
                  const meta = SERVICE_ORDER_STEPS[stepKey];
                  const currentIdx = ORDER_LIFECYCLE_SEQUENCE.indexOf(activeQuote.serviceOrderStatus);
                  const isPast = idx < currentIdx;
                  const isCurrent = activeQuote.serviceOrderStatus === stepKey;

                  return (
                    <div key={stepKey} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-heading font-bold text-xs transition-all ${
                          isCurrent
                            ? 'bg-[#07326F] text-white ring-4 ring-[#07326F]/20 shadow-sm scale-110'
                            : isPast
                            ? 'bg-[#19AA83] text-white'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                        }`}
                      >
                        {isPast ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <span className={`text-[10px] font-heading mt-1 whitespace-nowrap ${
                        isCurrent
                          ? 'font-bold text-[#07326F]'
                          : isPast
                          ? 'font-semibold text-slate-700'
                          : 'text-slate-400'
                      }`}>
                        {meta.shortLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Step Description Card */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-slate-800">
                  {SERVICE_ORDER_STEPS[activeQuote.serviceOrderStatus].label}:
                </span>
                {activeQuote.scheduledDate && (
                  <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    📅 Cita: {formatReadableDate(activeQuote.scheduledDate)} {activeQuote.scheduledTime ? formatReadableTime(activeQuote.scheduledTime) : ''}
                  </span>
                )}
              </div>
              <p className="text-slate-600">
                {SERVICE_ORDER_STEPS[activeQuote.serviceOrderStatus].description}
              </p>
            </div>

            {/* Contextual Transition Actions Bar */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
              
              {/* Transition: Solicitud -> Cotizado */}
              {activeQuote.serviceOrderStatus === 'solicitud' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleTransitionStatus(activeQuote, 'cotizado')}
                  icon={<FileText className="w-3.5 h-3.5 text-white" />}
                >
                  Calcular y emitir cotización
                </Button>
              )}

              {/* Transitions from Cotizado: Aprobar o Rechazar */}
              {activeQuote.serviceOrderStatus === 'cotizado' && (
                <>
                  <Button
                    variant="positive"
                    size="sm"
                    onClick={() => handleTransitionStatus(activeQuote, 'aprobado', 'Cliente autorizó la cotización')}
                    icon={<ThumbsUp className="w-3.5 h-3.5 text-white" />}
                  >
                    Marcar como Aprobada
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTransitionStatus(activeQuote, 'rechazado', 'Cliente declinó')}
                    icon={<ThumbsDown className="w-3.5 h-3.5 text-red-500" />}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Rechazar
                  </Button>

                  {/* Strict notice: Cannot generate work order while cotizado */}
                  <div className="w-full mt-1 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Regla de negocio: Para poder generar una orden de trabajo, la cotización debe marcarse expresamente como <strong>"Aprobada"</strong>.</span>
                  </div>
                </>
              )}

              {/* Transitions from Rechazado: Recotizar */}
              {activeQuote.serviceOrderStatus === 'rechazado' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleTransitionStatus(activeQuote, 'cotizado', 'Reapertura para renegociación')}
                  icon={<RotateCcw className="w-3.5 h-3.5 text-slate-600" />}
                >
                  Recotizar / Reactivar a Cotizado
                </Button>
              )}

              {/* Transitions from Aprobado: Generar Orden de Trabajo (Agendar) */}
              {activeQuote.serviceOrderStatus === 'aprobado' && (
                <div className="w-full space-y-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Cotización Aprobada:</strong> Ahora puedes generar formalmente la orden de trabajo en agenda.</span>
                    </div>
                  </div>

                  <Button
                    variant="positive"
                    size="md"
                    onClick={() => handleOpenWorkOrderModal(activeQuote)}
                    icon={<Calendar className="w-4 h-4 text-white" />}
                    className="w-full shadow-md"
                  >
                    Generar Orden de Trabajo y Agendar
                  </Button>
                </div>
              )}

              {/* Transitions from Agendado: Iniciar Ejecución */}
              {activeQuote.serviceOrderStatus === 'agendado' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleTransitionStatus(activeQuote, 'en_ejecucion', 'Técnico inició trabajo en sitio')}
                  icon={<Play className="w-3.5 h-3.5 text-[#F9D785]" />}
                >
                  Iniciar servicio (En Ejecución)
                </Button>
              )}

              {/* Transitions from En Ejecución: Marcar Completado */}
              {activeQuote.serviceOrderStatus === 'en_ejecucion' && (
                <Button
                  variant="positive"
                  size="sm"
                  onClick={() => handleTransitionStatus(activeQuote, 'completado', 'Servicio técnico concluido')}
                  icon={<CheckCheck className="w-3.5 h-3.5 text-white" />}
                >
                  Finalizar servicio (Marcar Completado)
                </Button>
              )}

              {/* Transitions from Completado: Ver Comprobante y Cobrar */}
              {activeQuote.serviceOrderStatus === 'completado' && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenInternalReceipt(activeQuote)}
                    icon={<Printer className="w-3.5 h-3.5 text-[#07326F]" />}
                  >
                    Imprimir Nota de Servicio
                  </Button>

                  {activeQuote.balanceDue <= 0.01 ? (
                    <Button
                      variant="positive"
                      size="sm"
                      onClick={() => handleTransitionStatus(activeQuote, 'cobrado', 'Saldo 100% liquidado')}
                      icon={<ShieldCheck className="w-3.5 h-3.5 text-white" />}
                    >
                      Marcar como Cobrado
                    </Button>
                  ) : (
                    <Button
                      variant="positive"
                      size="sm"
                      onClick={() => handleOpenPaymentModal(activeQuote, 'liquidacion')}
                      icon={<DollarSign className="w-3.5 h-3.5 text-white" />}
                    >
                      Liquidar saldo ($ {activeQuote.balanceDue})
                    </Button>
                  )}
                </div>
              )}

              {/* Cobrado state */}
              {activeQuote.serviceOrderStatus === 'cobrado' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Orden 100% cobrada y concluida
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenInternalReceipt(activeQuote)}
                    icon={<FileText className="w-3.5 h-3.5 text-slate-600" />}
                  >
                    Comprobante Interno
                  </Button>
                </div>
              )}

            </div>
          </Card>

          {/* Large Financial Breakdown Card */}
          <Card className="p-4 bg-white border border-slate-200 shadow-xs space-y-3">
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#07326F] block">
              Desglose financiero estricto
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Costo de materiales</span>
                <span className="font-heading font-bold text-[#07326F] text-sm">${activeQuote.materialsCost}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Mano de obra</span>
                <span className="font-heading font-bold text-[#07326F] text-sm">${activeQuote.laborCost}</span>
              </div>

              <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                <span className="text-[11px] text-blue-700 block">Subtotal (Precio base)</span>
                <span className="font-heading font-bold text-[#07326F] text-sm">${activeQuote.subtotal}</span>
              </div>

              <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[11px] text-emerald-700 block">Margen sobre ventas</span>
                <span className="font-heading font-bold text-emerald-800 text-sm">
                  {Math.round(activeQuote.targetMargin * 100)}%
                </span>
              </div>
            </div>

            {/* Adjustments row */}
            {(activeQuote.discountAmount > 0 || activeQuote.taxAmount > 0) && (
              <div className="text-xs pt-1 border-t border-slate-100 flex items-center justify-between text-slate-600">
                {activeQuote.discountAmount > 0 && (
                  <span className="text-red-600">Descuento: -${activeQuote.discountAmount}</span>
                )}
                {activeQuote.taxAmount > 0 && (
                  <span>IVA ({Math.round(activeQuote.taxRate * 100)}%): +${activeQuote.taxAmount}</span>
                )}
              </div>
            )}

            {/* Saldo summary */}
            <div className="p-3 bg-gradient-to-r from-slate-900 to-[#07326F] text-white rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider block">Total Cotización</span>
                <span className="font-heading font-bold text-lg">${activeQuote.total} MXN</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#F9D785] uppercase tracking-wider block">Saldo pendiente</span>
                <span className={`font-heading font-bold text-lg ${activeQuote.balanceDue <= 0.01 ? 'text-[#19AA83]' : 'text-amber-400'}`}>
                  ${activeQuote.balanceDue} MXN
                </span>
              </div>
            </div>

            {/* Mandatory CFDI Notice Banner */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 font-medium text-center">
              Comprobante de control interno - No válido como comprobante fiscal digital (CFDI)
            </div>
          </Card>

          {/* Payment History (Ledger) */}
          <Card className="p-4 bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#07326F]">
                Historial de pagos registrados
              </span>
              <span className="text-xs text-slate-400">
                {activeQuote.payments.length} {activeQuote.payments.length === 1 ? 'pago' : 'pagos'}
              </span>
            </div>

            {activeQuote.payments.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 text-center space-y-2">
                <p className="text-xs text-amber-800 font-medium">
                  Aún no se ha registrado ningún pago para esta cotización.
                </p>
                <Button
                  variant="positive"
                  size="sm"
                  onClick={() => handleOpenPaymentModal(activeQuote, 'anticipo')}
                  icon={<DollarSign className="w-3.5 h-3.5 text-white" />}
                >
                  Registrar Anticipo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {activeQuote.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider ${
                          p.type === 'anticipo'
                            ? 'bg-blue-100 text-blue-800'
                            : p.type === 'abono'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.type === 'anticipo' ? 'Anticipo' : p.type === 'abono' ? 'Abono parcial' : 'Liquidación'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(p.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        {p.method === 'cash' ? (
                          <span className="inline-flex items-center gap-1"><Banknote className="w-3 h-3 text-emerald-600" /> Efectivo</span>
                        ) : p.method === 'transfer' ? (
                          <span className="inline-flex items-center gap-1"><CreditCard className="w-3 h-3 text-blue-600" /> Transferencia</span>
                        ) : (
                          <span className="inline-flex items-center gap-1"><CreditCard className="w-3 h-3 text-[#07326F]" /> Enlace digital</span>
                        )}
                        {p.notes && <span>· {p.notes}</span>}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-heading font-bold text-sm text-[#07326F] block">
                        +${p.amount} MXN
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenInternalReceipt(activeQuote)}
                        className="text-[10px] text-[#19AA83] hover:underline font-heading font-semibold cursor-pointer inline-flex items-center gap-0.5"
                      >
                        <ReceiptIcon className="w-3 h-3" />
                        <span>Ver nota interna</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action to add payment if balance remains */}
            {activeQuote.balanceDue > 0.01 && (
              <div className="pt-2">
                <Button
                  variant="positive"
                  size="md"
                  onClick={() => handleOpenPaymentModal(activeQuote)}
                  icon={<DollarSign className="w-4 h-4 text-white" />}
                >
                  Registrar nuevo pago (Saldo: ${activeQuote.balanceDue} MXN)
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ================= MODAL: GENERAR ORDEN DE TRABAJO (SOLO COTIZACIONES APROBADAS) ================= */}
      {isWorkOrderModalOpen && activeQuote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-bold bg-emerald-100 text-emerald-800">
                    Aprobada ✓
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#07326F]">
                    Generar Orden de Trabajo
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeQuote.quoteNumber} · {activeQuote.clientName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkOrderModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {workOrderError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{workOrderError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmGenerateWorkOrder} className="space-y-3.5">
              {/* Summary of service and price */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Servicio:</span>
                  <span className="font-bold text-[#07326F]">{activeQuote.serviceName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Monto de la orden:</span>
                  <span className="font-bold text-[#07326F]">${activeQuote.total} MXN</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Saldo por cobrar:</span>
                  <span className="font-bold text-amber-600">${activeQuote.balanceDue} MXN</span>
                </div>
              </div>

              {/* Date & Time Picker */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block font-heading font-medium text-slate-600 mb-1">
                    Fecha de servicio
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={workOrderDateISO}
                    onChange={(e) => setWorkOrderDateISO(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#07326F] bg-white"
                  />
                </div>

                <div>
                  <label className="block font-heading font-medium text-slate-600 mb-1">
                    Hora de inicio
                  </label>
                  <input
                    type="time"
                    required
                    value={workOrderTime}
                    onChange={(e) => setWorkOrderTime(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#07326F] bg-white"
                  />
                </div>
              </div>

              {/* Real-time warnings */}
              {workOrderIsPast && (
                <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>No puedes agendar en una fecha u hora pasada.</span>
                </div>
              )}

              {workOrderConflict.hasConflict && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] space-y-0.5">
                  <div className="font-heading font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Conflicto detectado: {workOrderConflict.reason}</span>
                  </div>
                  <p className="text-[10px] text-amber-800">
                    El técnico asignado ({workOrderTechnician}) ya cuenta con una cita en ese horario.
                  </p>
                </div>
              )}

              {/* Technician Selector */}
              <div>
                <label className="block text-xs font-heading font-medium text-slate-600 mb-1">
                  Técnico o recurso responsable
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    'Técnico principal',
                    'Carlos Mendoza (Técnico 1)',
                    'Roberto Sánchez (Técnico 2)',
                    'Cuadrilla de instalación',
                  ].map(tech => (
                    <button
                      type="button"
                      key={tech}
                      onClick={() => setWorkOrderTechnician(tech)}
                      className={`p-2 rounded-xl text-xs font-heading font-medium border text-left cursor-pointer transition-all ${
                        workOrderTechnician === tech
                          ? 'bg-[#07326F] text-white border-[#07326F]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration and Address */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block font-heading font-medium text-slate-600 mb-1">
                    Duración (minutos)
                  </label>
                  <select
                    value={workOrderDuration}
                    onChange={(e) => setWorkOrderDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 font-semibold text-[#07326F] bg-white"
                  >
                    <option value={60}>1 hora (60 min)</option>
                    <option value={120}>2 horas (120 min)</option>
                    <option value={180}>3 horas (180 min)</option>
                    <option value={240}>4 horas (240 min)</option>
                    <option value={360}>Día completo (6 hrs)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-medium text-slate-600 mb-1">
                    Dirección de servicio
                  </label>
                  <input
                    type="text"
                    value={workOrderAddress}
                    onChange={(e) => setWorkOrderAddress(e.target.value)}
                    placeholder="Calle, número, colonia..."
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="positive"
                  size="lg"
                  disabled={isSubmittingWorkOrder || workOrderIsPast || workOrderConflict.hasConflict}
                  icon={<Calendar className="w-5 h-5 text-white" />}
                >
                  {isSubmittingWorkOrder ? 'Generando orden de trabajo...' : 'Confirmar y programar en calendario'}
                </Button>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  La cotización avanzará a estado "Agendado" y se registrará en la agenda técnica.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTRAR PAGO (CON CANDADO ANTI-DUPLICADOS) ================= */}
      {isRecordPaymentOpen && activeQuote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-base text-[#07326F]">
                  Registrar pago
                </h3>
                <p className="text-xs text-slate-400">
                  {activeQuote.clientName} · {activeQuote.quoteNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isSubmittingPayment && setIsRecordPaymentOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-3.5">
              {/* Tipo de pago */}
              <div>
                <label className="block text-xs font-heading font-semibold text-slate-600 mb-1">
                  Tipo de registro
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'anticipo', label: 'Anticipo' },
                    { id: 'abono', label: 'Abono parcial' },
                    { id: 'liquidacion', label: 'Liquidación' },
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => {
                        setPaymentType(t.id as any);
                        if (t.id === 'liquidacion') {
                          setPaymentAmount(activeQuote.balanceDue);
                        }
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-heading font-semibold border transition-all cursor-pointer ${
                        paymentType === t.id
                          ? 'bg-[#07326F] text-white border-[#07326F]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monto a registrar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-heading font-semibold text-slate-600">
                    Monto recibido (MXN)
                  </label>
                  <span className="text-[11px] text-amber-600 font-semibold">
                    Saldo max: ${activeQuote.balanceDue}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={activeQuote.balanceDue}
                    step="0.01"
                    required
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] font-heading font-bold text-base text-[#07326F] bg-slate-50/50"
                  />
                </div>

                {/* Quick amount shortcuts */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Math.round(activeQuote.total * 0.5))}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    50% ($ {Math.round(activeQuote.total * 0.5)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(activeQuote.balanceDue)}
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer font-semibold"
                  >
                    Liquidar saldo ($ {activeQuote.balanceDue})
                  </button>
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-xs font-heading font-semibold text-slate-600 mb-1">
                  Método de cobro
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'cash', label: 'Efectivo', icon: Banknote },
                    { id: 'transfer', label: 'Transferencia', icon: CreditCard },
                    { id: 'payment_link', label: 'Digital', icon: CreditCard },
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`py-2 px-1.5 rounded-xl text-xs font-heading font-medium flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? 'bg-[#19AA83]/15 text-[#07326F] border-[#19AA83] font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#19AA83]" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notas opcionales */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Referencia o nota opcional
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ej. Efectivo entregado en mano, SPEI 9940..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50/50"
                />
              </div>

              {/* Submit with Strict Anti-Duplicate Lock */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="positive"
                  size="lg"
                  disabled={isSubmittingPayment || paymentAmount <= 0 || paymentAmount > activeQuote.balanceDue + 0.05}
                  icon={<ShieldCheck className="w-5 h-5 text-white" />}
                >
                  {isSubmittingPayment ? 'Registrando y bloqueando reintentos...' : 'Confirmar pago y emitir comprobante'}
                </Button>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  Candado activo: protege contra doble clic accidental y recalcula saldos en tiempo real.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NUEVA COTIZACIÓN ================= */}
      {isNewQuoteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-base text-[#07326F]">
                  Crear cotización formal
                </h3>
                <p className="text-xs text-slate-500">
                  Fórmula financiera: Precio base = Costo / (1 - Margen)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewQuoteOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewQuote} className="space-y-3.5">
              {/* Cliente */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                    Nombre del cliente
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ej. Roberto Sánchez"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#07326F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                    Teléfono (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="55 1234 5678"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#07326F]"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                  Dirección del cliente (Opcional)
                </label>
                <input
                  type="text"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  placeholder="Ej. Av. Universidad 1200, Col. del Valle"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
                />
              </div>

              {/* Servicio */}
              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                  Servicio a cotizar
                </label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Ej. Instalación de luminarias y pintura"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#07326F]"
                />
              </div>

              {/* Costos: Materiales + Mano de Obra */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Materiales ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newMaterialsCost}
                    onChange={(e) => setNewMaterialsCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#07326F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Horas
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={newLaborHours}
                    onChange={(e) => setNewLaborHours(Math.max(0.5, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#07326F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    $/Hora
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={newRatePerHour}
                    onChange={(e) => setNewRatePerHour(Math.max(10, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#07326F]"
                  />
                </div>
              </div>

              {/* Margen sobre ventas */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-heading font-semibold text-slate-600">Margen objetivo sobre venta</span>
                  <span className="font-bold text-[#07326F] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {newTargetMargin}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={newTargetMargin}
                  onChange={(e) => setNewTargetMargin(Number(e.target.value))}
                  className="w-full accent-[#07326F] cursor-pointer"
                />
              </div>

              {/* Descuentos e IVA */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block font-medium text-slate-500 mb-1">
                    Descuento ($ MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                    placeholder="0"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-1.5 cursor-pointer py-1.5">
                    <input
                      type="checkbox"
                      checked={newApplyTax}
                      onChange={(e) => setNewApplyTax(e.target.checked)}
                      className="w-4 h-4 rounded text-[#07326F]"
                    />
                    <span className="font-semibold text-slate-700">IVA 16%</span>
                  </label>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Costo materiales + mano de obra:</span>
                  <span className="font-semibold">${newCalcPreview.totalCost}</span>
                </div>
                <div className="flex justify-between text-[#07326F]">
                  <span>Subtotal (Precio base por margen):</span>
                  <span className="font-bold">${newCalcPreview.subtotal}</span>
                </div>
                <div className="pt-1 border-t border-slate-200 flex justify-between font-heading font-bold text-sm text-[#07326F]">
                  <span>Total cotización final:</span>
                  <span className="text-[#19AA83]">${newCalcPreview.finalTotal} MXN</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="positive"
                  size="lg"
                  icon={<ArrowRight className="w-5 h-5 text-white" />}
                >
                  Guardar cotización y abrir cobranza
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE NOTA DE SERVICIO / RECIBO INTERNO (CON LEYENDA CFDI) ================= */}
      {isInternalReceiptOpen && activeReceiptData && (
        <InternalReceiptModal
          isOpen={isInternalReceiptOpen}
          onClose={() => setIsInternalReceiptOpen(false)}
          data={activeReceiptData}
        />
      )}

      {/* Clean Freemium Limit Modal */}
      <FreemiumLimitModal
        isOpen={showFreemiumModal}
        onClose={() => setShowFreemiumModal(false)}
        onActivatePlan={activateProSubscription}
        serviceCount={userProfile?.servicios_realizados ?? 5}
      />
    </div>
  );
};
