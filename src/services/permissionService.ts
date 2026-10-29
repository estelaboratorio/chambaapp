import { Subscription, PlanType } from '../types';
import { platformConfig } from './configService';

export const permissionService = {
  isPro(subscription?: Subscription | null): boolean {
    if (!subscription) return false;
    return (subscription.plan === 'pro' || subscription.plan === 'pro_payments') && subscription.status === 'active';
  },

  isProPayments(subscription?: Subscription | null): boolean {
    if (!subscription) return false;
    return subscription.plan === 'pro_payments' && subscription.status === 'active';
  },

  getClientLimit(subscription?: Subscription | null): number {
    if (this.isPro(subscription)) {
      return Infinity;
    }
    return platformConfig.freePlanMaxClients; // Strict limit: 5 clients
  },

  canCreateClient(currentClientCount: number, subscription?: Subscription | null): boolean {
    const limit = this.getClientLimit(subscription);
    return currentClientCount < limit;
  },

  canUsePayments(subscription?: Subscription | null): boolean {
    return this.isProPayments(subscription);
  },

  canUseProfessionalReceipts(subscription?: Subscription | null): boolean {
    return this.isPro(subscription);
  },

  canUseReminders(subscription?: Subscription | null): boolean {
    return this.isPro(subscription);
  },

  canViewStatistics(subscription?: Subscription | null): boolean {
    return this.isPro(subscription);
  },

  canViewHistory(subscription?: Subscription | null): boolean {
    return this.isPro(subscription);
  },

  getPlanBadge(subscription?: Subscription | null): { label: string; color: string; bgColor: string } {
    if (!subscription || subscription.plan === 'free') {
      return { label: 'GRATIS (Hasta 5 clientes)', color: '#07326F', bgColor: '#07326F/10' };
    }
    if (subscription.plan === 'pro_payments') {
      return { label: 'PRO + PAGOS', color: '#19AA83', bgColor: '#19AA83/15' };
    }
    return { label: 'PRO', color: '#19AA83', bgColor: '#19AA83/15' };
  }
};
