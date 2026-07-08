import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DollarSign, RefreshCw } from 'lucide-react-native';
import { formatUsdFromCents } from '../../../lib/money';
import type { LocalHelperEarning } from '../types';

type Props = {
  earnings: LocalHelperEarning[];
  errorMessage: string | null;
  onRefresh: () => void;
  onOpenJobs: () => void;
};

export function LocalHelperEarningsScreen({
  earnings,
  errorMessage,
  onRefresh,
  onOpenJobs,
}: Props) {
  const totals = useMemo(() => {
    return earnings.reduce(
      (result, earning) => {
        result[earning.status] += earning.rewardCents;
        return result;
      },
      { pending: 0, released: 0, disputed: 0 },
    );
  }, [earnings]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Helper earnings</Text>
          <Text style={styles.subtitle}>Pending, released, and disputed payouts</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={onRefresh}>
          <RefreshCw color="#da251d" size={18} />
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard label="Pending" value={formatUsdFromCents(totals.pending)} />
        <SummaryCard label="Released" value={formatUsdFromCents(totals.released)} />
        <SummaryCard label="Disputed" value={formatUsdFromCents(totals.disputed)} />
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {earnings.length === 0 ? (
          <View style={styles.emptyCard}>
            <DollarSign color="#da251d" size={26} />
            <Text style={styles.emptyTitle}>No earnings yet</Text>
            <Text style={styles.emptyBody}>Accepted and completed live preview jobs will appear here.</Text>
            <Pressable style={styles.primaryButton} onPress={onOpenJobs}>
              <Text style={styles.primaryButtonText}>Find jobs</Text>
            </Pressable>
          </View>
        ) : (
          earnings.map((earning) => (
            <View key={earning.requestId} style={styles.earningRow}>
              <View style={styles.earningBody}>
                <Text style={styles.earningTitle}>{earning.placeName}</Text>
                <Text style={styles.earningSub}>{earning.city} · {earning.status}</Text>
              </View>
              <Text style={styles.earningAmount}>{formatUsdFromCents(earning.rewardCents)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, gap: 12 },
  title: { color: '#1a1a1a', fontSize: 21, fontWeight: '900' },
  subtitle: { color: '#7a7a7a', fontSize: 13, fontWeight: '700' },
  iconButton: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdebea' },
  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  summaryCard: { flex: 1, minHeight: 78, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#ececec', backgroundColor: '#fff5f5', justifyContent: 'center', gap: 4 },
  summaryValue: { color: '#1a1a1a', fontSize: 16, fontWeight: '900' },
  summaryLabel: { color: '#7a7a7a', fontSize: 12, fontWeight: '800' },
  list: { padding: 16, gap: 10, paddingBottom: 112 },
  earningRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ececec', backgroundColor: '#ffffff' },
  earningBody: { flex: 1, gap: 3 },
  earningTitle: { color: '#1a1a1a', fontSize: 15, fontWeight: '900' },
  earningSub: { color: '#7a7a7a', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  earningAmount: { color: '#1e8e3e', fontSize: 16, fontWeight: '900' },
  emptyCard: { alignItems: 'center', gap: 9, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#ececec' },
  emptyTitle: { color: '#1a1a1a', fontSize: 16, fontWeight: '900' },
  emptyBody: { color: '#7a7a7a', fontSize: 13, lineHeight: 19, textAlign: 'center', fontWeight: '700' },
  primaryButton: { minHeight: 44, borderRadius: 8, backgroundColor: '#da251d', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryButtonText: { color: '#ffffff', fontWeight: '900' },
  errorText: { color: '#da251d', fontWeight: '900', paddingHorizontal: 16, paddingTop: 8 },
});
