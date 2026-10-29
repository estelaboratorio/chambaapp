import { ServiceOrderStatus, ServiceOrderTransitionLog } from '../types';

export interface StepMetadata {
  id: ServiceOrderStatus;
  stepNumber: number;
  label: string;
  shortLabel: string;
  description: string;
  color: string; // Tailwind color token
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const SERVICE_ORDER_STEPS: Record<ServiceOrderStatus, StepMetadata> = {
  solicitud: {
    id: 'solicitud',
    stepNumber: 1,
    label: '1. Solicitud',
    shortLabel: 'Solicitud',
    description: 'Solicitud inicial del cliente pendiente de costeo y margen.',
    color: 'slate',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-800',
    borderClass: 'border-slate-300',
  },
  cotizado: {
    id: 'cotizado',
    stepNumber: 2,
    label: '2. Cotizado',
    shortLabel: 'Cotizado',
    description: 'Cotización calculada con margen sobre ventas, lista para decisión del cliente.',
    color: 'blue',
    bgClass: 'bg-blue-100',
    textClass: 'text-[#07326F]',
    borderClass: 'border-blue-300',
  },
  aprobado: {
    id: 'aprobado',
    stepNumber: 3,
    label: '3. Aprobado',
    shortLabel: 'Aprobado',
    description: 'Autorizada por el cliente. Habilitada para generar orden de trabajo en agenda.',
    color: 'emerald',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-300',
  },
  rechazado: {
    id: 'rechazado',
    stepNumber: 3,
    label: 'Rechazado',
    shortLabel: 'Rechazado',
    description: 'El cliente declinó la cotización.',
    color: 'rose',
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-300',
  },
  agendado: {
    id: 'agendado',
    stepNumber: 4,
    label: '4. Agendado',
    shortLabel: 'Agendado',
    description: 'Orden de trabajo formal programada con fecha, hora y técnico.',
    color: 'indigo',
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-800',
    borderClass: 'border-indigo-300',
  },
  en_ejecucion: {
    id: 'en_ejecucion',
    stepNumber: 5,
    label: '5. En Ejecución',
    shortLabel: 'En Ejecución',
    description: 'El técnico o prestador se encuentra en sitio realizando el servicio.',
    color: 'amber',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-300',
  },
  completado: {
    id: 'completado',
    stepNumber: 6,
    label: '6. Completado',
    shortLabel: 'Completado',
    description: 'Trabajo operativo concluido. Emite Nota de Servicio / Comprobante Interno.',
    color: 'teal',
    bgClass: 'bg-teal-100',
    textClass: 'text-teal-800',
    borderClass: 'border-teal-300',
  },
  cobrado: {
    id: 'cobrado',
    stepNumber: 7,
    label: '7. Cobrado',
    shortLabel: 'Cobrado',
    description: 'Saldo 100% liquidado y registrado con comprobante de pago interno.',
    color: 'emerald',
    bgClass: 'bg-emerald-600 text-white',
    textClass: 'text-emerald-950 font-bold',
    borderClass: 'border-emerald-500',
  },
};

/**
 * Regla de Oro requerida:
 * No permitas generar órdenes de trabajo a partir de cotizaciones que no hayan
 * sido marcadas expresamente como "Aprobadas".
 */
export function canGenerateWorkOrder(status: ServiceOrderStatus): boolean {
  return status === 'aprobado';
}

/**
 * Matriz estricta de transiciones de estado permitidas:
 * Solicitud -> Cotizado -> Aprobado/Rechazado -> Agendado -> En Ejecución -> Completado -> Cobrado
 */
export const ALLOWED_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  solicitud: ['cotizado', 'rechazado'],
  cotizado: ['aprobado', 'rechazado'],
  rechazado: ['cotizado'], // Permite recotizar si el cliente renegocia
  aprobado: ['agendado', 'rechazado'], // Solo desde 'aprobado' se permite 'agendado' (orden de trabajo)
  agendado: ['en_ejecucion', 'rechazado'],
  en_ejecucion: ['completado'],
  completado: ['cobrado'], // Se traslada a cobrado al liquidar o confirmar pago total
  cobrado: [], // Estado terminal
};

export function isTransitionAllowed(from: ServiceOrderStatus, to: ServiceOrderStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function createServiceOrderTransitionLog(
  fromStatus: ServiceOrderStatus,
  toStatus: ServiceOrderStatus,
  reason?: string,
  notes?: string
): ServiceOrderTransitionLog {
  return {
    id: `log_trans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    fromStatus,
    toStatus,
    timestamp: new Date().toISOString(),
    reason,
    notes,
  };
}

export const ORDER_LIFECYCLE_SEQUENCE: ServiceOrderStatus[] = [
  'solicitud',
  'cotizado',
  'aprobado',
  'agendado',
  'en_ejecucion',
  'completado',
  'cobrado',
];
