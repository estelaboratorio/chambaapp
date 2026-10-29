import { Appointment, Business, CalculatorState, Charge, Client } from '../types';

export const initialBusinessProfile = {
  id: 'biz_demo_ana',
  ownerId: 'usr_demo_ana',
  name: 'Servicios de Limpieza Ana',
  ownerName: 'Ana',
  businessName: 'Servicios de Limpieza Ana',
  category: 'Limpieza',
  categoryIcon: '🧹',
  primaryService: 'Limpieza del hogar',
  defaultPrice: 500,
  defaultDuration: '3 horas',
  workingDays: 'Lunes a sábado',
  workingHours: '9:00 AM — 6:00 PM',
  phone: '+52 55 1234 5678',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const initialAppointments: Appointment[] = [
  {
    id: 'apt-1',
    businessId: 'biz_demo_ana',
    clientId: 'cli-1',
    clientName: 'María López',
    clientPhone: '55 9876 5432',
    serviceId: 'srv-1',
    serviceName: 'Limpieza del hogar',
    date: 'Sáb 24 oct',
    dateISO: '2026-10-24',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    durationMinutes: 60,
    technician: 'Técnico principal',
    price: 500,
    status: 'confirmed',
    notes: 'Limpieza profunda de sala, cocina y 2 recámaras. Traer líquidos desinfectantes.',
    address: 'Av. Insurgentes Sur 1450, Col. Actipan',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        id: 'log-apt-1-init',
        action: 'created',
        timestamp: new Date().toISOString(),
        newDate: 'Sáb 24 oct',
        newStartTime: '10:00 AM',
        newTechnician: 'Técnico principal',
        newStatus: 'confirmed',
        notes: 'Cita confirmada con cliente habitual',
      }
    ]
  },
  {
    id: 'apt-2',
    businessId: 'biz_demo_ana',
    clientId: 'cli-2',
    clientName: 'Carlos García',
    clientPhone: '55 4321 8765',
    serviceId: 'srv-1',
    serviceName: 'Limpieza del hogar',
    date: 'Sáb 24 oct',
    dateISO: '2026-10-24',
    startTime: '2:00 PM',
    endTime: '3:00 PM',
    durationMinutes: 60,
    technician: 'Carlos Mendoza (Técnico 1)',
    price: 350,
    status: 'pending',
    notes: 'Limpieza estándar de departamento 1 recámara.',
    address: 'Calle Durango 88, Col. Roma Norte',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        id: 'log-apt-2-init',
        action: 'created',
        timestamp: new Date().toISOString(),
        newDate: 'Sáb 24 oct',
        newStartTime: '2:00 PM',
        newTechnician: 'Carlos Mendoza (Técnico 1)',
        newStatus: 'pending',
        notes: 'Cita registrada pendiente de confirmación',
      }
    ]
  },
];

export const initialClients: Client[] = [
  {
    id: 'cli-1',
    businessId: 'biz_demo_ana',
    name: 'María López',
    phone: '55 9876 5432',
    address: 'Av. Insurgentes Sur 1450',
    totalServices: 6,
    totalPaid: 3200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cli-2',
    businessId: 'biz_demo_ana',
    name: 'Carlos García',
    phone: '55 4321 8765',
    address: 'Calle Durango 88',
    totalServices: 3,
    totalPaid: 1050,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const initialCalculatorData: CalculatorState = {
  service: 'Limpieza del hogar',
  materialsCost: 80,
  transportCost: 50,
  otherCost: 20,
  hoursWorked: 4,
  ratePerHour: 150,
};

export const initialCharge: Charge = {
  id: 'chg-1001',
  businessId: 'biz_demo_ana',
  clientId: 'cli-1',
  clientName: 'María López',
  serviceName: 'Limpieza del hogar',
  receiptNumber: 'RECIBO #000124',
  amount: 750,
  concept: 'Limpieza del hogar',
  method: 'payment_link',
  status: 'pending',
  date: '3 octubre 2026',
  shareUrl: 'https://chambaapp.me/pago/chg-1001',
  createdAt: new Date().toISOString(),
};
