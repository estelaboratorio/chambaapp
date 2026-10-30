import React, { useState, useEffect } from 'react';
import { 
  Appointment, 
  Business, 
  Client, 
  Service, 
  Payment, 
  Receipt, 
  PricingCalculation, 
  Screen,
  Quote 
} from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { AudioTutorialModal } from './components/AudioTutorialModal';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AppointmentsScreen } from './screens/AppointmentsScreen';
import { NewAppointmentScreen } from './screens/NewAppointmentScreen';
import { CalculatorScreen } from './screens/CalculatorScreen';
import { CalculationResultScreen } from './screens/CalculationResultScreen';
import { ChargeScreen } from './screens/ChargeScreen';
import { ReceiptScreen } from './screens/ReceiptScreen';
import { QuotesScreen } from './screens/QuotesScreen';
import { AssistantScreen } from './screens/AssistantScreen';
import { ClientsScreen } from './screens/ClientsScreen';
import { ClientDetailScreen } from './screens/ClientDetailScreen';
import { BusinessScreen } from './screens/BusinessScreen';
import { ServicesManagerScreen } from './screens/ServicesManagerScreen';
import { PlanManagerScreen } from './screens/PlanManagerScreen';
import { PublicCardScreen } from './screens/PublicCardScreen';
import { PublicBookingScreen } from './screens/PublicBookingScreen';
import { ShareBusinessModal } from './components/ShareBusinessModal';
import { LegalModal } from './components/LegalModals';
import { InstallAppBanner } from './components/InstallAppBanner';
import { 
  initialAppointments, 
  initialClients, 
  initialCharge, 
  initialCalculatorData 
} from './data/mockData';
import { 
  getAppointments, 
  getClients, 
  getServices, 
  getPayments, 
  getReceipts,
  getQuotes,
  saveQuote 
} from './services/firebaseService';
import { Smartphone, Monitor, ChevronRight, Layers } from 'lucide-react';

