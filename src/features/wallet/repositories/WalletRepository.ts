import type { WalletBalance, WalletTransaction } from '../types';

export interface WalletRepository {
  getBalance(userId: string): Promise<WalletBalance>;
  topUp(userId: string, amountCents: number, note?: string): Promise<WalletBalance>;
  holdToEscrow(userId: string, amountCents: number, referenceId: string): Promise<WalletBalance>;
  releaseEscrow(userId: string, amountCents: number, referenceId: string): Promise<WalletBalance>;
  refundEscrow(userId: string, amountCents: number, referenceId: string): Promise<WalletBalance>;
  credit(userId: string, amountCents: number, type: WalletTransaction['type'], referenceId: string, note?: string): Promise<WalletBalance>;
  listTransactions(userId: string): Promise<WalletTransaction[]>;
}
