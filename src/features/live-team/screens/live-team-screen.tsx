import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { Camera, Check, ChevronRight, Headphones, MapPin, Plus, QrCode, Radar, Radio, RefreshCw, UserPlus, Users, X } from 'lucide-react-native';
import { Camera as ExpoCamera } from 'expo-camera';
import { QrLoginScanner } from '../../account/components/QrLoginScanner';
import { qrLoginDataUrl } from '../../account/services/qrImage';
import { createLiveTeamCode, formatLiveTeamCode, liveTeamInviteLink, normalizeLiveTeamCode } from '../services/live-team-code';
import { transportationLabels, transportationModes, type TransportationMode } from '../types';
import { LiveTeamRoom } from './live-team-room';
import { LiveTeamRoutePlanner } from '../components/live-team-route-planner';
import type { LiveTeamRoute } from '../types';
import { getMemberSocialOverview, getNearbyLiveTeamMembers, inviteMemberToLiveTeam, respondToLiveTeamInvite, type MemberSocialOverview, type MemberSocialProfile } from '../../member-calls/services/member-social-api';

export function LiveTeamScreen({
  isSignedIn,
  memberName,
  memberId,
  initialCode,
  onInitialCodeHandled,
  onOpenAccount,
}: {
  isSignedIn: boolean;
  memberName: string;
  memberId: string;
  initialCode?: string | null;
  onInitialCodeHandled?: () => void;
  onOpenAccount: () => void;
}) {
  const [teamName, setTeamName] = useState('Chuyến đi của tôi');
  const [joinCode, setJoinCode] = useState('');
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [transportationMode, setTransportationMode] = useState<TransportationMode>('MOTORBIKE');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<MemberSocialOverview['incomingLiveTeamInvite']>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [route, setRoute] = useState<LiveTeamRoute | null>(null);
  const [plannedCode, setPlannedCode] = useState<string | null>(null);
  const [nearbyMembers, setNearbyMembers] = useState<MemberSocialProfile[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [nearbyCoordinates, setNearbyCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyAutoScanEnabled, setNearbyAutoScanEnabled] = useState(true);
  const [invitedMemberIds, setInvitedMemberIds] = useState<Set<string>>(new Set());
  const nearbyScanInFlightRef = useRef(false);

  useEffect(() => {
    const applyUrl = (url: string | null) => {
      if (!url) return;
      const code = normalizeLiveTeamCode(url);
      if (code.length === 10 && url.includes('live-team')) setJoinCode(code);
    };
    void Linking.getInitialURL().then(applyUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => applyUrl(url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!activeCode || Platform.OS !== 'web') return setQrImage(null);
    void qrLoginDataUrl(liveTeamInviteLink(activeCode)).then(setQrImage).catch(() => setQrImage(null));
  }, [activeCode]);

  useEffect(() => {
    const code = normalizeLiveTeamCode(initialCode ?? '');
    if (code.length !== 10) return;
    setJoinCode(code);
    if (!isSignedIn) return;
    setActiveCode(code);
    onInitialCodeHandled?.();
  }, [initialCode, isSignedIn, onInitialCodeHandled]);

  useEffect(() => {
    if (!isSignedIn || activeCode) return;
    let active = true;
    const refresh = () => void getMemberSocialOverview().then((overview) => { if (active) setIncomingInvite(overview.incomingLiveTeamInvite); }).catch(() => {});
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [activeCode, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || activeCode || !nearbyAutoScanEnabled) return;
    void scanNearbyMembers();
    const timer = setInterval(() => { void scanNearbyMembers({ automatic: true }); }, 10_000);
    return () => clearInterval(timer);
  }, [activeCode, isSignedIn, nearbyAutoScanEnabled]);

  const respondToInvite = async (accept: boolean) => {
    if (!incomingInvite || inviteBusy) return;
    const invite = incomingInvite;
    setInviteBusy(true);
    try {
      await respondToLiveTeamInvite(accept);
      setIncomingInvite(null);
      if (accept) {
        setTeamName(invite.teamName);
        setActiveCode(invite.roomCode);
      }
    } finally {
      setInviteBusy(false);
    }
  };

  if (activeCode) {
    return (
      <LiveTeamRoom
        code={activeCode}
        memberId={memberId}
        memberName={memberName}
        teamName={teamName.trim() || `Live Team ${formatLiveTeamCode(activeCode)}`}
        transportationMode={transportationMode}
        initialRoute={route}
        onLeave={() => setActiveCode(null)}
      />
    );
  }

  const join = (code: string) => {
    const normalized = normalizeLiveTeamCode(code);
    if (normalized.length !== 10) return setScannerError('Mã đội phải có 10 ký tự.');
    setScannerError(null);
    setActiveCode(normalized);
  };

  const openScanner = async () => {
    const permission = await ExpoCamera.requestCameraPermissionsAsync();
    if (!permission.granted) return setScannerError('Cần quyền camera để quét mã QR Live Team.');
    setScannerVisible(true);
  };

  async function scanNearbyMembers(options: { automatic?: boolean } = {}) {
    if (nearbyScanInFlightRef.current) return;
    nearbyScanInFlightRef.current = true;
    if (!options.automatic) {
      setNearbyLoading(true);
      setNearbyError(null);
    }
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('Cần quyền vị trí để quét thành viên xung quanh.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinates = { lat: position.coords.latitude, lng: position.coords.longitude };
      setNearbyCoordinates(coordinates);
      setNearbyMembers(await getNearbyLiveTeamMembers(coordinates));
      setNearbyAutoScanEnabled(true);
    } catch (reason) {
      if (!options.automatic) {
        setNearbyError(reason instanceof Error ? reason.message : 'Không thể quét thành viên xung quanh.');
      }
    } finally {
      if (!options.automatic) setNearbyLoading(false);
      nearbyScanInFlightRef.current = false;
    }
  }

  const inviteNearbyMember = async (member: MemberSocialProfile) => {
    const coordinates = nearbyCoordinates;
    if (!coordinates) return setNearbyError('Hãy quét lại vị trí trước khi gửi lời mời.');
    const code = plannedCode ?? createLiveTeamCode();
    setPlannedCode(code);
    setNearbyError(null);
    try {
      await inviteMemberToLiveTeam(member.id, code, teamName.trim() || `Live Team ${formatLiveTeamCode(code)}`, coordinates);
      setInvitedMemberIds((current) => new Set(current).add(member.id));
    } catch (reason) {
      setNearbyError(reason instanceof Error ? reason.message : 'Không thể gửi lời mời.');
    }
  };

  const startPlannedTeam = () => {
    const code = plannedCode ?? createLiveTeamCode();
    setPlannedCode(code);
    join(code);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Radio color="#ffffff" size={29} /></View>
        <Text style={styles.title}>Live Team</Text>
        <Text style={styles.body}>Gọi thoại nhóm tự nhiên và theo dõi GPS trực tiếp khi cả đội đang di chuyển.</Text>
        <View style={styles.benefits}>
          <View style={styles.benefit}><Headphones color="#da251d" size={18} /><Text style={styles.benefitText}>Không cần nhấn để nói</Text></View>
          <View style={styles.benefit}><MapPin color="#da251d" size={18} /><Text style={styles.benefitText}>GPS thời gian thực</Text></View>
          <View style={styles.benefit}><Users color="#da251d" size={18} /><Text style={styles.benefitText}>Nhiều phương tiện</Text></View>
        </View>
      </View>

      {!isSignedIn ? (
        <View style={styles.signInCard}><Text style={styles.cardTitle}>Cần đăng nhập</Text><Text style={styles.cardBody}>Chỉ thành viên đã xác thực mới có thể xem vị trí và tham gia kênh thoại.</Text><Pressable style={styles.primaryButton} onPress={onOpenAccount}><Text style={styles.primaryText}>Đăng nhập Google</Text><ChevronRight color="#ffffff" size={18} /></Pressable></View>
      ) : (
        <>
          {incomingInvite ? <View style={styles.inviteCard}><View style={styles.inviteIcon}><Radio color="#ffffff" size={22} /></View><View style={styles.inviteCopy}><Text style={styles.cardTitle}>{incomingInvite.inviter.name} mời bạn</Text><Text style={styles.cardBody}>Tham gia “{incomingInvite.teamName}” để gọi thoại và chia sẻ vị trí.</Text></View><Pressable disabled={inviteBusy} accessibilityLabel="Từ chối" style={styles.declineInvite} onPress={() => void respondToInvite(false)}><X color="#64748b" size={20} /></Pressable><Pressable disabled={inviteBusy} accessibilityLabel="Tham gia" style={styles.acceptInvite} onPress={() => void respondToInvite(true)}><Check color="#ffffff" size={20} /></Pressable></View> : null}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Phương tiện của bạn</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.transportRow}>
              {transportationModes.map((mode) => <Pressable key={mode} onPress={() => setTransportationMode(mode)} style={[styles.transportChip, transportationMode === mode && styles.transportChipActive]}><Text style={styles.transportIcon}>{transportationLabels[mode].icon}</Text><Text style={[styles.transportText, transportationMode === mode && styles.transportTextActive]}>{transportationLabels[mode].vi}</Text></Pressable>)}
            </ScrollView>
          </View>

          <LiveTeamRoutePlanner route={route} transportationMode={transportationMode} onRouteChange={setRoute} />

          <View style={styles.card}>
            <View style={styles.nearbyHeader}>
              <View style={styles.cardHeading}><View style={styles.smallIcon}><Radar color="#da251d" size={20} /></View><View><Text style={styles.cardTitle}>Quét người xung quanh</Text><Text style={styles.cardBody}>Mời thành viên online trong bán kính 50 km trước khi vào phòng.</Text></View></View>
              <Pressable accessibilityLabel="Quét thành viên xung quanh" disabled={nearbyLoading} style={styles.refreshNearby} onPress={() => void scanNearbyMembers()}>{nearbyLoading ? <ActivityIndicator color="#da251d" size="small" /> : <RefreshCw color="#da251d" size={17} />}</Pressable>
            </View>
            {plannedCode ? <Text style={styles.teamCodeHint}>Mã đội đã tạo: {formatLiveTeamCode(plannedCode)}</Text> : null}
            {nearbyAutoScanEnabled ? <Text style={styles.teamCodeHint}>Tự động quét lại mỗi 10 giây.</Text> : null}
            {nearbyError ? <Text selectable style={styles.error}>{nearbyError}</Text> : null}
            <ScrollView style={styles.nearbyList} contentContainerStyle={styles.nearbyListContent} nestedScrollEnabled>
              {nearbyLoading && nearbyMembers.length === 0 ? <Text style={styles.emptyNearby}>Đang quét người online quanh đây...</Text> : null}
              {!nearbyLoading && nearbyMembers.length === 0 ? <Text style={styles.emptyNearby}>Chưa tìm thấy người online trong bán kính 50 km.</Text> : nearbyMembers.map((member) => {
                const invited = invitedMemberIds.has(member.id);
                return <View key={member.id} style={styles.nearbyRow}><View style={styles.nearbyAvatar}><Text style={styles.nearbyInitial}>{member.name.trim().charAt(0).toUpperCase() || '?'}</Text><View style={styles.onlineDot} /></View><View style={styles.nearbyInfo}><Text style={styles.nearbyName}>{member.name}</Text><Text style={styles.nearbyMeta}>Online · {formatNearbyDistance(member.distanceKm)}</Text></View><Pressable disabled={invited} style={[styles.inviteNearbyButton, invited && styles.inviteNearbyButtonDone]} onPress={() => void inviteNearbyMember(member)}><UserPlus color={invited ? '#168755' : '#ffffff'} size={16} /><Text style={[styles.inviteNearbyText, invited && styles.inviteNearbyTextDone]}>{invited ? 'Đã mời' : 'Mời'}</Text></Pressable></View>;
              })}
            </ScrollView>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeading}><View style={styles.smallIcon}><Plus color="#da251d" size={20} /></View><View><Text style={styles.cardTitle}>Tạo Live Team</Text><Text style={styles.cardBody}>Mở một kênh thoại và bản đồ mới.</Text></View></View>
            <TextInput value={teamName} onChangeText={setTeamName} placeholder="Tên đội, ví dụ: Đà Lạt 2026" style={styles.input} />
            <Pressable disabled={!route} style={[styles.primaryButton, !route && styles.disabledButton]} onPress={startPlannedTeam}><Text style={styles.primaryText}>Tạo và bắt đầu</Text><ChevronRight color="#ffffff" size={18} /></Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeading}><View style={styles.smallIcon}><Users color="#da251d" size={20} /></View><View><Text style={styles.cardTitle}>Tham gia một đội</Text><Text style={styles.cardBody}>Nhập mã mời hoặc quét QR từ trưởng nhóm.</Text></View></View>
            <View style={styles.joinRow}><TextInput autoCapitalize="characters" value={formatLiveTeamCode(joinCode)} onChangeText={(value) => setJoinCode(normalizeLiveTeamCode(value))} placeholder="ABCDE-23456" style={[styles.input, styles.joinInput]} /><Pressable accessibilityLabel="Quét QR" style={styles.qrButton} onPress={() => void openScanner()}><Camera color="#da251d" size={22} /></Pressable></View>
            {scannerError ? <Text selectable style={styles.error}>{scannerError}</Text> : null}
            <Pressable style={[styles.primaryButton, joinCode.length !== 10 && styles.disabledButton]} disabled={joinCode.length !== 10} onPress={() => join(joinCode)}><Text style={styles.primaryText}>Tham gia Live Team</Text><ChevronRight color="#ffffff" size={18} /></Pressable>
          </View>
        </>
      )}
      {qrImage ? <View style={styles.qrPreview}><QrCode color="#da251d" size={20} /><Image source={{ uri: qrImage }} style={styles.qrImage} /></View> : null}
      <QrLoginScanner visible={scannerVisible} busy={false} title="Quét QR Live Team" body="Đưa mã QR mời vào trong khung." onClose={() => setScannerVisible(false)} onScanned={(data) => { setScannerVisible(false); const code = normalizeLiveTeamCode(data); setJoinCode(code); if (code.length === 10) join(code); }} />
    </ScrollView>
  );
}

