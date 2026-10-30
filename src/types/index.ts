export type Screen = 
  | 'welcome'
  | 'auth'
  | 'onboarding'
  | 'home'
  | 'appointments'
  | 'new-appointment'
  | 'calculator'
  | 'calculator-result'
  | 'charge'
  | 'receipt'
  | 'quotes'
  | 'assistant'
  | 'clients'
  | 'client-detail'
  | 'business'
  | 'services-manager'
  | 'plan-manager'
  | 'public-card'
  | 'public-booking';

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
export type PaymentStatus = 'pending' | 'paid' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'transfer' | 'payment_link';
export type PaymentRecordType = 'anticipo' | 'abono' | 'liquidacion';
export type QuoteStatus = 'borrador' | 'pendiente' | 'con_anticipo' | 'abonos' | 'liquidada' | 'cancelada';

// Máquina de estados estricta del ciclo de vida de órdenes de servicio y cotizaciones
export type ServiceOrderStatus = 
  | 'solicitud'
  | 'cotizado'
  | 'aprobado'
  | 'rechazado'
  | 'agendado'
  | 'en_ejecucion'
  | 'completado'
  | 'cobrado';

export interface ServiceOrderTransitionLog {
  id: string;
  fromStatus: ServiceOrderStatus;
  toStatus: ServiceOrderStatus;
  timestamp: string;
  reason?: string;
  notes?: string;
  author?: string;
}

export type PlanType = 'free' | 'pro' | 'pro_payments';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  servicios_realizados: number; // Inicia en 0
  has_subscription?: boolean; // Suscripción activa mensual $250 MXN
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  category: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  serviceArea?: string;
  logoUrl?: string;
  primaryService?: string;
  defaultPrice?: number;
  workingDays?: string;
  workingHours?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  basePrice: number;
  durationMinutes: number;
  active: boolean;
  isPrimary?: boolean;
  priority?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  businessId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  totalServices?: number;
  totalPaid?: number;
}

export interface AppointmentChangeLog {
  id: string;
  action: 'created' | 'rescheduled' | 'cancelled' | 'status_change';
  timestamp: string;
  reason?: string;
  previousDate?: string;
  previousStartTime?: string;
  previousEndTime?: string;
  previousTechnician?: string;
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  newTechnician?: string;
  previousStatus?: AppointmentStatus;
  newStatus?: AppointmentStatus;
  notes?: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  serviceId: string;
  serviceName: string;
  date: string; // e.g. YYYY-MM-DD or readable formatted
  dateISO?: string; // YYYY-MM-DD
  startTime: string; // e.g. 10:00 AM
  endTime?: string;
  durationMinutes?: number;
  technician?: string;
  technicianId?: string;
  price: number;
  status: AppointmentStatus;
  
  // Enlace y ciclo de vida de la orden de servicio
  quoteId?: string;
  quoteNumber?: string;
  serviceOrderStatus?: ServiceOrderStatus;
  materialsCost?: number;
  laborCost?: number;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalPaid?: number;
  balanceDue?: number;
  
  notes?: string;
  address?: string;
  cancellationReason?: string;
  rescheduleReason?: string;
  history?: AppointmentChangeLog[];
  createdAt: string;
  updatedAt: string;
}

// Aliases for legacy mock data / compatibility
export type BusinessProfile = Business & {
  ownerName: string;
  businessName: string;
  defaultPrice: number;
  defaultDuration: string;
  workingDays: string;
  workingHours: string;
  categoryIcon: string;
  primaryService: string;
};

export type CalculatorState = {
  service: string;
  materialsCost: number;
  transportCost: number;
  otherCost: number;
  hoursWorked: number;
  ratePerHour: number;
  targetMargin?: number;
  discountAmount?: number;
  taxRate?: number;
};

export type Charge = Payment & {
  receiptNumber: string;
  concept: string;
  date: string;
  shareUrl?: string;
};

