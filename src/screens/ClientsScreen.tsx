import React, { useState } from 'react';
import { Users, Phone, MapPin, Calendar, Plus, CreditCard, Search, X, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Client, Screen, Subscription } from '../types';
import { permissionService } from '../services/permissionService';
import { saveClient } from '../services/firebaseService';
import { platformConfig } from '../services/configService';

interface ClientsScreenProps {
  businessId: string;
  clients: Client[];
  subscription: Subscription | null;
  onNavigate: (screen: Screen) => void;
  onSelectClient: (client: Client) => void;
  onChargeClient: (client: Client) => void;
  onScheduleClient: (client: Client) => void;
  onRefresh: () => Promise<void>;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({
  businessId,
  clients,
  subscription,
  onNavigate,
  onSelectClient,
  onChargeClient,
  onScheduleClient,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);

  const canCreate = permissionService.canCreateClient(clients.length, subscription);

  const handleStartAdd = () => {
    if (!canCreate) {
      setShowLimitModal(true);
      return;
    }
    setIsAdding(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const newClient: Client = {
        id: `cli_${Date.now()}`,
        businessId,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.trim(),
        notes: notes.trim(),
        createdAt: now,
        updatedAt: now,
        totalServices: 0,
        totalPaid: 0,
      };
      await saveClient(businessId, newClient);
      await onRefresh();
      setIsAdding(false);
      setName('');
      setPhone('');
      setAddress('');
      setEmail('');
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || (c.phone && c.phone.includes(term));
  });

  return (
    <div className="space-y-4 pb-28 pt-1">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#07326F]">
            Mis clientes
          </h1>
          <p className="text-xs text-slate-500">
            Personas que confían en tu trabajo
          </p>
        </div>
        <span className="font-heading text-xs font-semibold px-2.5 py-1 rounded-full bg-[#07326F]/10 text-[#07326F]">
          {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full pl-9 pr-8 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-[#07326F] focus:outline-hidden focus:border-[#07326F]"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Add Client Form */}
      {isAdding && (
        <Card className="p-4 bg-white border border-[#19AA83]/40 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-heading font-bold text-sm text-[#07326F]">
              Nuevo cliente
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSaveClient} className="space-y-3">
            <div>
              <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                Nombre del cliente *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. María López"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm text-[#07326F] bg-slate-50/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="55 1234 5678"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-[#07326F] bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                  Correo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-[#07326F] bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                Dirección del servicio (calle, número, colonia)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Calle Durango 88, Col. Roma Norte"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-[#07326F] bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                Notas adicionales (opcional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Piso, timbre, horarios de acceso o requerimientos..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-[#07326F] bg-slate-50/50 resize-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              icon={<Check className="w-4 h-4 text-[#19AA83]" />}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar cliente'}
            </Button>
          </form>
        </Card>
      )}

      {/* Client List */}
      <div className="space-y-3">
        {clients.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-slate-200/80 shadow-xs space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-heading font-bold text-sm text-[#07326F]">
              Todavía no tienes clientes
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Agrega tu primer cliente para comenzar a organizar tus servicios y cobros.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleStartAdd}
                icon={<Plus className="w-4 h-4 text-[#F9D785]" />}
              >
                Agregar mi primer cliente
              </Button>
            </div>
          </Card>
        ) : filteredClients.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6">
            No se encontraron clientes que coincidan con "{searchTerm}".
          </p>
        ) : (
          filteredClients.map((client) => (
            <Card
              key={client.id}
              className="p-4 bg-white border border-slate-200/80 hover:border-[#07326F]/30 transition-all shadow-xs cursor-pointer"
              onClick={() => onSelectClient(client)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#07326F]/10 text-[#07326F] flex items-center justify-center font-heading font-bold text-base shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#07326F]">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{client.phone || 'Sin teléfono'}</span>
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-heading font-semibold text-[#19AA83] bg-[#19AA83]/10 px-2 py-0.5 rounded-full">
                  {client.totalServices || 0} servicios
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 truncate max-w-[190px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{client.address || client.notes || 'Ver perfil de cliente'}</span>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onChargeClient(client)}
                    className="px-2.5 py-1 rounded-lg text-xs font-heading font-medium text-[#07326F] bg-slate-100 hover:bg-[#07326F] hover:text-white transition-colors cursor-pointer"
                  >
                    Cobrar
                  </button>
                  <button
                    onClick={() => onScheduleClient(client)}
                    className="px-2.5 py-1 rounded-lg text-xs font-heading font-medium text-white bg-[#07326F] hover:bg-[#032863] transition-colors cursor-pointer"
                  >
                    Cita
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {!isAdding && clients.length > 0 && (
        <div className="pt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handleStartAdd}
            icon={<Plus className="w-4 h-4 text-[#07326F]" />}
          >
            Agregar nuevo cliente
          </Button>
        </div>
      )}

      {/* Free Plan Client Limit Modal (Section 51) */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 space-y-3.5 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F9D785]/30 text-[#07326F] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-[#07326F]" />
            </div>

            <div>
              <h3 className="font-heading font-bold text-lg text-[#07326F]">
                Límite de 5 clientes alcanzado
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tu cuenta gratuita permite registrar hasta 5 clientes. Activa el <strong>Plan PRO ($200 MXN/mes)</strong> para tener clientes ilimitados, recordatorios automáticos y recibos profesionales.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setShowLimitModal(false);
                  onNavigate('plan-manager');
                }}
                icon={<Sparkles className="w-4 h-4 text-[#F9D785]" />}
              >
                Activar Plan PRO ($200 MXN/mes)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLimitModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
