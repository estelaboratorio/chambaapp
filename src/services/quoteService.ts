import { Quote, QuotePayment, PaymentRecordType, PaymentMethod, QuoteStatus, Receipt } from '../types';

export interface MarginCalculationInput {
  materialsCost: number;
  laborCost: number;
  targetMargin: number; // 0 <= targetMargin < 1 (e.g. 0.30 for 30%)
  discountAmount?: number;
  taxRate?: number; // e.g. 0.16 or 0
}

export interface MarginCalculationResult {
  materialsCost: number;
  laborCost: number;
  totalCost: number;
  targetMargin: number;
  profitAmount: number;
  basePrice: number;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  finalTotal: number;
}

/**
 * Cálculo de precio base por margen sobre ventas:
 * Fórmula financiera estricta: precio_base = costo_total / (1 - margen_objetivo)
 * Donde 0 <= margen_objetivo < 1.
 * Asegura que NO se aplique como un simple recargo sobre costo (markup).
 */
export function calculateFinancialQuote(input: MarginCalculationInput): MarginCalculationResult {
  const materialsCost = Math.max(0, Number(input.materialsCost) || 0);
  const laborCost = Math.max(0, Number(input.laborCost) || 0);
  const totalCost = Math.round((materialsCost + laborCost) * 100) / 100;

  // Validación y acotación estricta: 0 <= margen_objetivo < 1
  let rawMargin = Number(input.targetMargin);
  if (isNaN(rawMargin) || rawMargin < 0) {
    rawMargin = 0;
  }
  // No permitir que el margen sea >= 1 (evita división por cero o precio infinito/negativo)
  if (rawMargin >= 0.99) {
    rawMargin = 0.99;
  }

  // precio_base = costo_total / (1 - margen_objetivo)
  const denominator = 1 - rawMargin;
  const rawBasePrice = denominator > 0 && totalCost > 0 ? totalCost / denominator : totalCost;
  const basePrice = Math.round(rawBasePrice * 100) / 100;
  const subtotal = basePrice;
  const profitAmount = Math.max(0, Math.round((basePrice - totalCost) * 100) / 100);

  // Descuentos aplicables
  const rawDiscount = Math.max(0, Number(input.discountAmount) || 0);
  const discountAmount = Math.min(subtotal, Math.round(rawDiscount * 100) / 100);
  const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  // Impuestos aplicables (ej. IVA 16% o configurable)
  const rawTaxRate = Math.max(0, Number(input.taxRate) || 0);
  const taxAmount = Math.round(taxableAmount * rawTaxRate * 100) / 100;

  // Total final
  const finalTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    materialsCost,
    laborCost,
    totalCost,
    targetMargin: rawMargin,
    profitAmount,
    basePrice,
    subtotal,
    discountAmount,
    taxableAmount,
    taxRate: rawTaxRate,
    taxAmount,
    finalTotal,
  };
}

/**
 * Recalcula automáticamente el saldo pendiente y el estado de la cotización:
 * saldo_pendiente = total_cotizacion - suma(pagos_registrados)
 */
