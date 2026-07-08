import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { MapPin, ShieldAlert, UserCircle } from 'lucide-react-native';
import type { LocalHelperProfile, SaveLocalHelperProfileInput } from '../types';

type Props = {
  existingProfile: LocalHelperProfile | null;
  initialName: string;
  initialEmail: string;
  defaultCity: string;
  errorMessage: string | null;
  onSaveProfile: (input: SaveLocalHelperProfileInput) => Promise<void> | void;
  onSetOnline: (input: { isOnline: boolean; currentLat: number | null; currentLng: number | null }) => Promise<void> | void;
};

const languageOptions = ['English', 'Vietnamese', 'Korean', 'Japanese', 'Chinese'];

export function LocalHelperOnboardingScreen({
  existingProfile,
  initialName,
  initialEmail,
  defaultCity,
  errorMessage,
  onSaveProfile,
  onSetOnline,
}: Props) {
  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(defaultCity);
  const [intro, setIntro] = useState('');
  const [payoutAccountLabel, setPayoutAccountLabel] = useState('');
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!existingProfile) return;
    setFullName(existingProfile.fullName);
    setEmail(existingProfile.email);
    setPhone(existingProfile.phone);
    setCity(existingProfile.city);
    setIntro(existingProfile.intro);
    setPayoutAccountLabel(existingProfile.payoutAccountLabel);
    setLanguages(existingProfile.languages);
  }, [existingProfile]);

  const toggleLanguage = (language: string) => {
    setLanguages((current) =>
      current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language],
    );
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setLocalError(null);
    try {
      await onSaveProfile({
        userId: existingProfile?.userId ?? 'current-user',
        fullName,
        email,
        phone,
        city,
        intro,
        languages,
        payoutAccountLabel,
      });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Could not save helper profile');
    } finally {
      setIsSaving(false);
    }
  };

  const setOnline = async (isOnline: boolean) => {
    setIsLocating(true);
    setLocalError(null);
    try {
      if (!isOnline) {
        await onSetOnline({ isOnline: false, currentLat: null, currentLng: null });
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocalError('Location permission is required to show nearby live preview jobs.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await onSetOnline({
        isOnline: true,
        currentLat: position.coords.latitude,
        currentLng: position.coords.longitude,
      });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Could not update helper location');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <UserCircle color="#ffffff" size={34} />
        <Text style={styles.title}>Become a Local Helper</Text>
        <Text style={styles.subtitle}>Earn from short, safe public-area live previews for travelers.</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Basic profile</Text>
        <TextInput value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor="#8a8a8a" style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#8a8a8a" style={styles.input} autoCapitalize="none" />
        <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor="#8a8a8a" style={styles.input} keyboardType="phone-pad" />
        <TextInput value={city} onChangeText={setCity} placeholder="Current city" placeholderTextColor="#8a8a8a" style={styles.input} />
        <TextInput
          value={intro}
          onChangeText={setIntro}
          placeholder="Short intro"
          placeholderTextColor="#8a8a8a"
          multiline
          style={styles.textArea}
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Languages</Text>
        <View style={styles.chipWrap}>
          {languageOptions.map((language) => (
            <Pressable
              key={language}
              style={[styles.chip, languages.includes(language) && styles.chipActive]}
              onPress={() => toggleLanguage(language)}
            >
              <Text style={[styles.chipText, languages.includes(language) && styles.chipTextActive]}>
                {language}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Payout account placeholder</Text>
        <TextInput
          value={payoutAccountLabel}
          onChangeText={setPayoutAccountLabel}
          placeholder="Bank, wallet, or Stripe Connect later"
          placeholderTextColor="#8a8a8a"
          style={styles.input}
        />
      </View>

      <View style={styles.onlinePanel}>
        <View style={styles.onlineCopy}>
          <View style={styles.inlineRow}>
            <MapPin color="#da251d" size={18} />
            <Text style={styles.sectionTitle}>Local Helper Mode</Text>
          </View>
          <Text style={styles.muted}>Turn on to request foreground location and receive nearby jobs.</Text>
        </View>
        <Switch value={Boolean(existingProfile?.isOnline)} onValueChange={setOnline} disabled={!existingProfile || isLocating} />
      </View>

      <View style={styles.notice}>
        <ShieldAlert color="#b45309" size={18} />
        <Text style={styles.noticeText}>Stay in public areas, keep communication in the app, and report unsafe requests.</Text>
      </View>

      {localError || errorMessage ? <Text style={styles.errorText}>{localError ?? errorMessage}</Text> : null}

      <Pressable style={[styles.primaryButton, isSaving && styles.disabled]} onPress={saveProfile} disabled={isSaving}>
        <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save helper profile'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 112 },
  hero: { padding: 18, borderRadius: 12, backgroundColor: '#1a1a1a', gap: 8 },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  subtitle: { color: '#f4d7d6', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  panel: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ececec', gap: 10, backgroundColor: '#ffffff' },
  sectionTitle: { color: '#1a1a1a', fontSize: 16, fontWeight: '900' },
  input: { minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: '#ececec', paddingHorizontal: 12, color: '#1a1a1a', fontWeight: '700' },
  textArea: { minHeight: 88, borderRadius: 8, borderWidth: 1, borderColor: '#ececec', padding: 12, color: '#1a1a1a', textAlignVertical: 'top', fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ececec' },
  chipActive: { backgroundColor: '#da251d', borderColor: '#da251d' },
  chipText: { color: '#7a7a7a', fontWeight: '800', fontSize: 13 },
  chipTextActive: { color: '#ffffff' },
  onlinePanel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ececec', backgroundColor: '#fff5f5' },
  onlineCopy: { flex: 1, gap: 4 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  muted: { color: '#7a7a7a', fontSize: 13, fontWeight: '700' },
  notice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 10, backgroundColor: '#fff7ed' },
  noticeText: { flex: 1, color: '#8a4b08', fontSize: 13, fontWeight: '800', lineHeight: 19 },
  primaryButton: { minHeight: 48, borderRadius: 8, backgroundColor: '#da251d', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  errorText: { color: '#da251d', fontWeight: '900' },
  disabled: { opacity: 0.55 },
});
