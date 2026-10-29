import React, { useState } from 'react';
import { Plus, Edit2, Check, Clock, DollarSign, ArrowLeft, Power, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Service } from '../types';
import { saveService, updateService } from '../services/firebaseService';

interface ServicesManagerScreenProps {
  businessId: string;
  services: Service[];
  onRefresh: () => Promise<void>;
  onBack: () => void;
  onSaveServiceLocal?: (service: Service) => void;
  onUpdateServiceLocal?: (serviceId: string, updates: Partial<Service>) => void;
}

export const ServicesManagerScreen: React.FC<ServicesManagerScreenProps> = ({
  businessId,
  services,
  onRefresh,
  onBack,
  onSaveServiceLocal,
  onUpdateServiceLocal,
}) => {
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [basePrice, setBasePrice] = useState<number>(500);
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const startCreate = () => {
    setName('');
    setDescription('');
    setBasePrice(500);
    setDurationMinutes(180);
    setIsPrimary(services.length === 0);
    setEditingService(null);
    setIsCreating(true);
  };

  const startEdit = (srv: Service) => {
    setName(srv.name);
    setDescription(srv.description || '');
    setBasePrice(srv.basePrice);
    setDurationMinutes(srv.durationMinutes);
    setIsPrimary(srv.isPrimary || false);
    setEditingService(srv);
    setIsCreating(true);
  };

  const handleSetAsPrimary = async (srv: Service) => {
    if (onUpdateServiceLocal) {
      onUpdateServiceLocal(srv.id, { isPrimary: true, priority: 1 });
    }
    try {
      if (businessId && businessId !== 'biz_demo_ana') {
        await updateService(businessId, srv.id, { isPrimary: true, priority: 1 });
      }
    } catch (dbErr) {
      console.warn('Firestore service update warning:', dbErr);
    }
    try {
      await onRefresh();
    } catch {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      if (editingService) {
        if (onUpdateServiceLocal) {
          onUpdateServiceLocal(editingService.id, {
            name,
            description,
            basePrice,
            durationMinutes,
            isPrimary,
            priority: isPrimary ? 1 : editingService.priority || 2,
          });
        }
        try {
          if (businessId && businessId !== 'biz_demo_ana') {
            await updateService(businessId, editingService.id, {
              name,
              description,
              basePrice,
              durationMinutes,
              isPrimary,
              priority: isPrimary ? 1 : editingService.priority || 2,
            });
          }
        } catch (dbErr) {
          console.warn('Firestore service update warning:', dbErr);
        }
      } else {
        const newService: Service = {
          id: `srv_${Date.now()}`,
          businessId,
          name,
          description,
          basePrice,
          durationMinutes,
          active: true,
          isPrimary,
          priority: isPrimary ? 1 : services.length + 1,
          createdAt: now,
          updatedAt: now,
        };
        if (onSaveServiceLocal) {
          onSaveServiceLocal(newService);
        }
        try {
          if (businessId && businessId !== 'biz_demo_ana') {
            await saveService(businessId, newService);
          }
        } catch (dbErr) {
          console.warn('Firestore service save warning:', dbErr);
        }
      }
      try {
        await onRefresh();
      } catch {}
      setIsCreating(false);
      setEditingService(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (srv: Service) => {
    if (onUpdateServiceLocal) {
      onUpdateServiceLocal(srv.id, { active: !srv.active });
    }
    try {
      if (businessId && businessId !== 'biz_demo_ana') {
        await updateService(businessId, srv.id, { active: !srv.active });
      }
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-xs font-heading font-medium text-slate-500 hover:text-[#07326F] cursor-pointer"
        >
          ← Volver a Mi negocio
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#07326F]">
            Mis servicios
          </h1>
          <p className="text-xs text-slate-500">
            Catálogo y tarifas de tu negocio
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#07326F] text-white rounded-xl text-xs font-heading font-semibold hover:bg-[#032863] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#F9D785]" />
            <span>Agregar</span>
          </button>
        )}
      </div>

      {isCreating ? (
        <Card className="p-4 bg-white border border-slate-200/90 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-heading font-bold text-sm text-[#07326F]">
              {editingService ? 'Editar servicio' : 'Nuevo servicio'}
            </h3>
            <button
              onClick={() => { setIsCreating(false); setEditingService(null); }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                Nombre del servicio
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Limpieza profunda"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm text-[#07326F] bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles sobre lo que incluye"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-xs text-[#07326F] bg-slate-50/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                  Precio base ($)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-semibold text-[#07326F] bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-medium text-slate-500 mb-1">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#07326F] text-sm font-semibold text-[#07326F] bg-slate-50/50"
                />
              </div>
            </div>

            {/* Primary Service Selector */}
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/90">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-[#07326F] border-slate-300 focus:ring-[#07326F]"
                />
                <span className="text-xs font-heading font-semibold text-[#07326F] flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Establecer como Servicio Principal (Prioridad 1)</span>
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mt-1 pl-6">
                Este servicio será el más destacado en tu tarjeta de presentación digital y enlace público para clientes.
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                icon={<Check className="w-4 h-4 text-[#19AA83]" />}
              >
                {editingService ? 'Actualizar servicio' : 'Guardar servicio'}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {services.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80">
              <p className="text-xs text-slate-500 mb-3">
                Todavía no tienes servicios registrados.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={startCreate}
                icon={<Plus className="w-4 h-4 text-[#F9D785]" />}
              >
                Agregar mi primer servicio
              </Button>
            </div>
          ) : (
            (() => {
              const sortedList = [...services].sort((a, b) => {
                if (a.isPrimary && !b.isPrimary) return -1;
                if (!a.isPrimary && b.isPrimary) return 1;
                const pA = a.priority ?? 99;
                const pB = b.priority ?? 99;
                if (pA !== pB) return pA - pB;
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              });

              return sortedList.map((srv, idx) => {
                const isMain = srv.isPrimary || (idx === 0 && !sortedList.some(s => s.isPrimary));

                return (
                  <Card
                    key={srv.id}
                    className={`p-4 transition-all ${srv.active ? 'bg-white border border-slate-200/90' : 'bg-slate-50/80 border border-slate-200 opacity-70'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-bold text-sm text-[#07326F]">
                            {srv.name}
                          </h3>
                          {isMain ? (
                            <span className="text-[10px] font-heading font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Principal (Prioridad 1)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-heading font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              Secundario (Prioridad {idx + 1})
                            </span>
                          )}
                          {!srv.active && (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                              Inactivo
                            </span>
                          )}
                        </div>
                        {srv.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {srv.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className="font-heading font-bold text-base text-[#19AA83] tabular-nums block">
                          ${srv.basePrice}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {Math.round(srv.durationMinutes / 60)} hrs ({srv.durationMinutes} min)
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleActive(srv)}
                          className="flex items-center gap-1.5 text-slate-500 hover:text-[#07326F] cursor-pointer"
                        >
                          <Power className={`w-3.5 h-3.5 ${srv.active ? 'text-[#19AA83]' : 'text-slate-400'}`} />
                          <span>{srv.active ? 'Desactivar' : 'Activar'}</span>
                        </button>

                        {!isMain && (
                          <button
                            onClick={() => handleSetAsPrimary(srv)}
                            className="flex items-center gap-1 text-amber-700 hover:text-amber-800 font-heading font-semibold cursor-pointer text-xs"
                          >
                            <Star className="w-3 h-3 text-amber-500" />
                            <span>Hacer principal</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => startEdit(srv)}
                        className="flex items-center gap-1 text-[#07326F] hover:underline font-heading font-medium cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </Card>
                );
              });
            })()
          )}
        </div>
      )}
    </div>
  );
};