export function recalculateQuoteBalances(quote: Quote): Quote {
  const payments = Array.isArray(quote.payments) ? quote.payments : [];
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const cleanTotal = Math.max(0, Number(quote.total) || 0);
  const balanceDue = Math.max(0, Math.round((cleanTotal - totalPaid) * 100) / 100);

  let status: QuoteStatus = 'pendiente';
  if (cleanTotal > 0 && balanceDue <= 0.01) {
    status = 'liquidada';
  } else if (payments.some(p => p.type === 'anticipo')) {
    status = 'con_anticipo';
  } else if (payments.length > 0) {
    status = 'abonos';
  } else {
    status = 'pendiente';
  }

  return {
    ...quote,
    totalPaid: Math.round(totalPaid * 100) / 100,
    balanceDue,
    status,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Registro de pagos con control de duplicados e idempotencia estricta
 */
export interface RecordPaymentParams {
  quote: Quote;
  type: PaymentRecordType;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  idempotencyKey: string;
}

export interface RecordPaymentResult {
  success: boolean;
  error?: string;
  isDuplicate?: boolean;
  updatedQuote?: Quote;
  payment?: QuotePayment;
  receipt?: Receipt;
}

// In-memory set of recently processed idempotency keys across the application session
const sessionProcessedKeys = new Set<string>();
const recentPaymentTimestamps: { quoteId: string; amount: number; time: number }[] = [];

export function recordQuotePayment(params: RecordPaymentParams): RecordPaymentResult {
  const { quote, type, amount, method, notes, idempotencyKey } = params;

  // 1. Candado de Idempotencia: Verificar si esta clave ya fue procesada
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    return {
      success: false,
      error: 'Clave de idempotencia inválida.',
    };
  }

  if (sessionProcessedKeys.has(idempotencyKey)) {
    return {
      success: false,
      isDuplicate: true,
      error: 'Este pago ya fue procesado. Se bloqueó el reintento duplicado accidental.',
    };
  }

  // 2. Verificar si en la cotización ya existe un pago con la misma clave
  const existingWithKey = quote.payments.find(p => p.idempotencyKey === idempotencyKey);
  if (existingWithKey) {
    return {
      success: false,
      isDuplicate: true,
      error: 'Este pago ya se encuentra registrado en la cotización.',
    };
  }

  // 3. Candado temporal contra doble clic accidental (mismo monto y cotización en menos de 3.5 segundos)
  const now = Date.now();
  const duplicateBurst = recentPaymentTimestamps.find(
    entry => entry.quoteId === quote.id && entry.amount === amount && now - entry.time < 3500
  );
  if (duplicateBurst) {
    return {
      success: false,
      isDuplicate: true,
      error: 'Se detectó un doble clic accidental. El pago ya fue registrado.',
    };
  }

  // 4. Validación de montos y saldos
  const cleanAmount = Math.round(Number(amount) * 100) / 100;
  if (cleanAmount <= 0) {
    return {
      success: false,
      error: 'El monto a registrar debe ser mayor a $0.',
    };
  }

  if (cleanAmount > quote.balanceDue + 0.05) {
    return {
      success: false,
      error: `El monto ($${cleanAmount}) excede el saldo pendiente ($${quote.balanceDue}).`,
    };
  }

  // 5. Registrar clave en memoria para evitar colisiones
  sessionProcessedKeys.add(idempotencyKey);
  recentPaymentTimestamps.push({ quoteId: quote.id, amount: cleanAmount, time: now });
  // Limpiar memoria vieja si crece demasiado
  if (recentPaymentTimestamps.length > 50) {
    recentPaymentTimestamps.splice(0, 20);
  }

  const receiptNumber = `REC-COT-${String(Date.now()).slice(-6)}`;
  const paymentId = `qpay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const paymentDate = new Date().toISOString();

  const newPayment: QuotePayment = {
    id: paymentId,
    quoteId: quote.id,
    idempotencyKey,
    type,
    amount: cleanAmount,
    method,
    date: paymentDate,
    notes: notes?.trim() || undefined,
    receiptNumber,
  };

  const updatedPayments = [...(quote.payments || []), newPayment];
  const updatedQuote = recalculateQuoteBalances({
    ...quote,
    payments: updatedPayments,
  });

  const receipt: Receipt = {
    id: `rec_${paymentId}`,
    businessId: quote.businessId,
    clientId: quote.clientId || 'cli_general',
    clientName: quote.clientName,
    receiptNumber,
    serviceName: `${quote.serviceName} (${type === 'anticipo' ? 'Anticipo' : type === 'abono' ? 'Abono parcial' : 'Liquidación'})`,
    amount: cleanAmount,
    status: 'paid',
    issuedAt: paymentDate,
    paymentMethod: method,
  };

  return {
    success: true,
    updatedQuote,
    payment: newPayment,
    receipt,
  };
}

export function generateIdempotencyKey(): string {
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
