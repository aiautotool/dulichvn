import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Briefcase, Clock, MapPin, RefreshCw } from 'lucide-react-native';
import { formatUsdFromCents } from '../../../lib/money';
import type { LocalHelperJob, LocalHelperProfile } from '../types';

type Props = {
  profile: LocalHelperProfile | null;
  jobs: LocalHelperJob[];
  errorMessage: string | null;
  onRefresh: () => void;
  onOpenOnboarding: () => void;
  onOpenDetail: (job: LocalHelperJob) => void;
  onAccept: (job: LocalHelperJob) => void;
};

export function LocalHelperJobsScreen({
  profile,
  jobs,
  errorMessage,
  onRefresh,
  onOpenOnboarding,
  onOpenDetail,
  onAccept,
}: Props) {
  const [distanceFilter, setDistanceFilter] = useState<'3' | 'city' | 'all'>('3');

  const filteredJobs = useMemo(() => {
    if (distanceFilter === 'all') return jobs;
    if (distanceFilter === 'city') return jobs.filter((job) => job.isCityMatch);
    return jobs.filter((job) => job.distanceKm === null || job.distanceKm <= 3);
  }, [distanceFilter, jobs]);

  if (!profile) {
    return (
      <View style={styles.emptyWrap}>
        <Briefcase color="#da251d" size={32} />
        <Text style={styles.emptyTitle}>Set up your helper profile</Text>
        <Text style={styles.emptyBody}>Create a profile and turn on helper mode before accepting live preview jobs.</Text>
        <Pressable style={styles.primaryButton} onPress={onOpenOnboarding}>
          <Text style={styles.primaryButtonText}>Become a Local Helper</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>Nearby live preview jobs</Text>
          <Text style={styles.subtitle}>{profile.isOnline ? 'Online' : 'Offline'} · {profile.city}</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={onRefresh}>
          <RefreshCw color="#da251d" size={18} />
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {[
          { id: '3' as const, label: '3 km' },
          { id: 'city' as const, label: 'City' },
          { id: 'all' as const, label: 'All' },
        ].map((filter) => (
          <Pressable
            key={filter.id}
            style={[styles.filterChip, distanceFilter === filter.id && styles.filterChipActive]}
            onPress={() => setDistanceFilter(filter.id)}
          >
            <Text style={[styles.filterChipText, distanceFilter === filter.id && styles.filterChipTextActive]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Clock color="#da251d" size={24} />
            <Text style={styles.emptyCardTitle}>No paid jobs nearby</Text>
            <Text style={styles.emptyCardBody}>Only escrowed requests appear here. Try refreshing later.</Text>
          </View>
        ) : (
          filteredJobs.map((job) => (
            <Pressable key={job.request.id} style={styles.jobCard} onPress={() => onOpenDetail(job)}>
              <View style={styles.jobHeader}>
                <View style={styles.jobIcon}>
                  <MapPin color="#da251d" size={20} />
                </View>
                <View style={styles.jobTitleStack}>
                  <Text style={styles.jobTitle}>{job.request.placeName}</Text>
                  <Text style={styles.jobSubtitle}>{job.request.city} · {job.request.requestedLanguage}</Text>
                </View>
                <Text style={styles.reward}>{formatUsdFromCents(job.request.helperRewardCents)}</Text>
              </View>
              <Text style={styles.body}>
                {job.distanceKm === null ? 'City match' : `${job.distanceKm.toFixed(1)} km away`} · 3-5 min · expires {new Date(job.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Pressable style={styles.acceptButton} onPress={() => onAccept(job)}>
                <Text style={styles.acceptButtonText}>Accept job</Text>
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 },
  title: { color: '#1a1a1a', fontSize: 21, fontWeight: '900' },
  subtitle: { color: '#7a7a7a', fontSize: 13, fontWeight: '700' },
  iconButton: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdebea' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ececec' },
  filterChipActive: { backgroundColor: '#da251d', borderColor: '#da251d' },
  filterChipText: { color: '#7a7a7a', fontWeight: '800' },
  filterChipTextActive: { color: '#ffffff' },
  list: { padding: 16, gap: 12, paddingBottom: 112 },
  jobCard: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ececec', backgroundColor: '#ffffff', gap: 10 },
  jobHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  jobIcon: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdebea' },
  jobTitleStack: { flex: 1, gap: 2 },
  jobTitle: { color: '#1a1a1a', fontSize: 16, fontWeight: '900' },
  jobSubtitle: { color: '#7a7a7a', fontSize: 12, fontWeight: '800' },
  reward: { color: '#1e8e3e', fontSize: 16, fontWeight: '900' },
  body: { color: '#7a7a7a', fontSize: 13, lineHeight: 19, fontWeight: '700' },
  acceptButton: { minHeight: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#da251d' },
  acceptButtonText: { color: '#ffffff', fontWeight: '900' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  emptyTitle: { color: '#1a1a1a', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  emptyBody: { color: '#7a7a7a', fontSize: 14, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  emptyCard: { alignItems: 'center', gap: 8, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#ececec' },
  emptyCardTitle: { color: '#1a1a1a', fontSize: 16, fontWeight: '900' },
  emptyCardBody: { color: '#7a7a7a', fontSize: 13, lineHeight: 19, textAlign: 'center', fontWeight: '700' },
  primaryButton: { minHeight: 48, borderRadius: 8, backgroundColor: '#da251d', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryButtonText: { color: '#ffffff', fontWeight: '900' },
  errorText: { color: '#da251d', fontWeight: '900', paddingHorizontal: 16, paddingTop: 8 },
});
