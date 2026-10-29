import React, { useState } from 'react';
import { Phone, Mail, MapPin, Calendar, Clock, DollarSign, Plus, CreditCard, Edit2, ArrowLeft, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Client, Appointment, Screen } from '../types';
import { updateClient } from '../services/firebaseService';

interface ClientDetailScreenProps {
  client: Client;
  businessId: string;
  appointments: Appointment[];
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onChargeClient: (client: Client) => void;
  onScheduleClient: (client: Client) => void;
  onRefresh: () => Promise<void>;
}

export const ClientDetailScreen: React.FC<ClientDetailScreenProps> = ({
  client,
  businessId,
  appointments,
  onBack,
  onNavigate,
  onChargeClient,
  onScheduleClient,
  onRefresh,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(client.name);
  const [phone, setPhone] = useState<string>(client.phone || '');
  const [email, setEmail] = useState<string>(client.email || '');
  const [notes, setNotes] = useState<string>(client.notes || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const clientAppointments = appointments.filter(a => a.clientId === client.id);
  const nextAppointment = clientAppointments.find(a => a.status === 'confirmed' || a.status === 'pending');
  const pastAppointments = clientAppointments.filter(a => a.status === 'completed');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateClient(businessId, client.id, {
        name,
        phone,
        email,
        notes,
      });
      await onRefresh();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-heading font-medium text-slate-500 hover:text-[#07326F] cursor-pointer"
        >
          ← Volver a clientes
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-heading font-semibold text-[#07326F] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Edit2 className="w-3 h-3" />
          <span>{isEditing ? 'Cancelar edición' : 'Editar cliente'}</span>
        </button>
      </div>

      {isEditing ? (
        <Card className="p-4 bg-white border border-slate-200/90 shadow-sm space-y-3">
          <h3 className="font-heading font-bold text-sm text-[#07326F]">
            Editar información del cliente
          </h3>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                Nombre
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm text-[#07326F] bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm text-[#07326F] bg-slate-50/50"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm text-[#07326F] bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                Notas sobre el cliente o dirección
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-[#07326F] bg-slate-50/50"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving}
              icon={<Check className="w-4 h-4 text-[#19AA83]" />}
            >
              Guardar cambios
            </Button>
          </form>
        </Card>
      ) : (
        /* Client Profile Card */
        <Card className="p-5 bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#07326F] text-white flex items-center justify-center font-heading font-bold text-xl shrink-0 shadow-sm">
              {client.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-[#07326F]">
                {client.name}
              </h2>
              {client.phone && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{client.phone}</span>
                </p>
              )}
              {client.email && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{client.email}</span>
                </p>
              )}
            </div>
          </div>

          {client.notes && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-0.5">
                Notas y dirección
              </span>
              <p>{client.notes}</p>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Citas</span>
              <span className="font-heading font-bold text-base text-[#07326F]">
                {clientAppointments.length}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Pagado</span>
              <span className="font-heading font-bold text-base text-[#19AA83]">
                ${client.totalPaid || 0}
              </span>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => onScheduleClient(client)}
              icon={<Plus className="w-4 h-4 text-[#F9D785]" />}
            >
              Agendar cita
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => onChargeClient(client)}
              icon={<CreditCard className="w-4 h-4 text-[#19AA83]" />}
            >
              Cobrar
            </Button>
          </div>
        </Card>
      )}

      {/* Appointment History */}
      <div className="space-y-2.5">
        <h3 className="font-heading font-bold text-sm text-[#07326F] px-1">
          Historial de citas de {client.name}
        </h3>

        {clientAppointments.length === 0 ? (
          <p className="text-xs text-slate-400 px-1 py-2">
            Aún no hay citas registradas con este cliente.
          </p>
        ) : (
          clientAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-heading font-semibold text-[#07326F] block">
                  {apt.serviceName}
                </span>
                <span className="text-slate-400">
                  {apt.date} · {apt.startTime}
                </span>
              </div>
              <div className="text-right">
                <span className="font-heading font-bold text-sm text-[#07326F] block">
                  ${apt.price}
                </span>
                <span className={`text-[10px] font-semibold ${apt.status === 'confirmed' ? 'text-[#19AA83]' : apt.status === 'completed' ? 'text-slate-500' : 'text-amber-500'}`}>
                  {apt.status === 'confirmed' ? 'Confirmada' : apt.status === 'completed' ? 'Realizada' : apt.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
