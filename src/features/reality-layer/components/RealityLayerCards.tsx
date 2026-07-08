import { Camera, CheckCircle2, ChevronRight, Eye, MapPin, ShieldAlert, Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PlaceRealityStatus, RealityScore, TravelDecision } from '../types';

const ui = {
  primary: '#0f766e',
  primarySoft: '#ccfbf1',
  text: '#0f172a',
  muted: '#64748b',
  surface: '#ffffff',
  border: '#e2e8f0',
  warning: '#f59e0b',
  danger: '#dc2626',
};

function label(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function scoreColor(score: number): string {
  if (score >= 8) return ui.primary;
  if (score >= 6) return ui.warning;
  return ui.danger;
}

export function PlaceRealityCard({ status }: { status: PlaceRealityStatus }) {
  const updatedMinutes = Math.max(1, Math.round((Date.now() - status.createdAt) / 60000));
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBubble}><Eye color={ui.primary} size={18} /></View>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Reality Status</Text>
          <Text style={styles.cardSub}>Updated {updatedMinutes} min ago · local verified</Text>
        </View>
        <Text style={styles.goodBadge}>{status.closed ? 'CHECK FIRST' : 'LIVE'}</Text>
      </View>
      <View style={styles.metricGrid}>
        <Metric label="Crowd" value={label(status.crowdLevel)} />
        <Metric label="Weather" value={label(status.weatherCondition)} />
        <Metric label="Temp" value={status.temperature ? `${status.temperature}°C` : '—'} />
        <Metric label="Taxi risk" value={label(status.taxiRisk)} />
      </View>
    </View>
  );
}

export function RealityScoreCard({ score }: { score: RealityScore }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBubble}><Sparkles color={ui.primary} size={18} /></View>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Reality Score</Text>
          <Text style={styles.cardSub}>{score.sampleSize} recent local signals</Text>
        </View>
        <Text style={[styles.scoreValue, { color: scoreColor(score.overallScore) }]}>{score.overallScore}</Text>
      </View>
      <ScoreRow label="Photo reality" value={score.photoRealityScore} />
      <ScoreRow label="Crowd" value={score.crowdScore} />
      <ScoreRow label="Price fairness" value={score.priceFairnessScore} />
      <ScoreRow label="Tourist safety" value={score.touristSafetyScore} />
      <View style={styles.gapBox}>
        <Text style={styles.gapLabel}>Internet vs Reality gap</Text>
        <Text style={[styles.gapValue, { color: score.realityGap === 'high' ? ui.danger : score.realityGap === 'medium' ? ui.warning : ui.primary }]}>{label(score.realityGap)}</Text>
      </View>
    </View>
  );
}

export function TravelDecisionCard({ decision }: { decision: TravelDecision }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBubble}><CheckCircle2 color={ui.primary} size={18} /></View>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Should I go now?</Text>
          <Text style={styles.cardSub}>{Math.round(decision.confidence * 100)}% confidence</Text>
        </View>
      </View>
      <Text style={styles.decisionTitle}>{decision.title}</Text>
      {decision.reasons.slice(0, 3).map((reason) => <Text key={reason} style={styles.reason}>• {reason}</Text>)}
      {decision.recommendation ? <Text style={styles.recommendation}>{decision.recommendation}</Text> : null}
    </View>
  );
}

export function RealityActionButtons({ onLivePreview }: { onLivePreview: () => void }) {
  return (
    <View style={styles.actionWrap}>
      <Pressable style={styles.primaryAction} onPress={onLivePreview}>
        <Camera color="#fff" size={18} />
        <View style={styles.flex}>
          <Text style={styles.primaryActionTitle}>SHOW ME NOW — $1</Text>
          <Text style={styles.primaryActionSub}>Find a nearby local for a live preview.</Text>
        </View>
        <ChevronRight color="#fff" size={18} />
      </Pressable>
      <View style={styles.secondaryRow}>
        <Pressable style={styles.secondaryAction}>
          <Camera color={ui.primary} size={16} />
          <Text style={styles.secondaryText}>Photo $0.30</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction}>
          <MapPin color={ui.primary} size={16} />
          <Text style={styles.secondaryText}>Ask Local $0.20</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction}>
          <ShieldAlert color={ui.primary} size={16} />
          <Text style={styles.secondaryText}>Scam Radar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreTrack}><View style={[styles.scoreFill, { width: `${Math.max(6, value * 10)}%`, backgroundColor: scoreColor(value) }]} /></View>
      <Text style={styles.scoreSmall}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: ui.surface, borderRadius: 18, borderWidth: 1, borderColor: ui.border, padding: 14, marginTop: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconBubble: { width: 34, height: 34, borderRadius: 17, backgroundColor: ui.primarySoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  cardTitle: { color: ui.text, fontSize: 16, fontWeight: '800' },
  cardSub: { color: ui.muted, fontSize: 12, marginTop: 2 },
  goodBadge: { color: ui.primary, backgroundColor: ui.primarySoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 11, fontWeight: '800' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { width: '48%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 10 },
  metricLabel: { color: ui.muted, fontSize: 11 },
  metricValue: { color: ui.text, fontSize: 13, fontWeight: '800', marginTop: 3 },
  scoreValue: { fontSize: 28, fontWeight: '900' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  scoreLabel: { color: ui.text, fontSize: 12, width: 96 },
  scoreTrack: { flex: 1, height: 8, borderRadius: 8, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  scoreFill: { height: 8, borderRadius: 8 },
  scoreSmall: { color: ui.muted, fontSize: 12, width: 26, textAlign: 'right' },
  gapBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, marginTop: 12 },
  gapLabel: { color: ui.muted, fontSize: 12 },
  gapValue: { fontSize: 12, fontWeight: '900' },
  decisionTitle: { color: ui.text, fontWeight: '900', fontSize: 15, marginBottom: 8 },
  reason: { color: ui.muted, fontSize: 13, lineHeight: 20 },
  recommendation: { color: ui.primary, fontSize: 13, fontWeight: '800', marginTop: 8 },
  actionWrap: { marginTop: 14, gap: 10 },
  primaryAction: { backgroundColor: ui.primary, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryActionTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  primaryActionSub: { color: '#d1fae5', fontSize: 12, marginTop: 2 },
  secondaryRow: { flexDirection: 'row', gap: 8 },
  secondaryAction: { flex: 1, borderWidth: 1, borderColor: ui.border, borderRadius: 14, padding: 10, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: ui.surface },
  secondaryText: { color: ui.text, fontSize: 11, fontWeight: '800', textAlign: 'center' },
});
