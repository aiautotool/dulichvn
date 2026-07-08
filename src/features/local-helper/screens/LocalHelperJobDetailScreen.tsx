import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, MapPin, Video } from 'lucide-react-native';
import { formatUsdFromCents } from '../../../lib/money';
import { LivePreviewStatus } from '../../live-preview/types';
import type { LocalHelperJob, LocalHelperProfile } from '../types';

type Props = {
  profile: LocalHelperProfile | null;
  job: LocalHelperJob | null;
  errorMessage: string | null;
  onAccept: (job: LocalHelperJob) => void;
  onJoinCall: () => void;
  onBack: () => void;
};

export function LocalHelperJobDetailScreen({
  profile,
  job,
  errorMessage,
  onAccept,
  onJoinCall,
  onBack,
}: Props) {
  if (!job) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.title}>Job not found</Text>
        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Back to jobs</Text>
        </Pressable>
      </View>
    );
  }

  const request = job.request;
  const acceptedByThisHelper = profile?.userId && request.helperId === profile.userId;
  const canAccept = request.status === LivePreviewStatus.WaitingForHelper;
  const canJoin = acceptedByThisHelper && [LivePreviewStatus.Accepted, LivePreviewStatus.InCall].includes(request.status);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <MapPin color="#ffffff" size={30} />
        <Text style={styles.title}>{request.placeName}</Text>
        <Text style={styles.subtitle}>{request.city} · {request.requestedLanguage}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Job information</Text>
        <InfoRow label="Reward" value={formatUsdFromCents(request.helperRewardCents)} />
        <InfoRow label="Duration" value="3-5 minutes" />
        <InfoRow label="Distance" value={job.distanceKm === null ? 'City match' : `${job.distanceKm.toFixed(1)} km`} />
        <InfoRow label="Status" value={request.status} />
        <InfoRow label="Escrow" value={request.escrowStatus} />
        <InfoRow label="Payout" value={request.payoutStatus} />
      </View>

      {request.note ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Traveler note</Text>
          <Text style={styles.body}>{request.note}</Text>
        </View>
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.buttonStack}>
        {canAccept ? (
          <Pressable style={styles.primaryButton} onPress={() => onAccept(job)}>
            <Check color="#ffffff" size={18} />
            <Text style={styles.primaryButtonText}>Accept job</Text>
          </Pressable>
        ) : null}
        {canJoin ? (
          <Pressable style={styles.primaryButton} onPress={onJoinCall}>
            <Video color="#ffffff" size={18} />
            <Text style={styles.primaryButtonText}>Join live call</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Back to jobs</Text>
        </Pressable>
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
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  hero: { padding: 18, borderRadius: 12, backgroundColor: '#1a1a1a', gap: 8 },
  title: { color: '#ffffff', fontSize: 23, fontWeight: '900' },
  subtitle: { color: '#f4d7d6', fontSize: 14, fontWeight: '800' },
  panel: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ececec', gap: 8, backgroundColor: '#ffffff' },
  sectionTitle: { color: '#1a1a1a', fontSize: 16, fontWeight: '900' },
  body: { color: '#1a1a1a', fontSize: 14, lineHeight: 21, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  infoLabel: { color: '#7a7a7a', fontSize: 12, fontWeight: '800' },
  infoValue: { color: '#1a1a1a', fontSize: 13, fontWeight: '900', textAlign: 'right', flex: 1 },
  buttonStack: { gap: 10 },
  primaryButton: { minHeight: 48, borderRadius: 8, backgroundColor: '#da251d', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  secondaryButton: { minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f3c7c4' },
  secondaryButtonText: { color: '#da251d', fontWeight: '900' },
  errorText: { color: '#da251d', fontWeight: '900' },
});