export interface PricingCalculation {
  id: string;
  businessId: string;
  serviceId?: string;
  serviceName?: string;
  materials: number;
  transport: number;
  otherExpenses: number;
  hoursWorked: number;
  desiredHourlyProfit: number;
  totalExpenses: number;
  recommendedPrice: number;
  createdAt: string;

  // Desglose financiero por margen sobre ventas
  materialsCost?: number;
  laborCost?: number;
  totalCost?: number;
  targetMargin?: number; // 0 <= targetMargin < 1
  basePrice?: number; // totalCost / (1 - targetMargin)
  subtotal?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  finalTotal?: number;
}

export interface QuotePayment {
  id: string;
  quoteId: string;
  idempotencyKey: string;
  type: PaymentRecordType;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string;
  receiptNumber?: string;
}

export interface Quote {
  id: string;
  businessId: string;
  quoteNumber: string; // e.g. COT-0001
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  serviceId?: string;
  serviceName: string;
  description?: string;
  technician?: string;
  
  // Desglose financiero
  materialsCost: number;
  laborCost: number;
  totalCost: number; // materials + labor
  targetMargin: number; // 0 <= targetMargin < 1
  basePrice: number; // totalCost / (1 - targetMargin)
  subtotal: number; // = basePrice
  discountAmount: number;
  taxRate: number; // e.g. 0.16 o 0
  taxAmount: number;
  total: number; // total final
  
  // Cobranza y saldos
  payments: QuotePayment[];
  totalPaid: number;
  balanceDue: number; // Saldo pendiente recalculado
  status: QuoteStatus;

  // Ciclo de vida estricto: Solicitud -> Cotizado -> Aprobado/Rechazado -> Agendado -> En Ejecución -> Completado -> Cobrado
  serviceOrderStatus: ServiceOrderStatus;
  statusHistory?: ServiceOrderTransitionLog[];
  appointmentId?: string; // ID de la orden de trabajo agendada
  scheduledDate?: string;
  scheduledTime?: string;
  
  createdAt: string;
  updatedAt: string;
  validUntil?: string;
}

export interface InternalServiceReceiptData {
  folio: string; // e.g. NS-000124 o REC-COT-0001
  quoteNumber?: string;
  date: string;
  businessName: string;
  businessCategory?: string;
  businessPhone?: string;
  businessCity?: string;
  businessServiceArea?: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  serviceName: string;
  serviceDescription?: string;
  technician?: string;
  orderStatus: ServiceOrderStatus | AppointmentStatus;
  executionDate?: string;
  
  // Costos desglosados
  materialsCost: number;
  laborCost: number;
  subtotal: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  
  // Cobranza y saldo pagado
  payments: QuotePayment[];
  totalPaid: number;
  balanceDue: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface Payment {
  id: string;
  businessId: string;
  clientId: string;
  clientName: string;
  appointmentId?: string;
  serviceName: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  paymentUrl?: string;
  mercadoPagoFee?: number;
  chambaAppFee?: number;
  sellerNetAmount?: number;
  createdAt: string;
  paidAt?: string;
}

export interface Receipt {
  id: string;
  businessId: string;
  clientId: string;
  clientName: string;
  appointmentId?: string;
  receiptNumber: string; // e.g. REC-000124
  serviceName: string;
  amount: number;
  status: 'paid' | 'pending' | 'cancelled';
  issuedAt: string;
  paymentMethod?: PaymentMethod;
}

export interface Subscription {
  id: string;
  userId: string;
  businessId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  currency: string;
  amount: number;
  trialStart?: string;
  trialEnd?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  provider?: string;
  providerSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentConnection {
  id: string;
  businessId: string;
  provider: 'mercadopago';
  providerUserId?: string;
  status: 'connected' | 'disconnected' | 'pending';
  connectedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConfig {
  freePlanMaxClients: number;
  proMonthlyPriceMXN: number;
  proPaymentsMonthlyPriceMXN: number;
  platformFeePercentage: number; // e.g. 3.5%
  supportEmail: string;
}
