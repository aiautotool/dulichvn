import type { PaymentEscrowLedgerEvent, PaymentEscrowRepository } from './PaymentEscrowRepository';

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class MockPaymentEscrowRepository implements PaymentEscrowRepository {
  private readonly events: PaymentEscrowLedgerEvent[] = [];

  async record(
    event: Omit<PaymentEscrowLedgerEvent, 'id' | 'createdAt'>,
  ): Promise<PaymentEscrowLedgerEvent> {
    const next: PaymentEscrowLedgerEvent = {
      ...event,
      id: createId('ledger'),
      createdAt: new Date().toISOString(),
    };
    this.events.push(next);
    return { ...next };
  }

  async listForRequest(requestId: string): Promise<PaymentEscrowLedgerEvent[]> {
    return this.events.filter((event) => event.requestId === requestId).map((event) => ({ ...event }));
  }
}