function formatNearbyDistance(distanceKm?: number) {
  if (distanceKm === undefined) return 'ở gần';
  return distanceKm < 1 ? `${Math.max(10, Math.round(distanceKm * 1000))} m` : `${distanceKm.toFixed(1)} km`;
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 36, gap: 14, backgroundColor: '#f8fafc' }, hero: { alignItems: 'center', gap: 9, paddingVertical: 13 }, heroIcon: { width: 58, height: 58, borderRadius: 19, backgroundColor: '#da251d', alignItems: 'center', justifyContent: 'center' }, title: { color: '#111827', fontSize: 28, fontWeight: '900' }, body: { color: '#64748b', maxWidth: 530, fontSize: 14, lineHeight: 21, fontWeight: '600', textAlign: 'center' }, benefits: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }, benefit: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff1f0', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 }, benefitText: { color: '#7a271a', fontSize: 11, fontWeight: '800' },
  card: { backgroundColor: '#ffffff', borderRadius: 18, borderCurve: 'continuous', padding: 15, gap: 12, boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)' }, signInCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 18, gap: 11, alignItems: 'center' }, cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, smallIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#fff1f0', alignItems: 'center', justifyContent: 'center' }, cardTitle: { color: '#111827', fontSize: 17, fontWeight: '900' }, cardBody: { color: '#64748b', fontSize: 12, lineHeight: 18, fontWeight: '600' }, input: { minHeight: 50, borderWidth: 1, borderColor: '#d0d5dd', borderRadius: 12, paddingHorizontal: 13, color: '#111827', fontSize: 14, fontWeight: '700', backgroundColor: '#ffffff' },
  primaryButton: { minHeight: 51, borderRadius: 13, backgroundColor: '#da251d', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16 }, disabledButton: { opacity: 0.45 }, primaryText: { color: '#ffffff', fontSize: 14, fontWeight: '900' }, joinRow: { flexDirection: 'row', gap: 8 }, joinInput: { flex: 1, letterSpacing: 2 }, qrButton: { width: 52, borderRadius: 12, borderWidth: 1, borderColor: '#fda29b', backgroundColor: '#fff1f0', alignItems: 'center', justifyContent: 'center' }, error: { color: '#b42318', fontSize: 12, fontWeight: '700' },
  nearbyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, refreshNearby: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f0' }, teamCodeHint: { color: '#334155', fontSize: 12, fontWeight: '800' }, nearbyList: { maxHeight: 190 }, nearbyListContent: { gap: 6 }, nearbyRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4 }, nearbyAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f0' }, nearbyInitial: { color: '#b42318', fontSize: 15, fontWeight: '900' }, onlineDot: { position: 'absolute', width: 9, height: 9, borderRadius: 5, right: 0, bottom: 0, backgroundColor: '#16a34a', borderWidth: 2, borderColor: '#fff' }, nearbyInfo: { flex: 1 }, nearbyName: { color: '#111827', fontSize: 13, fontWeight: '900' }, nearbyMeta: { color: '#64748b', fontSize: 11, fontWeight: '700' }, inviteNearbyButton: { minWidth: 72, height: 36, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#da251d', paddingHorizontal: 9 }, inviteNearbyButtonDone: { backgroundColor: '#ecfdf3' }, inviteNearbyText: { color: '#ffffff', fontSize: 11, fontWeight: '900' }, inviteNearbyTextDone: { color: '#168755' }, emptyNearby: { color: '#64748b', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', padding: 12 },
  transportRow: { gap: 7 }, transportChip: { alignItems: 'center', gap: 3, minWidth: 68, borderRadius: 12, backgroundColor: '#f1f5f9', paddingHorizontal: 9, paddingVertical: 8 }, transportChipActive: { backgroundColor: '#fff1f0', borderWidth: 1, borderColor: '#fda29b' }, transportIcon: { fontSize: 22 }, transportText: { color: '#64748b', fontSize: 10, fontWeight: '800' }, transportTextActive: { color: '#b42318' }, qrPreview: { alignItems: 'center', gap: 8 }, qrImage: { width: 210, height: 210 },
  inviteCard: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ecfdf3', borderWidth: 1, borderColor: '#86efac', borderRadius: 18, padding: 12 }, inviteIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#168755', alignItems: 'center', justifyContent: 'center' }, inviteCopy: { flex: 1, gap: 2 }, declineInvite: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }, acceptInvite: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#168755' },
});
