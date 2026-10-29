import React from 'react';
import { Calendar, Calculator, CreditCard, Sparkles, ArrowRight, CheckCircle2, Clock, Volume2, Share2, FileText, TrendingUp, DollarSign } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Screen, Business, Appointment, Payment, UserProfile, Quote } from '../types';

interface HomeScreenProps {
  userProfile: UserProfile | null;
  business: Business | null;
  appointments: Appointment[];
  payments: Payment[];
  quotes?: Quote[];
  onNavigate: (screen: Screen) => void;
  onOpenTutorial: () => void;
  onOpenShare?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userProfile,
  business,
  appointments,
  payments,
  quotes = [],
  onNavigate,
  onOpenTutorial,
  onOpenShare,
}) => {
  const ownerName = userProfile?.name || business?.name || 'Emprendedor';

  // Calculate real metrics from DB
  const todayAppointments = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending' || a.status === 'rescheduled');
  const nextApt = todayAppointments[0];

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const completedPayments = payments.filter(p => p.status === 'paid' || p.status === 'approved');
  const totalReceivedAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  // Real quotes metrics
  const pendingQuoteBalance = quotes.reduce((sum, q) => sum + (q.balanceDue || 0), 0);
  const activeQuotesCount = quotes.filter(q => (q.balanceDue || 0) > 0.01).length;

  return (
    <div className="space-y-5 pb-24 pt-1">
      {/* Friendly User Greeting */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="font-heading font-bold text-2xl text-[#07326F] tracking-tight">
            Hola, {ownerName} 👋
          </h1>
          <p className="text-sm text-slate-500 font-normal mt-0.5">
            {business?.name ? `${business.name} · ` : ''}¿Qué necesitas hacer hoy?
          </p>
        </div>

        {/* Audio Tutorial Quick Button */}
        <button
          onClick={onOpenTutorial}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F9D785]/30 border border-[#F9D785]/70 text-[#07326F] text-xs font-heading font-semibold hover:bg-[#F9D785]/50 transition-all cursor-pointer shadow-2xs"
          title="Escuchar audio recorrido guiado"
        >
          <Volume2 className="w-3.5 h-3.5 text-[#19AA83]" />
          <span className="hidden xs:inline">Tutorial</span>
        </button>
      </div>

      {/* 3 Main Action Cards */}
      <div className="space-y-3">
        {/* Card 1: MIS CITAS (Predominantly Blue) */}
        <div
          onClick={() => onNavigate('appointments')}
          className="group relative overflow-hidden rounded-2xl p-5 bg-[#07326F] text-white shadow-md shadow-[#07326F]/15 cursor-pointer active:scale-[0.99] transition-all duration-200"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0 border border-white/20">
                <Calendar className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg tracking-tight text-white flex items-center gap-2">
                  MIS CITAS
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Organiza tus reservas
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 text-[#F9D785]" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#19AA83]" />
              {todayAppointments.length} {todayAppointments.length === 1 ? 'cita programada' : 'citas programadas'}
            </span>
            <span className="font-heading font-medium text-white/90">
              {nextApt ? `Próxima: ${nextApt.startTime}` : 'Sin pendientes'}
            </span>
          </div>
        </div>

        {/* Card 2: ¿CUÁNTO COBRAR? (Predominantly Green) */}
        <div
          onClick={() => onNavigate('calculator')}
          className="group relative overflow-hidden rounded-2xl p-5 bg-[#19AA83] text-white shadow-md shadow-[#19AA83]/15 cursor-pointer active:scale-[0.99] transition-all duration-200"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 border border-white/20">
                <Calculator className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg tracking-tight text-white">
                  ¿CUÁNTO COBRAR?
                </h2>
                <p className="text-xs text-white/90 mt-0.5">
                  Calcula un precio con ganancia
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
            <span>Materiales + Horas + Margen</span>
            <span className="font-heading font-semibold text-[#F9D785]">Sin regalar tu trabajo</span>
          </div>
        </div>

        {/* Card 3: COBRAR (Blue with Green details) */}
        <div
          onClick={() => onNavigate('charge')}
          className="group relative overflow-hidden rounded-2xl p-5 bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(7,50,111,0.06)] cursor-pointer active:scale-[0.99] transition-all duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#07326F]/10 flex items-center justify-center text-[#07326F] shrink-0 border border-[#07326F]/15">
                <CreditCard className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-bold text-lg tracking-tight text-[#07326F]">
                    COBRAR
                  </h2>
                  <span className="text-[10px] font-heading font-semibold text-[#19AA83] bg-[#19AA83]/10 px-2 py-0.5 rounded-full">
                    Link y recibo
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recibe tu pago y entrega recibo
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#07326F] shrink-0 group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 text-[#19AA83]" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Envía link y entrega recibo digital</span>
            <span className="font-heading font-semibold text-[#19AA83]">Cobros claros</span>
          </div>
        </div>

        {/* Card 4: COTIZACIONES Y SALDOS (Financial breakdown, anticipos and balances) */}
        <div
          onClick={() => onNavigate('quotes')}
          className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r from-slate-900 to-[#07326F] text-white shadow-md shadow-[#07326F]/20 cursor-pointer active:scale-[0.99] transition-all duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0 border border-white/20">
                <FileText className="w-6 h-6 stroke-[2.2] text-[#F9D785]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-bold text-lg tracking-tight text-white">
                    COTIZACIONES Y SALDOS
                  </h2>
                  <span className="text-[10px] font-heading font-semibold text-[#F9D785] bg-[#F9D785]/20 px-2 py-0.5 rounded-full border border-[#F9D785]/30">
                    Cobranza
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">
                  Margen sobre ventas, anticipos y saldos en vivo
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0 group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 text-[#F9D785]" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/85">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#19AA83]" />
              {activeQuotesCount} {activeQuotesCount === 1 ? 'cotización con saldo' : 'cotizaciones con saldo'}
            </span>
            <span className="font-heading font-bold text-[#F9D785]">
              Por liquidar: ${Math.round(pendingQuoteBalance)} MXN
            </span>
          </div>
        </div>
      </div>

      {/* Share Business Profile Card */}
      {onOpenShare && (
        <div
          onClick={onOpenShare}
          className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-[#19AA83]/40 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#19AA83]/15 text-[#19AA83] flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-sm text-[#07326F]">
                  Compartir mi ChambaApp
                </h3>
                <span className="text-[10px] font-heading font-semibold text-[#19AA83] bg-[#19AA83]/10 px-2 py-0.5 rounded-full">
                  Redes y WhatsApp
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tu tarjeta digital y enlace público para clientes
              </p>
            </div>
          </div>
          <span className="text-xs font-heading font-semibold text-[#19AA83] shrink-0">
            Compartir →
          </span>
        </div>
      )}

      {/* Tu día Section with Real Database Values */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-heading font-bold text-base text-[#07326F]">
            Tu día
          </h2>
          <span className="text-xs text-slate-400">Resumen en vivo</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Citas</span>
            <div className="mt-2">
              <span className="font-heading font-bold text-xl text-[#07326F] tabular-nums">
                {todayAppointments.length}
              </span>
              <span className="text-[10px] text-slate-400 block">activas</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Por cobrar</span>
            <div className="mt-2">
              <span className="font-heading font-bold text-xl text-[#07326F] tabular-nums">
                ${totalPendingAmount}
              </span>
              <span className="text-[10px] text-amber-500 block font-medium">
                {pendingPayments.length} pendientes
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Recibido</span>
            <div className="mt-2">
              <span className="font-heading font-bold text-xl text-[#19AA83] tabular-nums">
                ${totalReceivedAmount}
              </span>
              <span className="text-[10px] text-[#19AA83] block font-medium">
                {completedPayments.length} pagados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta Especial: ✨ Hazlo por mí */}
      <div
        onClick={() => onNavigate('assistant')}
        className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r from-[#032863] to-[#07326F] text-white border border-[#F9D785]/40 shadow-lg shadow-[#07326F]/20 cursor-pointer active:scale-[0.99] transition-all"
      >
        <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
          <Sparkles className="w-20 h-20 text-[#F9D785]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-6 h-6 rounded-full bg-[#F9D785]/20 flex items-center justify-center text-[#F9D785]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="font-heading font-bold text-sm tracking-wide text-[#F9D785]">
              ✨ Hazlo por mí
            </span>
          </div>

          <h3 className="font-heading font-bold text-base text-white">
            Escribe lo que necesitas y ChambaApp te ayuda.
          </h3>

          <p className="text-xs text-white/80 mt-1 max-w-[270px] leading-relaxed">
            Ejemplo: "María quiere limpieza mañana a las 10 y le cobraré $500"
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-xs font-heading font-semibold text-[#F9D785] group-hover:translate-x-1 transition-transform">
            <span>Probar asistente</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
