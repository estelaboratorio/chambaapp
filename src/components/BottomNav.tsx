import React from 'react';
import { Home, Calendar, Users, Briefcase, Sparkles } from 'lucide-react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
}) => {
  const tabs = [
    {
      id: 'home' as Screen,
      label: 'Inicio',
      icon: Home,
      isActive: currentScreen === 'home',
    },
    {
      id: 'appointments' as Screen,
      label: 'Citas',
      icon: Calendar,
      isActive: currentScreen === 'appointments' || currentScreen === 'new-appointment',
    },
    {
      id: 'clients' as Screen,
      label: 'Clientes',
      icon: Users,
      isActive: currentScreen === 'clients',
    },
    {
      id: 'business' as Screen,
      label: 'Mi negocio',
      icon: Briefcase,
      isActive: currentScreen === 'business',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-1 max-w-md mx-auto">
      <div className="grid grid-cols-4 items-center min-h-[60px] py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 transition-colors cursor-pointer ${
                active ? 'text-[#07326F]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#19AA83] rounded-full" />
                )}
              </div>
              <span
                className={`text-[11px] font-heading mt-1 leading-tight text-center break-words max-w-full ${
                  active ? 'font-semibold text-[#07326F]' : 'font-normal'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
