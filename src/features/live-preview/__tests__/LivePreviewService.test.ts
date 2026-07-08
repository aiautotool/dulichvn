import { MockLocalHelperRepository } from '../../local-helper/repositories/MockLocalHelperRepository';
import { MockLiveCallRepository } from '../repositories/MockLiveCallRepository';
import { MockLivePreviewRepository } from '../repositories/MockLivePreviewRepository';
import { MockPaymentEscrowRepository } from '../repositories/MockPaymentEscrowRepository';
import { LiveCallService } from '../services/LiveCallService';
import { LivePreviewService } from '../services/LivePreviewService';
import { PaymentEscrowService } from '../services/PaymentEscrowService';
import { EscrowStatus, LivePreviewStatus, PayoutStatus, type LivePreviewActor } from '../types';

type TestContext = {
  service: LivePreviewService;
  localHelperRepository: MockLocalHelperRepository;
  traveler: LivePreviewActor;
  helper: LivePreviewActor;
  secondHelper: LivePreviewActor;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectRejects(action: () => Promise<unknown>, message: string) {
  try {
    await action();
  } catch {
    return;
  }
  throw new Error(message);
}

function createContext(): TestContext {
  const livePreviewRepository = new MockLivePreviewRepository();
  const localHelperRepository = new MockLocalHelperRepository(livePreviewRepository);
  const paymentEscrowRepository = new MockPaymentEscrowRepository();
  const liveCallRepository = new MockLiveCallRepository();
  const paymentEscrowService = new PaymentEscrowService(livePreviewRepository, paymentEscrowRepository);
  const liveCallService = new LiveCallService(liveCallRepository);
  const service = new LivePreviewService(
    livePreviewRepository,
    localHelperRepository,
    paymentEscrowService,
    liveCallService,
  );

  return {
    service,
    localHelperRepository,
    traveler: { id: 'traveler_1', name: 'Traveler One', role: 'traveler' },
    helper: { id: 'helper_1', name: 'Helper One', role: 'helper' },
    secondHelper: { id: 'helper_2', name: 'Helper Two', role: 'helper' },
  };
}

async function saveHelperProfiles(context: TestContext) {
  await context.localHelperRepository.saveProfile({
    userId: context.helper.id,
    fullName: context.helper.name,
    city: 'Hội An',
    languages: ['English'],
    intro: 'I can show public areas around Hội An.',
  });
  await context.localHelperRepository.setOnline({
    userId: context.helper.id,
    isOnline: true,
    currentLat: 15.8801,
    currentLng: 108.338,
  });
  await context.localHelperRepository.saveProfile({
    userId: context.secondHelper.id,
    fullName: context.secondHelper.name,
    city: 'Hội An',
    languages: ['English'],
    intro: 'Second helper profile.',
  });
}

async function createPendingRequest(context: TestContext) {
  return context.service.createRequest({
    placeId: 'hoi_an',
    placeName: 'Phố cổ Hội An',
    city: 'Hội An',
    lat: 15.8801,
    lng: 108.338,
    travelerId: context.traveler.id,
    travelerName: context.traveler.name,
    requestedLanguage: 'English',
    note: 'Show the river entrance.',
  });
}

async function createPaidRequest(context: TestContext) {
  const request = await createPendingRequest(context);
  return context.service.payAndPublish(request.id, context.traveler);
}

export const livePreviewServiceTestCases = [
  'Create request',
  'Pay and escrow',
  'Helper accepts request',
  'Prevent second helper from accepting same request',
  'Start call',
  'End call',
  'Traveler confirms',
  'Escrow released',
  'Traveler disputes',
  'Expired request',
  'Refund required',
  'Invalid status transitions',
  'Helper cannot accept unpaid request',
];

export async function runLivePreviewServiceTestCases() {
  {
    const context = createContext();
    const request = await createPendingRequest(context);
    assert(request.status === LivePreviewStatus.PaymentPending, 'Create request should start payment_pending');
    assert(request.priceCents === 100, 'Create request should price the live preview at 100 cents');
  }

  {
    const context = createContext();
    await saveHelperProfiles(context);
    const paid = await createPaidRequest(context);
    assert(paid.status === LivePreviewStatus.WaitingForHelper, 'Pay should publish request to helpers');
    assert(paid.escrowStatus === EscrowStatus.Escrowed, 'Pay should move funds to escrow');

    const accepted = await context.service.acceptRequest(paid.id, context.helper);
    assert(accepted.status === LivePreviewStatus.Accepted, 'Helper accepts request');
    assert(accepted.helperId === context.helper.id, 'Accepted request should lock to one helper');

    await expectRejects(
      () => context.service.acceptRequest(paid.id, context.secondHelper),
      'Second helper should not accept the same request',
    );

    const inCall = await context.service.startCall(accepted.id, context.helper);
    assert(inCall.status === LivePreviewStatus.InCall, 'Start call should mark request in_call');

    const completed = await context.service.endCall(inCall.id, context.helper, 240);
    assert(completed.status === LivePreviewStatus.Completed, 'End call should mark request completed');
    assert(completed.payoutStatus === PayoutStatus.Releasable, 'End call should make payout releasable');

    const confirmed = await context.service.confirmCompletion(completed.id, context.traveler);
    assert(confirmed.status === LivePreviewStatus.Confirmed, 'Traveler confirms after call ends');
    assert(confirmed.escrowStatus === EscrowStatus.Released, 'Confirmation releases escrow');
    assert(confirmed.payoutStatus === PayoutStatus.Released, 'Confirmation releases helper payout');
  }

  {
    const context = createContext();
    await saveHelperProfiles(context);
    const paid = await createPaidRequest(context);
    const accepted = await context.service.acceptRequest(paid.id, context.helper);
    const inCall = await context.service.startCall(accepted.id, context.traveler);
    const completed = await context.service.endCall(inCall.id, context.traveler, 210);
    const disputed = await context.service.disputeRequest(completed.id, context.traveler);
    assert(disputed.status === LivePreviewStatus.Disputed, 'Traveler disputes should mark request disputed');
    assert(disputed.escrowStatus === EscrowStatus.Disputed, 'Dispute should block escrow');
    assert(disputed.payoutStatus === PayoutStatus.Disputed, 'Dispute should block payout');
  }

  {
    const context = createContext();
    const paid = await createPaidRequest(context);
    const expired = await context.service.expireRequest(paid.id);
    assert(expired.status === LivePreviewStatus.Expired, 'Expired request should be marked expired');
    assert(expired.escrowStatus === EscrowStatus.Refunded, 'Expired paid request should require refund');
  }

  {
    const context = createContext();
    await saveHelperProfiles(context);
    const unpaid = await createPendingRequest(context);
    await expectRejects(
      () => context.service.acceptRequest(unpaid.id, context.helper),
      'Helper cannot accept unpaid request',
    );
    await expectRejects(
      () => context.service.confirmCompletion(unpaid.id, context.traveler),
      'Invalid status transition should be rejected',
    );
  }
}
