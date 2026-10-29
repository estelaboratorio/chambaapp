import { PlatformConfig } from '../types';

export const platformConfig = {
  freePlanMaxServices: 5,
  freePlanMaxClients: 5,
  proMonthlyPriceMXN: 250, // $250 MXN mensual
  proPaymentsMonthlyPriceMXN: 350,
  platformFeePercentage: 3.5, // ChambaApp transaction fee
  supportEmail: 'estelaboratoriocreativo@gmail.com',
};

// Formatting helpers
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatShortCurrency = (amount: number): string => {
  return `$${Math.round(amount)}`;
};
