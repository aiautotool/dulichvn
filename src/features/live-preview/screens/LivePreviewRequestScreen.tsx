import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Camera, Clock, DollarSign, ShieldAlert, Video } from 'lucide-react-native';
import { formatUsdFromCents, LIVE_PREVIEW_PRICE_CENTS } from '../../../lib/money';

export type LivePreviewPlaceSummary = {
  id: string;
  name: string;
  city: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
};

type LivePreviewRequestScreenProps = {
  place: LivePreviewPlaceSummary;
  isSubmitting: boolean;
  errorMessage: string | null;
  onPayAndRequest: (input: { requestedLanguage: string; note: string }) => void;
  onBack: () => void;
};

const languages = ['English', 'Vietnamese', 'Korean', 'Japanese', 'Chinese'];

export function LivePreviewRequestScreen({
  place,
  isSubmitting,
  errorMessage,
  onPayAndRequest,
  onBack,
}: LivePreviewRequestScreenProps) {
  const [requestedLanguage, setRequestedLanguage] = useState('English');
  const [note, setNote] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Video color="#ffffff" size={28} />
        </View>
        <Text style={styles.eyebrow}>Live Local Preview</Text>
        <Text style={styles.title}>See the real place before you go</Text>
        <Text style={styles.subtitle}>
          Ask a local to show you around live at {place.name}. Payment is held safely until the session is complete.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>{place.name}</Text>
        <Text style={styles.muted}>{place.city} · {place.category}</Text>
        <Text style={styles.body}>{place.description}</Text>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <DollarSign color="#da251d" size={20} />
          <Text style={styles.metricValue}>{formatUsdFromCents(LIVE_PREVIEW_PRICE_CENTS)}</Text>
          <Text style={styles.metricLabel}>Escrow price</Text>
        </View>
        <View style={styles.metricCard}>
          <Clock color="#da251d" size={20} />
          <Text style={styles.metricValue}>3-5 min</Text>
          <Text style={styles.metricLabel}>Live duration</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.iconTitleRow}>
          <Camera color="#da251d" size={18} />
          <Text style={styles.sectionTitle}>What the helper will show</Text>
        </View>
        <Text style={styles.body}>Current crowd level, weather feel, entrances, nearby streets, and the real view from public areas.</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Requested language</Text>
        <View style={styles.chipWrap}>
          {languages.map((language) => (
            <Pressable
              key={language}
              style={[styles.chip, requestedLanguage === language && styles.chipActive]}
              onPress={() => setRequestedLanguage(language)}
            >
              <Text style={[styles.chipText, requestedLanguage === language && styles.chipTextActive]}>
                {language}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Optional note, for example: please show the main entrance."
          placeholderTextColor="#8a8a8a"
          multiline
          style={styles.noteInput}
        />
      </View>

      <View style={styles.notice}>
        <ShieldAlert color="#b45309" size={20} />
        <Text style={styles.noticeText}>
          Keep communication inside the app. Do not ask helpers to enter restricted or private areas, share personal contact details, or record without consent.
        </Text>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.buttonStack}>
        <Pressable
          style={[styles.primaryButton, isSubmitting && styles.disabled]}
          onPress={() => onPayAndRequest({ requestedLanguage, note })}
          disabled={isSubmitting}
        >
          <DollarSign color="#ffffff" size={18} />
          <Text style={styles.primaryButtonText}>{isSubmitting ? 'Requesting...' : 'Pay $1 and request live preview'}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Back to destination</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 112 },
  hero: { padding: 18, borderRadius: 12, backgroundColor: '#1a1a1a', gap: 8 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#da251d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { color: '#ffd23f', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '900', lineHeight: 30 },
  subtitle: { color: '#f4d7d6', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  panel: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ececec', gap: 8, backgroundColor: '#ffffff' },
  sectionTitle: { color: '#1a1a1a', fontSize: 16, fontWeight: '900' },
  muted: { color: '#7a7a7a', fontSize: 13, fontWeight: '700' },
  body: { color: '#1a1a1a', fontSize: 14, lineHeight: 21, fontWeight: '500' },
  metricRow: { flexDirection: 'row', gap: 10 },
  metricCard: {
    flex: 1,
    minHeight: 104,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ececec',
    backgroundColor: '#fff5f5',
    gap: 6,
  },
  metricValue: { color: '#1a1a1a', fontSize: 18, fontWeight: '900' },
  metricLabel: { color: '#7a7a7a', fontSize: 12, fontWeight: '800' },
  iconTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ececec' },
  chipActive: { backgroundColor: '#da251d', borderColor: '#da251d' },
  chipText: { color: '#7a7a7a', fontWeight: '800', fontSize: 13 },
  chipTextActive: { color: '#ffffff' },
  noteInput: {
    minHeight: 84,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ececec',
    padding: 12,
    color: '#1a1a1a',
    textAlignVertical: 'top',
  },
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
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  secondaryButton: { minHeight: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#da251d', fontWeight: '900' },
  disabled: { opacity: 0.55 },
});
