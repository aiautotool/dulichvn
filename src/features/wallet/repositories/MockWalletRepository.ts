import type { WalletBalance, WalletTransaction } from '../types';
import type { WalletRepository } from './WalletRepository';

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function cloneBalance(balance: WalletBalance): WalletBalance {
  return { ...balance };
}

export class MockWalletRepository implements WalletRepository {
  private readonly balances = new Map<string, WalletBalance>();
  private readonly transactions: WalletTransaction[] = [];

  async getBalance(userId: string): Promise<WalletBalance> {
    return cloneBalance(this.ensureBalance(userId));
  }

  async topUp(userId: string, amountCents: number, note = 'Wallet top up'): Promise<WalletBalance> {
    if (amountCents <= 0) throw new Error('top_up_amount_must_be_positive');
    const balance = this.ensureBalance(userId);
    balance.availableCents += amountCents;
    balance.updatedAt = nowIso();
    this.record(userId, 'top_up', amountCents, undefined, note);
    return cloneBalance(balance);
  }

  async holdToEscrow(userId: string, amountCents: number, referenceId: string): Promise<WalletBalance> {
    if (amountCents <= 0) throw new Error('escrow_amount_must_be_positive');
    const balance = this.ensureBalance(userId);
    if (balance.availableCents < amountCents) throw new Error('insufficient_wallet_balance');
    balance.availableCents -= amountCents;
    balance.escrowedCents += amountCents;
    balance.updatedAt = nowIso();
    this.record(userId, 'escrow_hold', -amountCents, referenceId, 'Live preview escrow hold');
    return cloneBalance(balance);
  }

  async releaseEscrow(userId: string, amountCents: number, referenceId: string): Promise<WalletBalance> {
    const balance = this.ensureBalance(userId);
    if (balance.escrowedCents < amountCents) throw new Error('escrow_balance_too_low');
    balance.escrowedCents -= amountCents;
    balance.updatedAt = nowIso();
    this.record(userId, 'escrow_release', -amountCents, referenceId, 'Escrow released');
    return cloneBalance(balance);
  }

  async refundEscrow(userId: string, amountCents: number, referenceId: string): Promise<WalletBalance> {
    const balance = this.ensureBalance(userId);
    if (balance.escrowedCents < amountCents) throw new Error('escrow_balance_too_low');
    balance.escrowedCents -= amountCents;
    balance.availableCents += amountCents;
    balance.updatedAt = nowIso();
    this.record(userId, 'refund', amountCents, referenceId, 'Escrow refund');
    return cloneBalance(balance);
  }

  async credit(
    userId: string,
    amountCents: number,
    type: WalletTransaction['type'],
    referenceId: string,
    note?: string,
  ): Promise<WalletBalance> {
    if (amountCents <= 0) throw new Error('credit_amount_must_be_positive');
    const balance = this.ensureBalance(userId);
    balance.availableCents += amountCents;
    balance.updatedAt = nowIso();
    this.record(userId, type, amountCents, referenceId, note);
    return cloneBalance(balance);
  }

  async listTransactions(userId: string): Promise<WalletTransaction[]> {
    return this.transactions
      .filter((transaction) => transaction.userId === userId)
      .map((transaction) => ({ ...transaction }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private ensureBalance(userId: string): WalletBalance {
    const current = this.balances.get(userId);
    if (current) return current;
    const next: WalletBalance = {
      userId,
      availableCents: 0,
      escrowedCents: 0,
      currency: 'USD',
      updatedAt: nowIso(),
    };
    this.balances.set(userId, next);
    return next;
  }

  private record(
    userId: string,
    type: WalletTransaction['type'],
    amountCents: number,
    referenceId?: string,
    note?: string,
  ) {
    this.transactions.push({
      id: createId('wt'),
      userId,
      type,
      amountCents,
      currency: 'USD',
      referenceId,
      note,
      createdAt: nowIso(),
    });
  }
}
