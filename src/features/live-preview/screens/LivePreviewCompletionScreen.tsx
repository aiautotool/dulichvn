import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AlertTriangle, Check, ShieldAlert, Star } from 'lucide-react-native';
import { formatUsdFromCents } from '../../../lib/money';
import { LivePreviewStatus, type LivePreviewActorRole, type LivePreviewRequest } from '../types';

type Props = {
  request: LivePreviewRequest;
  role: LivePreviewActorRole;
  errorMessage: string | null;
  onConfirm: () => void;
  onDispute: () => void;
  onRate: (rating: number, comment: string) => void;
};

export function LivePreviewCompletionScreen({
  request,
  role,
  errorMessage,
  onConfirm,
  onDispute,
  onRate,
}: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const travelerCanConfirm =
    role === 'traveler' && [LivePreviewStatus.Completed, LivePreviewStatus.CallEnded].includes(request.status);
  const travelerCanRate = role === 'traveler' && request.status === LivePreviewStatus.Confirmed;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Check color="#ffffff" size={28} />
        <Text style={styles.title}>
          {request.status === LivePreviewStatus.Confirmed ? 'Session confirmed' : 'Live session ended'}
        </Text>
        <Text style={styles.subtitle}>{request.placeName} · {request.city}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Escrow summary</Text>
        <InfoRow label="Traveler paid" value={formatUsdFromCents(request.priceCents)} />
        <InfoRow label="Helper reward" value={formatUsdFromCents(request.helperRewardCents)} />
        <InfoRow label="Escrow status" value={request.escrowStatus} />
        <InfoRow label="Payout status" value={request.payoutStatus} />
      </View>

      {role === 'helper' && request.status !== LivePreviewStatus.Confirmed ? (
        <View style={styles.notice}>
          <ShieldAlert color="#b45309" size={18} />
          <Text style={styles.noticeText}>Waiting for traveler confirmation. Payout remains blocked until the traveler confirms completion.</Text>
        </View>
      ) : null}

      {travelerCanConfirm ? (
        <View style={styles.buttonStack}>
          <Pressable style={styles.primaryButton} onPress={onConfirm}>
            <Check color="#ffffff" size={18} />
            <Text style={styles.primaryButtonText}>Confirm completed</Text>
          </Pressable>
          <Pressable style={styles.disputeButton} onPress={onDispute}>
            <AlertTriangle color="#da251d" size={18} />
            <Text style={styles.disputeButtonText}>Report problem</Text>
          </Pressable>
        </View>
      ) : null}

      {request.status === LivePreviewStatus.Disputed ? (
        <View style={styles.notice}>
          <AlertTriangle color="#b45309" size={18} />
          <Text style={styles.noticeText}>This request is disputed. Admin can inspect it from the live-preview admin API buckets.</Text>
        </View>
      ) : null}

      {travelerCanRate ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Rate your helper</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)} style={styles.starButton}>
                <Star color="#ffd23f" fill={value <= rating ? '#ffd23f' : 'transparent'} size={24} />
              </Pressable>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Optional review"
            placeholderTextColor="#8a8a8a"
            multiline
            style={styles.commentInput}
          />
          <Pressable style={styles.secondaryButton} onPress={() => onRate(rating, comment)}>
            <Text style={styles.secondaryButtonText}>Save rating</Text>
          </Pressable>
        </View>
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
  header: { padding: 18, borderRadius: 12, backgroundColor: '#1a1a1a', gap: 8 },
  title: { color: '#ffffff', fontSize: 23, fontWeight: '900' },
  subtitle: { color: '#f4d7d6', fontSize: 14, fontWeight: '800' },
  panel: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ececec', gap: 10, backgroundColor: '#ffffff' },
  sectionTitle: { color: '#1a1a1a', fontSize: 16, fontWeight: '900' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  infoLabel: { color: '#7a7a7a', fontSize: 12, fontWeight: '800' },
  infoValue: { color: '#1a1a1a', fontSize: 13, fontWeight: '900', textAlign: 'right', flex: 1 },
  notice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 10, backgroundColor: '#fff7ed' },
  noticeText: { flex: 1, color: '#8a4b08', fontSize: 13, fontWeight: '800', lineHeight: 19 },
  buttonStack: { gap: 10 },
  primaryButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#da251d',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  disputeButton: {
    minHeight: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fdebea',
  },
  disputeButtonText: { color: '#da251d', fontWeight: '900' },
  ratingRow: { flexDirection: 'row', gap: 6 },
  starButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  commentInput: {
    minHeight: 76,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ececec',
    color: '#1a1a1a',
    padding: 12,
    textAlignVertical: 'top',
  },
  secondaryButton: { minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f3c7c4' },
  secondaryButtonText: { color: '#da251d', fontWeight: '900' },
  errorText: { color: '#da251d', fontWeight: '900' },
});
