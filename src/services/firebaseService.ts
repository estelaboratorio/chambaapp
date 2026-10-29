import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  UserProfile, 
  Business, 
  Service, 
  Client, 
  Appointment, 
  PricingCalculation, 
  Payment, 
  Receipt, 
  Subscription, 
  PaymentConnection,
  Quote 
} from '../types';

// ================= USER OPERATIONS =================
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(user: UserProfile): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ================= BUSINESS OPERATIONS =================
export async function getBusinessByOwner(ownerId: string): Promise<Business | null> {
  const path = 'businesses';
  try {
    const q = query(collection(db, path), where('ownerId', '==', ownerId), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as Business;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveBusiness(business: Business): Promise<void> {
  const path = `businesses/${business.id}`;
  try {
    await setDoc(doc(db, 'businesses', business.id), business, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateBusiness(businessId: string, updates: Partial<Business>): Promise<void> {
  const path = `businesses/${businessId}`;
  try {
    await updateDoc(doc(db, 'businesses', businessId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ================= SERVICES OPERATIONS =================
export async function getServices(businessId: string): Promise<Service[]> {
  if (!businessId) return [];
  const path = `businesses/${businessId}/services`;
  try {
    const q = query(
      collection(db, 'businesses', businessId, 'services'),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Service);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveService(businessId: string, service: Service): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const serviceWithTenant: Service = {
    ...service,
    businessId,
  };
  const path = `businesses/${businessId}/services/${service.id}`;
  try {
    await setDoc(doc(db, 'businesses', businessId, 'services', service.id), serviceWithTenant, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateService(businessId: string, serviceId: string, updates: Partial<Service>): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const path = `businesses/${businessId}/services/${serviceId}`;
  try {
    await updateDoc(doc(db, 'businesses', businessId, 'services', serviceId), {
      ...updates,
      businessId, // Preserva siempre la pertenencia al tenant
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ================= CLIENTS OPERATIONS =================
export async function getClients(businessId: string): Promise<Client[]> {
  if (!businessId) return [];
  const path = `businesses/${businessId}/clients`;
  try {
    const q = query(
      collection(db, 'businesses', businessId, 'clients'),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Client);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveClient(businessId: string, client: Client): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const clientWithTenant: Client = {
    ...client,
    businessId,
  };
  const path = `businesses/${businessId}/clients/${client.id}`;
  try {
    await setDoc(doc(db, 'businesses', businessId, 'clients', client.id), clientWithTenant, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateClient(businessId: string, clientId: string, updates: Partial<Client>): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const path = `businesses/${businessId}/clients/${clientId}`;
  try {
    await updateDoc(doc(db, 'businesses', businessId, 'clients', clientId), {
      ...updates,
      businessId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ================= APPOINTMENTS OPERATIONS =================
export async function getAppointments(businessId: string): Promise<Appointment[]> {
  if (!businessId) return [];
  const path = `businesses/${businessId}/appointments`;
  try {
    const q = query(
      collection(db, 'businesses', businessId, 'appointments'),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Appointment);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function checkAppointmentConflict(
  businessId: string, 
  date: string, 
  startTime: string, 
  excludeAppointmentId?: string
): Promise<boolean> {
  if (!businessId) return false;
  try {
    const appointments = await getAppointments(businessId);
    return appointments.some(apt => 
      apt.id !== excludeAppointmentId && 
      apt.businessId === businessId &&
      apt.date.toLowerCase() === date.toLowerCase() && 
      apt.startTime.toLowerCase() === startTime.toLowerCase() && 
      apt.status !== 'cancelled'
    );
  } catch {
    return false;
  }
}

export async function saveAppointment(businessId: string, appointment: Appointment): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const appointmentWithTenant: Appointment = {
    ...appointment,
    businessId,
  };
  const path = `businesses/${businessId}/appointments/${appointment.id}`;
  try {
    await setDoc(doc(db, 'businesses', businessId, 'appointments', appointment.id), appointmentWithTenant, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateAppointment(
  businessId: string, 
  appointmentId: string, 
  updates: Partial<Appointment>
): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const path = `businesses/${businessId}/appointments/${appointmentId}`;
  try {
    await setDoc(doc(db, 'businesses', businessId, 'appointments', appointmentId), {
      ...updates,
      businessId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ================= PRICING CALCULATIONS =================
export async function saveCalculation(businessId: string, calc: PricingCalculation): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const calcWithTenant: PricingCalculation = {
    ...calc,
    businessId,
  };
  const path = `businesses/${businessId}/pricingCalculations/${calc.id}`;
  try {
    await setDoc(doc(db, 'businesses', businessId, 'pricingCalculations', calc.id), calcWithTenant);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getCalculations(businessId: string): Promise<PricingCalculation[]> {
  if (!businessId) return [];
  const path = `businesses/${businessId}/pricingCalculations`;
  try {
    const q = query(
      collection(db, 'businesses', businessId, 'pricingCalculations'),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as PricingCalculation);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// ================= QUOTES (COTIZACIONES) OPERATIONS =================
export async function getQuotes(businessId: string): Promise<Quote[]> {
  if (!businessId) return [];
  const path = `businesses/${businessId}/quotes`;
  try {
    const q = query(
      collection(db, 'businesses', businessId, 'quotes'),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Quote);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveQuote(businessId: string, quote: Quote): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const quoteWithTenant: Quote = {
    ...quote,
    businessId,
  };
  const path = `businesses/${businessId}/quotes/${quote.id}`;
  try {
    await setDoc(doc(db, 'businesses', businessId, 'quotes', quote.id), quoteWithTenant, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuote(businessId: string, quoteId: string): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const path = `businesses/${businessId}/quotes/${quoteId}`;
  try {
    await deleteDoc(doc(db, 'businesses', businessId, 'quotes', quoteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ================= PAYMENTS OPERATIONS =================
export async function getPayments(businessId: string): Promise<Payment[]> {
  if (!businessId) return [];
  const path = `businesses/${businessId}/payments`;
  try {
    const q = query(
      collection(db, 'businesses', businessId, 'payments'),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Payment);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function savePayment(businessId: string, payment: Payment): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const paymentWithTenant: Payment = {
    ...payment,
    businessId,
  };
  const path = `businesses/${businessId}/payments/${payment.id}`;
  try {
    await setDoc(doc(db, 'businesses', businessId, 'payments', payment.id), paymentWithTenant, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updatePaymentStatus(
  businessId: string, 
  paymentId: string, 
  status: Payment['status'], 
  paidAt?: string
): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const path = `businesses/${businessId}/payments/${paymentId}`;
  try {
    const updates: Partial<Payment> = { status, businessId };
    if (paidAt) updates.paidAt = paidAt;
    await updateDoc(doc(db, 'businesses', businessId, 'payments', paymentId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ================= RECEIPTS OPERATIONS =================
export async function getReceipts(businessId: string): Promise<Receipt[]> {
  if (!businessId) return [];
  const path = `businesses/${businessId}/receipts`;
  try {
    const q = query(
      collection(db, 'businesses', businessId, 'receipts'),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Receipt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveReceipt(businessId: string, receipt: Receipt): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const receiptWithTenant: Receipt = {
    ...receipt,
    businessId,
  };
  const path = `businesses/${businessId}/receipts/${receipt.id}`;
  try {
    await setDoc(doc(db, 'businesses', businessId, 'receipts', receipt.id), receiptWithTenant, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getNextReceiptNumber(businessId: string): Promise<string> {
  if (!businessId) return 'REC-000001';
  try {
    const receipts = await getReceipts(businessId);
    const count = receipts.length + 1;
    return `REC-${String(count).padStart(6, '0')}`;
  } catch {
    return `REC-000001`;
  }
}

// ================= SUBSCRIPTION OPERATIONS =================
export async function getSubscription(businessId: string): Promise<Subscription | null> {
  if (!businessId) return null;
  const path = `businesses/${businessId}/subscriptions`;
  try {
    const q = query(
      collection(db, 'businesses', businessId, 'subscriptions'),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as Subscription;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null;
  }
}

export async function saveSubscription(businessId: string, subscription: Subscription): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const subWithTenant: Subscription = {
    ...subscription,
    businessId,
  };
  const path = `businesses/${businessId}/subscriptions/${subscription.id}`;
  try {
    await setDoc(doc(db, 'businesses', businessId, 'subscriptions', subscription.id), subWithTenant, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ================= PAYMENT CONNECTIONS (MERCADO PAGO) =================
export async function getPaymentConnection(businessId: string): Promise<PaymentConnection | null> {
  if (!businessId) return null;
  const path = `businesses/${businessId}/paymentConnections`;
  try {
    const q = query(
      collection(db, 'businesses', businessId, 'paymentConnections'),
      where('businessId', '==', businessId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as PaymentConnection;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null;
  }
}

export async function savePaymentConnection(businessId: string, connection: PaymentConnection): Promise<void> {
  if (!businessId) throw new Error('Aislamiento de cuenta: businessId es obligatorio.');
  const connWithTenant: PaymentConnection = {
    ...connection,
    businessId,
  };
  const path = `businesses/${businessId}/paymentConnections/${connection.id}`;
  try {
    await setDoc(doc(db, 'businesses', businessId, 'paymentConnections', connection.id), connWithTenant, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ================= DEMO DATA SEEDER =================
export async function seedDemoDataForUser(userId: string, userName: string = 'Mi Negocio'): Promise<Business> {
  const now = new Date().toISOString();
  const businessId = `biz_${userId.substring(0, 10)}`;
  const bizTitle = userName.startsWith('Servicios') ? userName : `Servicios de ${userName}`;

  const business: Business = {
    id: businessId,
    ownerId: userId,
    name: bizTitle,
    primaryService: 'Servicio profesional',
    defaultPrice: 500,
    description: `Servicios profesionales independientes de ${userName}.`,
    category: 'Servicios Profesionales',
    phone: '55 1234 5678',
    whatsapp: '55 1234 5678',
    city: 'Ciudad de México',
    serviceArea: 'Área metropolitana',
    createdAt: now,
    updatedAt: now,
  };
  await saveBusiness(business);

  // Service
  const serviceId = `srv_${Date.now()}`;
  const service: Service = {
    id: serviceId,
    businessId,
    name: 'Servicio profesional',
    description: 'Atención personalizada de alta calidad.',
    basePrice: 500,
    durationMinutes: 180,
    active: true,
    isPrimary: true,
    priority: 1,
    createdAt: now,
    updatedAt: now,
  };
  await saveService(businessId, service);

  // Client 1: María López
  const client1Id = `cli_maria_${Date.now()}`;
  const client1: Client = {
    id: client1Id,
    businessId,
    name: 'María López',
    phone: '55 9876 5432',
    email: 'maria.lopez@ejemplo.com',
    notes: 'Av. Insurgentes Sur 1450. Limpieza habitual quincenal.',
    createdAt: now,
    updatedAt: now,
    totalServices: 6,
    totalPaid: 3200,
  };
  await saveClient(businessId, client1);

  // Client 2: Carlos García
  const client2Id = `cli_carlos_${Date.now()}`;
  const client2: Client = {
    id: client2Id,
    businessId,
    name: 'Carlos García',
    phone: '55 4321 8765',
    email: 'carlos.garcia@ejemplo.com',
    notes: 'Calle Durango 88, Col. Roma Norte.',
    createdAt: now,
    updatedAt: now,
    totalServices: 3,
    totalPaid: 1050,
  };
  await saveClient(businessId, client2);

  // Appointments
  const apt1: Appointment = {
    id: `apt_1_${Date.now()}`,
    businessId,
    clientId: client1Id,
    clientName: 'María López',
    serviceId,
    serviceName: 'Limpieza del hogar',
    date: '3 octubre',
    startTime: '10:00 AM',
    endTime: '1:00 PM',
    price: 500,
    status: 'confirmed',
    notes: 'Limpieza profunda de sala, cocina y 2 recámaras.',
    createdAt: now,
    updatedAt: now,
  };
  await saveAppointment(businessId, apt1);

  const apt2: Appointment = {
    id: `apt_2_${Date.now()}`,
    businessId,
    clientId: client2Id,
    clientName: 'Carlos García',
    serviceId,
    serviceName: 'Limpieza del hogar',
    date: '3 octubre',
    startTime: '2:00 PM',
    endTime: '5:00 PM',
    price: 350,
    status: 'pending',
    notes: 'Limpieza estándar de departamento 1 recámara.',
    createdAt: now,
    updatedAt: now,
  };
  await saveAppointment(businessId, apt2);

  // Payments & Receipts
  const payment1: Payment = {
    id: `pay_1_${Date.now()}`,
    businessId,
    clientId: client1Id,
    clientName: 'María López',
    appointmentId: apt1.id,
    serviceName: 'Limpieza del hogar',
    amount: 750,
    status: 'pending',
    method: 'payment_link',
    paymentUrl: `https://chambaapp.me/pago/chg-1001`,
    createdAt: now,
  };
  await savePayment(businessId, payment1);

  const receipt1: Receipt = {
    id: `rec_1_${Date.now()}`,
    businessId,
    clientId: client1Id,
    clientName: 'María López',
    appointmentId: apt1.id,
    receiptNumber: 'REC-000124',
    serviceName: 'Limpieza del hogar',
    amount: 750,
    status: 'paid',
    issuedAt: now,
  };
  await saveReceipt(businessId, receipt1);

  // Initial Free Subscription (up to 5 clients)
  const sub: Subscription = {
    id: `sub_${businessId}`,
    userId,
    businessId,
    plan: 'free',
    status: 'active',
    currency: 'MXN',
    amount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await saveSubscription(businessId, sub);

  return business;
}
