import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, Clock, MapPin, RefreshCw, ShieldAlert, Video, X } from 'lucide-react-native';
import { formatUsdFromCents } from '../../../lib/money';
import { LivePreviewStatus, type LivePreviewActorRole, type LivePreviewRequest } from '../types';

type Props = {
  request: LivePreviewRequest | null;
  role: LivePreviewActorRole;
  errorMessage: string | null;
  onRefresh: () => void;
  onJoinCall: () => void;
  onCancel: () => void;
  onOpenCompletion: () => void;
};

const statusCopy: Record<LivePreviewStatus, string> = {
  [LivePreviewStatus.Draft]: 'Draft',
  [LivePreviewStatus.PaymentPending]: 'Payment pending',
  [LivePreviewStatus.Escrowed]: 'Escrowed',
  [LivePreviewStatus.WaitingForHelper]: 'Waiting for helper',
  [LivePreviewStatus.Accepted]: 'Helper accepted',
  [LivePreviewStatus.InCall]: 'Live call in progress',
  [LivePreviewStatus.CallEnded]: 'Call ended',
  [LivePreviewStatus.Completed]: 'Ready for confirmation',
  [LivePreviewStatus.Confirmed]: 'Confirmed and paid out',
  [LivePreviewStatus.Disputed]: 'Disputed',
  [LivePreviewStatus.Cancelled]: 'Cancelled',
  [LivePreviewStatus.Expired]: 'Expired',
};

export function LivePreviewWaitingScreen({
  request,
  role,
  errorMessage,
  onRefresh,
  onJoinCall,
  onCancel,
  onOpenCompletion,
}: Props) {
  if (!request) {
    return (
      <View style={styles.emptyWrap}>
        <Video color="#da251d" size={30} />
        <Text style={styles.title}>No live preview request yet</Text>
        <Pressable style={styles.secondaryButton} onPress={onRefresh}>
          <Text style={styles.secondaryButtonText}>Refresh</Text>
        </Pressable>
      </View>
    );
  }

  const canJoin = [LivePreviewStatus.Accepted, LivePreviewStatus.InCall].includes(request.status);
  const canOpenCompletion = [
    LivePreviewStatus.Completed,
    LivePreviewStatus.CallEnded,
    LivePreviewStatus.Confirmed,
    LivePreviewStatus.Disputed,
  ].includes(request.status);
  const canCancel = role === 'traveler' && [
    LivePreviewStatus.PaymentPending,
    LivePreviewStatus.WaitingForHelper,
  ].includes(request.status);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          {request.status === LivePreviewStatus.Confirmed ? (
            <Check color="#ffffff" size={22} />
          ) : request.status === LivePreviewStatus.Disputed ? (
            <ShieldAlert color="#ffffff" size={22} />
          ) : (
            <Clock color="#ffffff" size={22} />
          )}
        </View>
        <Text style={styles.eyebrow}>Live Local Preview</Text>
        <Text style={styles.title}>{statusCopy[request.status]}</Text>
        <Text style={styles.subtitle}>{request.placeName} · {request.city}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Request details</Text>
        <InfoRow label="Price" value={formatUsdFromCents(request.priceCents)} />
        <InfoRow label="Escrow" value={request.escrowStatus} />
        <InfoRow label="Payout" value={request.payoutStatus} />
        <InfoRow label="Language" value={request.requestedLanguage} />
        <InfoRow label="Call room" value={request.callRoomId ?? 'Created after helper accepts'} />
      </View>

      {request.helperId ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Your local helper</Text>
          <Text style={styles.helperName}>{request.helperName}</Text>
          <View style={styles.inlineRow}>
            <MapPin color="#da251d" size={16} />
            <Text style={styles.muted}>
              {request.helperDistanceKm === null ? 'City matched' : `${request.helperDistanceKm.toFixed(1)} km from place`}
            </Text>
          </View>
          <Text style={styles.muted}>Rating {request.helperRating?.toFixed(1) ?? 'New helper'} · Estimated start now</Text>
        </View>
      ) : (
        <View style={styles.notice}>
          <Clock color="#b45309" size={18} />
          <Text style={styles.noticeText}>Nearby helpers can see this job only after payment is safely escrowed.</Text>
        </View>
      )}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.buttonStack}>
        {canJoin ? (
          <Pressable style={styles.primaryButton} onPress={onJoinCall}>
            <Video color="#ffffff" size={18} />
            <Text style={styles.primaryButtonText}>Start Live Call</Text>
          </Pressable>
        ) : null}
        {canOpenCompletion ? (
          <Pressable style={styles.primaryButton} onPress={onOpenCompletion}>
            <Check color="#ffffff" size={18} />
            <Text style={styles.primaryButtonText}>Review completion</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.secondaryButton} onPress={onRefresh}>
          <RefreshCw color="#da251d" size={16} />
          <Text style={styles.secondaryButtonText}>Refresh status</Text>
        </Pressable>
        {canCancel ? (
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <X color="#da251d" size={16} />
            <Text style={styles.cancelButtonText}>Cancel and mark refund required</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 112 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  statusCard: { padding: 18, borderRadius: 12, backgroundColor: '#1a1a1a', gap: 6 },
  statusIcon: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#da251d' },
  eyebrow: { color: '#ffd23f', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 23, fontWeight: '900' },
  subtitle: { color: '#f4d7d6', fontSize: 14, fontWeight: '800' },
  panel: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ececec', gap: 8, backgroundColor: '#ffffff' },
  sectionTitle: { color: '#1a1a1a', fontSize: 16, fontWeight: '900' },
  helperName: { color: '#1a1a1a', fontSize: 18, fontWeight: '900' },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  muted: { color: '#7a7a7a', fontSize: 13, fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  infoLabel: { color: '#7a7a7a', fontSize: 12, fontWeight: '800' },
  infoValue: { flex: 1, color: '#1a1a1a', textAlign: 'right', fontSize: 13, fontWeight: '900' },
  notice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 10, backgroundColor: '#fff7ed' },
  noticeText: { flex: 1, color: '#8a4b08', fontSize: 13, fontWeight: '800', lineHeight: 19 },
  errorText: { color: '#da251d', fontWeight: '900' },
  buttonStack: { gap: 10 },
  primaryButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#da251d',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#f3c7c4',
  },
  secondaryButtonText: { color: '#da251d', fontWeight: '900' },
  cancelButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fdebea',
  },
  cancelButtonText: { color: '#da251d', fontWeight: '900' },
});