const defaultGenericBusiness: Business = {
  id: 'biz_general',
  ownerId: 'usr_general',
  name: 'Mi Negocio',
  category: 'Servicios Profesionales',
  primaryService: 'Servicio profesional',
  defaultPrice: 500,
  description: 'Servicios profesionales independientes.',
  city: 'Ciudad de México',
  serviceArea: 'Área metropolitana',
  phone: '55 1234 5678',
  whatsapp: '55 1234 5678',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const demoBusinessAna: Business = {
  id: 'biz_demo_ana',
  ownerId: 'usr_demo_ana',
  name: 'Servicios de Limpieza Ana',
  category: 'Limpieza',
  primaryService: 'Limpieza del hogar',
  defaultPrice: 500,
  description: 'Servicios profesionales de limpieza para hogares y departamentos.',
  city: 'Ciudad de México',
  serviceArea: 'Benito Juárez y Cuauhtémoc',
  phone: '55 1234 5678',
  whatsapp: '55 1234 5678',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const initialDefaultServices: Service[] = [
  {
    id: 'srv_1',
    businessId: 'biz_demo_ana',
    name: 'Limpieza del hogar',
    description: 'Limpieza profunda de sala, cocina y 2 recámaras.',
    basePrice: 500,
    durationMinutes: 180,
    active: true,
    isPrimary: true,
    priority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'srv_2',
    businessId: 'biz_demo_ana',
    name: 'Limpieza exprés',
    description: 'Limpieza rápida de áreas principales y baño.',
    basePrice: 350,
    durationMinutes: 120,
    active: true,
    isPrimary: false,
    priority: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to parse public unauthenticated routes
function parsePublicRoute(): { screen: Screen; userId: string; serviceId?: string } | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash;

  // 1. Pathname matches: /tarjeta/:userId or /card/:userId
  const cardMatch = path.match(/^\/(tarjeta|card)\/([^\/]+)/i);
  if (cardMatch && cardMatch[2]) {
    return { screen: 'public-card', userId: decodeURIComponent(cardMatch[2]) };
  }

  // 2. Pathname matches: /agendar/:userId or /book/:userId
  const bookMatch = path.match(/^\/(agendar|book)\/([^\/]+)/i);
  if (bookMatch && bookMatch[2]) {
    return { 
      screen: 'public-booking', 
      userId: decodeURIComponent(bookMatch[2]),
      serviceId: search.get('service') || undefined 
    };
  }

  // 3. Fallback query parameters
  if (search.get('tarjeta') || search.get('card')) {
    return { screen: 'public-card', userId: search.get('tarjeta') || search.get('card') || 'demo' };
  }
  if (search.get('agendar') || search.get('book')) {
    return { 
      screen: 'public-booking', 
      userId: search.get('agendar') || search.get('book') || 'demo',
      serviceId: search.get('service') || undefined 
    };
  }
  if (search.get('view') === 'tarjeta' || search.get('view') === 'card') {
    return { screen: 'public-card', userId: search.get('userId') || search.get('biz') || 'demo' };
  }
  if (search.get('view') === 'agendar' || search.get('view') === 'book') {
    return { 
      screen: 'public-booking', 
      userId: search.get('userId') || search.get('biz') || 'demo',
      serviceId: search.get('service') || undefined 
    };
  }

  // 4. Hash fallback: #/tarjeta/:userId or #/agendar/:userId
  const hashCardMatch = hash.match(/^#\/(tarjeta|card)\/([^\/]+)/i);
  if (hashCardMatch && hashCardMatch[2]) {
    return { screen: 'public-card', userId: decodeURIComponent(hashCardMatch[2]) };
  }
  const hashBookMatch = hash.match(/^#\/(agendar|book)\/([^\/]+)/i);
  if (hashBookMatch && hashBookMatch[2]) {
    return { screen: 'public-booking', userId: decodeURIComponent(hashBookMatch[2]) };
  }

  return null;
}

function ChambaAppContent() {
  const { currentUser, userProfile, currentBusiness, subscription, loading: authLoading, refreshBusinessData } = useAuth();

  const initialPublicRoute = parsePublicRoute();

  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    if (initialPublicRoute) return initialPublicRoute.screen;
    return 'welcome';
  });
  const [navigationHistory, setNavigationHistory] = useState<Screen[]>([initialPublicRoute?.screen || 'welcome']);
  const [publicUserId, setPublicUserId] = useState<string>(() => initialPublicRoute?.userId || 'demo');
  const [publicBookingServiceId, setPublicBookingServiceId] = useState<string | undefined>(() => initialPublicRoute?.serviceId);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chamba_is_demo') === 'true';
    } catch {}
    return false;
  });

  const setDemoModeState = (isDemo: boolean) => {
    setIsDemoMode(isDemo);
    try {
      localStorage.setItem('chamba_is_demo', isDemo ? 'true' : 'false');
    } catch {}
  };

  const [customBusiness, setCustomBusiness] = useState<Business | null>(() => {
    try {
      const stored = localStorage.getItem('chamba_custom_business');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Clear legacy Ana test profile so newly registered profiles take full precedence
        if (parsed.name === 'Servicios de Limpieza Ana' || parsed.id === 'biz_demo_ana') {
          localStorage.removeItem('chamba_custom_business');
          return null;
        }
        return parsed;
      }
    } catch {}
    return null;
  });

  const saveCustomBusiness = (biz: Business) => {
    setCustomBusiness(biz);
    try {
      localStorage.setItem('chamba_custom_business', JSON.stringify(biz));
    } catch {}
  };

  // Helper for per-business service persistence
  const getStoredServices = (bizId: string): Service[] | null => {
    try {
      const stored = localStorage.getItem(`chamba_services_${bizId}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  };

  const saveServicesForBusiness = (bizId: string, srvs: Service[]) => {
    try {
      localStorage.setItem(`chamba_services_${bizId}`, JSON.stringify(srvs));
    } catch {}
  };

  // Dynamic user business fallback so we NEVER display Ana if user has a profile or custom business
  const userAutoBusiness = userProfile ? {
    id: `biz_${userProfile.id}`,
    ownerId: userProfile.id,
    name: userProfile.name ? `Servicios de ${userProfile.name}` : 'Mi Negocio',
    category: 'Servicios Profesionales',
    primaryService: 'Servicio principal',
    defaultPrice: 500,
    description: `Servicios profesionales de ${userProfile.name || 'independiente'}.`,
    city: 'Ciudad de México',
    phone: userProfile.phone || '',
    whatsapp: userProfile.phone || '',
    createdAt: userProfile.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } : null;

  const rawBusiness = isDemoMode
    ? demoBusinessAna
    : (customBusiness || currentBusiness || userAutoBusiness || defaultGenericBusiness);

  // Real Database entities with rich default fallbacks
  const [services, setServices] = useState<Service[]>(() => {
    if (isDemoMode) return initialDefaultServices;
    const currentBizId = customBusiness?.id || currentBusiness?.id || (userProfile ? `biz_${userProfile.id}` : null);
    if (currentBizId) {
      const stored = getStoredServices(currentBizId);
      if (stored) return stored;
      return [];
    }
    return [];
  });

  // Services sorted in strict priority order: Primary service always first, then secondary services (2, 3...)
  const sortedServices = [...services].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    if (rawBusiness.primaryService) {
      if (a.name.trim().toLowerCase() === rawBusiness.primaryService.trim().toLowerCase()) return -1;
      if (b.name.trim().toLowerCase() === rawBusiness.primaryService.trim().toLowerCase()) return 1;
    }
    const pA = a.priority ?? 99;
    const pB = b.priority ?? 99;
    if (pA !== pB) return pA - pB;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const primaryServiceResolved = sortedServices.find((s) => s.isPrimary) || sortedServices[0];

  const effectiveBusiness: Business = {
    ...rawBusiness,
    primaryService: rawBusiness.primaryService || primaryServiceResolved?.name || 'Servicio principal',
    defaultPrice: rawBusiness.defaultPrice || primaryServiceResolved?.basePrice || 500,
  };

  const [clients, setClients] = useState<Client[]>(() => {
    if (isDemoMode) return initialClients;
    const currentBizId = customBusiness?.id || currentBusiness?.id || (userProfile ? `biz_${userProfile.id}` : null);
    if (currentBizId) {
      try {
        const stored = localStorage.getItem(`chamba_clients_${currentBizId}`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    if (isDemoMode) return initialAppointments;
    const currentBizId = customBusiness?.id || currentBusiness?.id || (userProfile ? `biz_${userProfile.id}` : null);
    if (currentBizId) {
      try {
        const stored = localStorage.getItem(`chamba_appointments_${currentBizId}`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [];
  });

  const handleAddAppointment = (newApt: Appointment) => {
    setAppointments(prev => {
      const updated = [newApt, ...prev.filter(a => a.id !== newApt.id)];
      try {
        if (effectiveBusiness.id) {
          localStorage.setItem(`chamba_appointments_${effectiveBusiness.id}`, JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });
  };

  const handleSaveServiceLocal = (newSrv: Service) => {
    setServices(prev => {
      let updated: Service[];
      const isFirst = prev.length === 0;
      const willBePrimary = newSrv.isPrimary ?? isFirst;

      if (willBePrimary) {
        const demoted = prev.map(s => ({
          ...s,
          isPrimary: false,
          priority: (s.priority || 1) + 1,
        }));
        updated = [{ ...newSrv, isPrimary: true, priority: 1 }, ...demoted.filter(s => s.id !== newSrv.id)];
      } else {
        const existing = prev.filter(s => s.id !== newSrv.id);
        const nextPriority = existing.length + 1;
        updated = [...existing, { ...newSrv, isPrimary: false, priority: newSrv.priority || nextPriority }];
      }
      saveServicesForBusiness(effectiveBusiness.id, updated);
      return updated;
    });
  };

  const handleUpdateServiceLocal = (srvId: string, updates: Partial<Service>) => {
    setServices(prev => {
      let updated: Service[];
      if (updates.isPrimary) {
        updated = prev.map(s =>
          s.id === srvId
            ? { ...s, ...updates, isPrimary: true, priority: 1 }
            : { ...s, isPrimary: false, priority: (s.priority || 1) + 1 }
        );
      } else {
        updated = prev.map(s => s.id === srvId ? { ...s, ...updates } : s);
      }
      saveServicesForBusiness(effectiveBusiness.id, updated);
      return updated;
    });
  };

  const [payments, setPayments] = useState<Payment[]>(() => {
    if (isDemoMode) {
      return [
        {
          id: initialCharge.id,
          businessId: 'biz_demo_ana',
          clientId: 'cli-1',
          clientName: 'María López',
          serviceName: 'Limpieza del hogar',
          amount: 750,
          status: 'pending',
          method: 'payment_link',
          createdAt: new Date().toISOString(),
        }
      ];
    }
    const currentBizId = customBusiness?.id || currentBusiness?.id || (userProfile ? `biz_${userProfile.id}` : null);
    if (currentBizId) {
      try {
        const stored = localStorage.getItem(`chamba_payments_${currentBizId}`);
        if (stored) return JSON.parse(stored);
      } catch {}
      return [];
    }
    return [];
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    if (isDemoMode) {
      return [
        {
          id: 'rec_init_124',
          businessId: 'biz_demo_ana',
          clientId: 'cli-1',
          clientName: 'María López',
          receiptNumber: 'REC-000124',
          serviceName: 'Limpieza del hogar',
          amount: 750,
          status: 'paid',
          issuedAt: new Date().toISOString(),
        }
      ];
    }
    const currentBizId = customBusiness?.id || currentBusiness?.id || (userProfile ? `biz_${userProfile.id}` : null);
    if (currentBizId) {
      try {
        const stored = localStorage.getItem(`chamba_receipts_${currentBizId}`);
        if (stored) return JSON.parse(stored);
      } catch {}
      return [];
    }
    return [];
  });

  const handleSavePaymentLocal = (newPayment: Payment) => {
    setPayments(prev => {
      const updated = [newPayment, ...prev.filter(p => p.id !== newPayment.id)];
      try {
        localStorage.setItem(`chamba_payments_${effectiveBusiness.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSaveReceiptLocal = (newReceipt: Receipt) => {
    setReceipts(prev => {
      const updated = [newReceipt, ...prev.filter(r => r.id !== newReceipt.id)];
      try {
        localStorage.setItem(`chamba_receipts_${effectiveBusiness.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setActiveReceipt(newReceipt);
  };

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    if (isDemoMode) {
      return [
        {
          id: 'cot_init_1',
          businessId: 'biz_demo_ana',
          quoteNumber: 'COT-0001',
          clientName: 'Roberto García',
          clientPhone: '55 9876 5432',
          serviceName: 'Mantenimiento y pintura',
          materialsCost: 400,
          laborCost: 600,
          totalCost: 1000,
          targetMargin: 0.30,
          basePrice: 1428.57,
          subtotal: 1428.57,
          discountAmount: 0,
          taxRate: 0.16,
          taxAmount: 228.57,
          total: 1657.14,
          payments: [
            {
              id: 'qpay_init_1',
              quoteId: 'cot_init_1',
              idempotencyKey: 'idem_init_1',
              type: 'anticipo',
              amount: 800,
              method: 'cash',
              date: new Date(Date.now() - 86400000).toISOString(),
              notes: 'Anticipo inicial recibido en efectivo',
              receiptNumber: 'REC-COT-000101',
            }
          ],
          totalPaid: 800,
          balanceDue: 857.14,
          status: 'con_anticipo',
          serviceOrderStatus: 'aprobado',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        }
      ];
    }
    const currentBizId = customBusiness?.id || currentBusiness?.id || (userProfile ? `biz_${userProfile.id}` : null);
    if (currentBizId) {
      try {
        const stored = localStorage.getItem(`chamba_quotes_${currentBizId}`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [];
  });

  const [activeQuoteId, setActiveQuoteId] = useState<string | undefined>(undefined);

  const handleSaveQuoteLocal = async (quote: Quote) => {
    setQuotes(prev => {
      const updated = [quote, ...prev.filter(q => q.id !== quote.id)];
      try {
        localStorage.setItem(`chamba_quotes_${effectiveBusiness.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (effectiveBusiness.id && effectiveBusiness.id !== 'biz_demo_ana') {
      try {
        await saveQuote(effectiveBusiness.id, quote);
      } catch (err) {
        console.warn('Error saving quote to firestore:', err);
      }
    }
  };

  const handleCreateQuoteFromCalculation = async (calc: PricingCalculation) => {
    const materialsCost = calc.materialsCost ?? calc.totalExpenses;
    const laborCost = calc.laborCost ?? (calc.hoursWorked * calc.desiredHourlyProfit);
    const totalCost = calc.totalCost ?? (materialsCost + laborCost);
    const targetMargin = calc.targetMargin ?? 0.30;
    const basePrice = calc.basePrice ?? calc.recommendedPrice;
    const subtotal = calc.subtotal ?? basePrice;
    const discountAmount = calc.discountAmount ?? 0;
    const taxRate = calc.taxRate ?? 0;
    const taxAmount = calc.taxAmount ?? 0;
    const total = calc.finalTotal ?? calc.recommendedPrice;

    const newQuoteId = `cot_${Date.now()}`;
    const quoteNumber = `COT-${String(quotes.length + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newQuote: Quote = {
      id: newQuoteId,
      businessId: effectiveBusiness.id,
      quoteNumber,
      clientName: chargeClientName || 'Cliente particular',
      serviceName: calc.serviceName || 'Servicio profesional',
      materialsCost,
      laborCost,
      totalCost,
      targetMargin,
      basePrice,
      subtotal,
      discountAmount,
      taxRate,
      taxAmount,
      total,
      payments: [],
      totalPaid: 0,
      balanceDue: total,
      status: 'pendiente',
      serviceOrderStatus: 'cotizado',
      createdAt: now,
      updatedAt: now,
    };

    await handleSaveQuoteLocal(newQuote);
    setActiveQuoteId(newQuoteId);
    navigateTo('quotes');
  };

  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  // Flow states
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(clients[0] || null);
  const [activeCalculation, setActiveCalculation] = useState<PricingCalculation | null>({
    id: 'calc_init',
    businessId: 'biz_demo_ana',
    serviceName: 'Limpieza del hogar',
    materials: 80,
    transport: 50,
    otherExpenses: 20,
    hoursWorked: 4,
    desiredHourlyProfit: 150,
    totalExpenses: 150,
    recommendedPrice: 750,
    createdAt: new Date().toISOString(),
  });
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(receipts[0] || null);
  const [chargeAmount, setChargeAmount] = useState<number>(500);
  const [chargeClientName, setChargeClientName] = useState<string>('');
  const [chargeServiceName, setChargeServiceName] = useState<string>('');

  // Audio Tutorial modal
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  // Share profile modal
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Legal modal (Privacy Policy & Terms for Google Play compliance)
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  // Desktop view mode (Device Frame vs Full Width)
  const [isDeviceFrame, setIsDeviceFrame] = useState<boolean>(true);

  // Screen drawer toggle for mobile testing
  const [showScreenDrawer, setShowScreenDrawer] = useState<boolean>(false);

  // Load business subcollections when business is available with strict tenant isolation
  const loadBusinessData = async () => {
    if (!currentBusiness) return;
    setIsDataLoading(true);
    try {
      const [srvs, cls, apts, pays, recs, qts] = await Promise.all([
        getServices(currentBusiness.id),
        getClients(currentBusiness.id),
        getAppointments(currentBusiness.id),
        getPayments(currentBusiness.id),
        getReceipts(currentBusiness.id),
        getQuotes(currentBusiness.id),
      ]);
      setServices(srvs || []);
      setClients(cls || []);
      setAppointments(apts || []);
      setPayments(pays || []);
      setReceipts(recs || []);
      setActiveReceipt(recs?.[0] || null);
      setQuotes(qts || []);

      // Cache strictly partitioned per businessId
      try {
        localStorage.setItem(`chamba_services_${currentBusiness.id}`, JSON.stringify(srvs || []));
        localStorage.setItem(`chamba_clients_${currentBusiness.id}`, JSON.stringify(cls || []));
        localStorage.setItem(`chamba_appointments_${currentBusiness.id}`, JSON.stringify(apts || []));
        localStorage.setItem(`chamba_payments_${currentBusiness.id}`, JSON.stringify(pays || []));
        localStorage.setItem(`chamba_receipts_${currentBusiness.id}`, JSON.stringify(recs || []));
        localStorage.setItem(`chamba_quotes_${currentBusiness.id}`, JSON.stringify(qts || []));
      } catch {}
    } catch (err) {
      console.error('Error fetching business subcollections:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser && !isDemoMode) {
      // Clear all tenant states immediately on logout to prevent lingering data in client memory
      setServices([]);
      setClients([]);
      setAppointments([]);
      setPayments([]);
      setReceipts([]);
      setQuotes([]);
      setActiveReceipt(null);
      return;
    }

    if (currentBusiness) {
      // Immediately hydrate this tenant's partition from storage to avoid visual cross-account bleeding
      const bizId = currentBusiness.id;
      try {
        const cachedServices = localStorage.getItem(`chamba_services_${bizId}`);
        const cachedClients = localStorage.getItem(`chamba_clients_${bizId}`);
        const cachedAppointments = localStorage.getItem(`chamba_appointments_${bizId}`);
        const cachedPayments = localStorage.getItem(`chamba_payments_${bizId}`);
        const cachedReceipts = localStorage.getItem(`chamba_receipts_${bizId}`);
        const cachedQuotes = localStorage.getItem(`chamba_quotes_${bizId}`);

        setServices(cachedServices ? JSON.parse(cachedServices) : []);
        setClients(cachedClients ? JSON.parse(cachedClients) : []);
        setAppointments(cachedAppointments ? JSON.parse(cachedAppointments) : []);
        setPayments(cachedPayments ? JSON.parse(cachedPayments) : []);
        setReceipts(cachedReceipts ? JSON.parse(cachedReceipts) : []);
        setQuotes(cachedQuotes ? JSON.parse(cachedQuotes) : []);
      } catch {}

      loadBusinessData();
    }
  }, [currentBusiness?.id, currentUser?.uid, isDemoMode]);

  // Open digital card if visited with ?biz= parameter
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('biz')) {
        setIsShareModalOpen(true);
      }
    } catch {}
  }, []);

  const navigateTo = (screen: Screen) => {
    setNavigationHistory(prev => [...prev, screen]);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop();
      const prev = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setCurrentScreen(prev);
    } else {
      navigateTo('home');
    }
  };

  // Charge handlers
  const handleSelectAppointmentForCharge = (apt: Appointment) => {
    setChargeAmount(apt.price);
    setChargeClientName(apt.clientName);
    setChargeServiceName(apt.serviceName);
    navigateTo('charge');
  };

  const handleScheduleForClient = (client: Client) => {
    setSelectedClientForDetail(client);
    navigateTo('new-appointment');
  };

  const handleChargeForClient = (client: Client) => {
    setChargeClientName(client.name);
    setChargeAmount(750);
    navigateTo('charge');
  };

  const handlePaymentCompleted = (receipt: Receipt) => {
    setActiveReceipt(receipt);
    navigateTo('receipt');
  };

  const handleUseCalculatedPrice = (price: number, srvName?: string) => {
    setChargeAmount(price);
    if (srvName) setChargeServiceName(srvName);
    navigateTo('charge');
  };

  // Listen for browser popstate navigation (forward/back)
  useEffect(() => {
    const handlePopState = () => {
      const route = parsePublicRoute();
      if (route) {
        setPublicUserId(route.userId);
        if (route.serviceId) setPublicBookingServiceId(route.serviceId);
        setCurrentScreen(route.screen);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToPublicCard = (uId?: string) => {
    const targetId = uId || publicUserId || effectiveBusiness.ownerId || userProfile?.id || 'demo';
    setPublicUserId(targetId);
    setCurrentScreen('public-card');
    try {
      window.history.pushState(null, '', `/tarjeta/${encodeURIComponent(targetId)}`);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPublicBooking = (srvId?: string, uId?: string) => {
    const targetId = uId || publicUserId || effectiveBusiness.ownerId || userProfile?.id || 'demo';
    setPublicUserId(targetId);
    if (srvId) setPublicBookingServiceId(srvId);
    setCurrentScreen('public-booking');
    try {
      const q = srvId ? `?service=${encodeURIComponent(srvId)}` : '';
      window.history.pushState(null, '', `/agendar/${encodeURIComponent(targetId)}${q}`);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine header and navigation visibility
  const isPublicScreen = 
    currentScreen === 'welcome' || 
    currentScreen === 'auth' || 
    currentScreen === 'onboarding' ||
    currentScreen === 'public-card' ||
    currentScreen === 'public-booking';
  const showTopBar = !isPublicScreen;
  const showBottomNav = !isPublicScreen && currentScreen !== 'receipt' && currentScreen !== 'calculator-result';
  const showBackButton = currentScreen !== 'home' && !isPublicScreen;

  const allScreens: { id: Screen; label: string; number: number }[] = [
    { id: 'welcome', label: 'Bienvenida', number: 1 },
    { id: 'onboarding', label: 'Configuración inicial', number: 2 },
    { id: 'home', label: 'Inicio', number: 3 },
    { id: 'appointments', label: 'Mis citas', number: 4 },
    { id: 'new-appointment', label: 'Nueva cita', number: 5 },
    { id: 'calculator', label: '¿Cuánto cobrar?', number: 6 },
    { id: 'calculator-result', label: 'Resultado', number: 7 },
    { id: 'charge', label: 'Cobrar', number: 8 },
    { id: 'receipt', label: 'Recibo', number: 9 },
    { id: 'assistant', label: 'Hazlo por mí', number: 10 },
    { id: 'clients', label: 'Clientes', number: 11 },
    { id: 'plan-manager', label: 'Mi plan (Límite 5)', number: 12 },
    { id: 'business', label: 'Mi negocio', number: 13 },
    { id: 'services-manager', label: 'Servicios', number: 14 },
    { id: 'public-card', label: '💳 Tarjeta pública', number: 15 },
    { id: 'public-booking', label: '📅 Agendar pública', number: 16 },
  ];

  return (
    <div className="min-h-screen bg-[#EDF2F7] flex flex-col items-center justify-start sm:py-4 sm:px-4">
      {/* Universal Screen Switcher Bar (Responsive on all screen sizes so preview is never blocked) */}
      <aside aria-label="Navegador del prototipo y pantallas" className="w-full max-w-4xl mb-2 sm:mb-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-200 shadow-2xs text-xs text-[#07326F]">
        <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-0">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-xs bg-[#07326F] text-white px-2 py-0.5 rounded-md">
              ChambaApp
            </span>
            <span className="text-slate-600 font-medium text-xs hidden sm:inline">
              Revisión de todas las pantallas conectadas:
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Frame Toggle */}
            <button
              onClick={() => setIsDeviceFrame(!isDeviceFrame)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-[#07326F] hover:bg-slate-50 font-heading text-[11px] cursor-pointer"
            >
              {isDeviceFrame ? (
                <>
                  <Monitor className="w-3 h-3" />
                  <span>Expandir</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3 h-3" />
                  <span>Marco móvil</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Screen Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {allScreens.map((s) => (
            <button
              key={s.id}
              onClick={() => navigateTo(s.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-heading font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                currentScreen === s.id
                  ? 'bg-[#07326F] text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#07326F] bg-slate-50 border border-slate-200/60'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Mobile App Canvas */}
      <main
        className={`w-full bg-[#F7F9FC] transition-all relative flex flex-col justify-between overflow-x-hidden ${
          isDeviceFrame
            ? 'max-w-[420px] min-h-[844px] sm:rounded-[36px] sm:border-[8px] sm:border-slate-800 sm:shadow-2xl sm:ring-1 sm:ring-black/10'
            : 'max-w-md min-h-screen sm:border sm:border-slate-200 sm:rounded-2xl sm:shadow-md'
        }`}
      >
        {isDeviceFrame && (
          <div className="hidden sm:flex justify-center items-center h-4 pt-1 bg-transparent shrink-0">
            <div className="w-24 h-3.5 bg-slate-800 rounded-full" />
          </div>
        )}

        {/* Top Header */}
        {showTopBar && (
          <TopBar
            currentScreen={currentScreen}
            onNavigate={navigateTo}
            onBack={handleBack}
            showBack={showBackButton}
            onOpenShare={() => setIsShareModalOpen(true)}
            onOpenTutorial={() => setIsTutorialOpen(true)}
            businessName={effectiveBusiness.name}
            userName={userProfile?.name}
          />
        )}

        {/* In-App Mobile PWA Installation Banner */}
        {!isPublicScreen && currentScreen !== 'services-manager' && currentScreen !== 'plan-manager' && (
          <InstallAppBanner />
        )}

        {/* Content Area */}
        <div className={`flex-1 ${!isPublicScreen ? 'px-4 pt-3' : ''}`}>
          {currentScreen === 'welcome' && (
            <WelcomeScreen
              onStart={() => {
                setDemoModeState(false);
                setAuthMode('register');
                navigateTo('auth');
              }}
              onRegister={() => {
                setDemoModeState(false);
                setAuthMode('register');
                navigateTo('auth');
              }}
              onLogin={() => {
                setDemoModeState(false);
                setAuthMode('login');
                navigateTo('auth');
              }}
              onExploreDemo={() => {
                setDemoModeState(true);
                setServices(initialDefaultServices);
                setAppointments(initialAppointments);
                navigateTo('home');
              }}
              onOpenTutorial={() => setIsTutorialOpen(true)}
              onOpenLegal={setLegalModalType}
            />
          )}

          {currentScreen === 'auth' && (
            <AuthScreen
              initialMode={authMode}
              onSuccess={(isNewUser, registeredName) => {
                setDemoModeState(false);
                if (isNewUser) {
                  const newBiz: Business = {
                    id: `biz_${Date.now()}`,
                    ownerId: `usr_${Date.now()}`,
                    name: `Servicios de ${registeredName || 'mi Negocio'}`,
                    category: 'Servicios Profesionales',
                    description: `Servicios profesionales independientes`,
                    city: 'Ciudad de México',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  saveCustomBusiness(newBiz);
                  setServices([]);
                  saveServicesForBusiness(newBiz.id, []);
                  setAppointments([]);
                  navigateTo('onboarding');
                } else {
                  navigateTo('home');
                }
              }}
              onBackToWelcome={() => navigateTo('welcome')}
            />
          )}

          {currentScreen === 'onboarding' && (
            <OnboardingScreen
              onFinish={(newBiz, newSrv) => {
                setDemoModeState(false);
                if (newBiz) {
                  saveCustomBusiness(newBiz);
                  const initialSrvs = newSrv ? [newSrv] : [];
                  setServices(initialSrvs);
                  saveServicesForBusiness(newBiz.id, initialSrvs);
                  setAppointments([]);
                }
                navigateTo('home');
              }}
              onBackToWelcome={() => navigateTo('welcome')}
            />
          )}

          {currentScreen === 'home' && (
            <HomeScreen
              userProfile={userProfile || { id: 'usr_me', name: effectiveBusiness.name.replace('Servicios de ', ''), email: '', servicios_realizados: 0, has_subscription: false, createdAt: '', updatedAt: '' }}
              business={effectiveBusiness}
              appointments={appointments}
              payments={payments}
              quotes={quotes}
              onNavigate={navigateTo}
              onOpenTutorial={() => setIsTutorialOpen(true)}
              onOpenShare={() => setIsShareModalOpen(true)}
            />
          )}

          {currentScreen === 'appointments' && (
            <AppointmentsScreen
              businessId={effectiveBusiness.id}
              businessName={effectiveBusiness.name}
              appointments={appointments}
              isLoading={isDataLoading}
              onNavigate={navigateTo}
              onSelectForCharge={handleSelectAppointmentForCharge}
              onRefresh={loadBusinessData}
              onUpdateAppointment={(updated) => {
                setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
              }}
            />
          )}

          {currentScreen === 'new-appointment' && (
            <NewAppointmentScreen
              businessId={effectiveBusiness.id}
              clients={clients}
              services={services}
              appointments={appointments}
              prefilledClient={selectedClientForDetail}
              onRefresh={loadBusinessData}
              onNavigate={navigateTo}
              onAddAppointment={handleAddAppointment}
            />
          )}

          {currentScreen === 'calculator' && (
            <CalculatorScreen
              businessId={effectiveBusiness.id}
              services={services}
              onCalculate={(calc) => {
                setActiveCalculation(calc);
                navigateTo('calculator-result');
              }}
              onNavigate={navigateTo}
            />
          )}

          {currentScreen === 'calculator-result' && activeCalculation && (
            <CalculationResultScreen
              calculation={activeCalculation}
              onUsePrice={handleUseCalculatedPrice}
              onCreateQuote={handleCreateQuoteFromCalculation}
              onRecalculate={() => navigateTo('calculator')}
              onNavigate={navigateTo}
            />
          )}

          {currentScreen === 'quotes' && (
            <QuotesScreen
              businessId={effectiveBusiness.id}
              businessName={effectiveBusiness.name}
              quotes={quotes}
              clients={clients}
              services={services}
              appointments={appointments}
              initialActiveQuoteId={activeQuoteId}
              onNavigate={navigateTo}
              onSaveQuote={handleSaveQuoteLocal}
              onViewReceipt={(receipt) => {
                setActiveReceipt(receipt);
                navigateTo('receipt');
              }}
              onAddAppointment={handleAddAppointment}
            />
          )}

          {currentScreen === 'charge' && (
            <ChargeScreen
              businessId={effectiveBusiness.id}
              businessName={effectiveBusiness.name}
              clients={clients}
              services={services}
              initialAmount={chargeAmount}
              initialClient={chargeClientName}
              initialService={chargeServiceName}
              onPaymentCompleted={handlePaymentCompleted}
              onNavigate={navigateTo}
              onRefresh={loadBusinessData}
              onAddPaymentLocal={handleSavePaymentLocal}
              onAddReceiptLocal={handleSaveReceiptLocal}
            />
          )}

          {currentScreen === 'receipt' && (
            <ReceiptScreen
              receipt={activeReceipt}
              businessName={effectiveBusiness.name}
              onNavigate={navigateTo}
            />
          )}

          {currentScreen === 'assistant' && (
            <AssistantScreen
              businessId={effectiveBusiness.id}
              clients={clients}
              onRefresh={loadBusinessData}
              onNavigate={navigateTo}
              onAddAppointment={handleAddAppointment}
              onAddClient={(newCli) => {
                setClients(prev => {
                  const updated = [newCli, ...prev.filter(c => c.id !== newCli.id)];
                  try {
                    if (effectiveBusiness.id) {
                      localStorage.setItem(`chamba_clients_${effectiveBusiness.id}`, JSON.stringify(updated));
                    }
                  } catch {}
                  return updated;
                });
              }}
            />
          )}

          {currentScreen === 'clients' && (
            <ClientsScreen
              businessId={effectiveBusiness.id}
              clients={clients}
              subscription={subscription}
              onNavigate={navigateTo}
              onSelectClient={(c) => {
                setSelectedClientForDetail(c);
                navigateTo('client-detail');
              }}
              onChargeClient={handleChargeForClient}
              onScheduleClient={handleScheduleForClient}
              onRefresh={loadBusinessData}
            />
          )}

          {currentScreen === 'client-detail' && selectedClientForDetail && (
            <ClientDetailScreen
              client={selectedClientForDetail}
              businessId={effectiveBusiness.id}
              appointments={appointments}
              onBack={() => navigateTo('clients')}
              onNavigate={navigateTo}
              onChargeClient={handleChargeForClient}
              onScheduleClient={handleScheduleForClient}
              onRefresh={loadBusinessData}
            />
          )}

          {currentScreen === 'business' && (
            <BusinessScreen
              business={effectiveBusiness}
              subscription={subscription}
              onNavigate={navigateTo}
              onOpenTutorial={() => setIsTutorialOpen(true)}
              onOpenShare={() => setIsShareModalOpen(true)}
              onOpenLegal={setLegalModalType}
              onRefresh={async () => {
                await refreshBusinessData();
                await loadBusinessData();
              }}
              onUpdateBusinessLocal={(updBiz) => saveCustomBusiness(updBiz)}
            />
          )}

          {currentScreen === 'services-manager' && (
            <ServicesManagerScreen
              businessId={effectiveBusiness.id}
              services={services}
              onRefresh={loadBusinessData}
              onBack={() => navigateTo('business')}
              onSaveServiceLocal={handleSaveServiceLocal}
              onUpdateServiceLocal={handleUpdateServiceLocal}
            />
          )}

          {currentScreen === 'plan-manager' && (
            <PlanManagerScreen
              clientCount={clients.length}
              onBack={() => navigateTo('business')}
            />
          )}

          {currentScreen === 'public-card' && (
            <PublicCardScreen
              userId={publicUserId || effectiveBusiness.ownerId || userProfile?.id || 'demo'}
              onNavigateToBooking={(srvId) => navigateToPublicBooking(srvId)}
              onGoToAppHome={() => navigateTo('home')}
              isOwnerPreview={!!currentUser || isDemoMode}
            />
          )}

          {currentScreen === 'public-booking' && (
            <PublicBookingScreen
              userId={publicUserId || effectiveBusiness.ownerId || userProfile?.id || 'demo'}
              initialServiceId={publicBookingServiceId}
              onBackToCard={() => navigateToPublicCard()}
              onGoToAppHome={() => navigateTo('home')}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        {showBottomNav && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={navigateTo}
          />
        )}
      </main>

      {/* Audio Tutorial Modal with Spanish Voice Synthesizer */}
      <AudioTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onNavigateToSection={(sec) => {
          setIsTutorialOpen(false);
          if (sec === 'Inicio') navigateTo('home');
          else if (sec === 'Mis citas') navigateTo('appointments');
          else if (sec === 'Calculadora') navigateTo('calculator');
          else if (sec === 'Cobrar y Recibos') navigateTo('charge');
          else if (sec === 'Mi negocio') navigateTo('business');
        }}
      />

      {/* Share Business Digital Card & Public Link Modal */}
      {isShareModalOpen && (
        <ShareBusinessModal
          businessName={effectiveBusiness.name}
          category={effectiveBusiness.category}
          primaryService={effectiveBusiness.primaryService}
          defaultPrice={effectiveBusiness.defaultPrice}
          services={sortedServices}
          phone={effectiveBusiness.phone || effectiveBusiness.whatsapp || '55 1234 5678'}
          userId={effectiveBusiness.ownerId || userProfile?.id || currentUser?.uid || 'demo'}
          onClose={() => setIsShareModalOpen(false)}
          isFullPage={false}
        />
      )}

      {/* Legal & Compliance Modal (Privacy Policy & Terms) */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChambaAppContent />
    </AuthProvider>
  );
}
