import type { WalletRepository } from '../repositories/WalletRepository';
import type { WalletBalance, WalletTransaction } from '../types';

export const LIVE_PREVIEW_MINIMUM_WALLET_CENTS = 100;

export class WalletService {
  constructor(private readonly walletRepository: WalletRepository) {}

  getBalance(userId: string): Promise<WalletBalance> {
    return this.walletRepository.getBalance(userId);
  }

  listTransactions(userId: string): Promise<WalletTransaction[]> {
    return this.walletRepository.listTransactions(userId);
  }

  async topUp(userId: string, amountCents: number): Promise<WalletBalance> {
    if (!userId) throw new Error('login_required');
    return this.walletRepository.topUp(userId, amountCents, 'Demo top up. Replace with App Store/Stripe/PayPal payment confirmation in production.');
  }

  async ensureCanPay(userId: string, amountCents: number): Promise<WalletBalance> {
    const balance = await this.walletRepository.getBalance(userId);
    if (balance.availableCents < amountCents) throw new Error('insufficient_wallet_balance');
    return balance;
  }

  holdToEscrow(userId: string, amountCents: number, referenceId: string): Promise<WalletBalance> {
    return this.walletRepository.holdToEscrow(userId, amountCents, referenceId);
  }

  releaseEscrow(userId: string, amountCents: number, referenceId: string): Promise<WalletBalance> {
    return this.walletRepository.releaseEscrow(userId, amountCents, referenceId);
  }

  refundEscrow(userId: string, amountCents: number, referenceId: string): Promise<WalletBalance> {
    return this.walletRepository.refundEscrow(userId, amountCents, referenceId);
  }

  creditHelper(userId: string, amountCents: number, referenceId: string): Promise<WalletBalance> {
    return this.walletRepository.credit(userId, amountCents, 'helper_payout', referenceId, 'Live preview helper payout');
  }
}
