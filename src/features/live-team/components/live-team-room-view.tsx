import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Clock3, LocateFixed, Mic, MicOff, Navigation, PhoneOff, Radar, RefreshCw, Share2, Square, UserPlus, Users, Volume2, VolumeX, WifiOff } from 'lucide-react-native';
import type { MemberSocialProfile } from '../../member-calls/services/member-social-api';
import { normalizeTranslationLanguage, useAppSelectedLanguage, type TranslationLanguageCode } from '../../../lib/translation/language';
import { distanceMeters } from '../services/live-team-location';
import { calculateLiveTeamRoute } from '../services/live-team-route-api';
import { formatLiveTeamCode } from '../services/live-team-code';
import { transportationLabels, type LiveTeamMember, type LiveTeamNavigationState, type LiveTeamRoute } from '../types';
import { LiveTeamMap } from './live-team-map';

export function LiveTeamRoomView({
  code,
  connectionLabel,
  error,
  isConnecting,
  isMuted,
  locationSharing,
  members,
  navigation,
  route,
  nearbyMembers,
  nearbyLoading,
  invitedMemberIds,
  onLeave,
  onShare,
  onToggleLocation,
  onToggleMicrophone,
  onToggleSpeaker,
  onRefreshNearby,
  onInviteNearby,
  onStartNavigation,
  onStopNavigation,
  speakerEnabled,
  teamName,
  userId,
}: {
  code: string;
  connectionLabel: string;
  error: string | null;
  isConnecting: boolean;
  isMuted: boolean;
  locationSharing: boolean;
  members: LiveTeamMember[];
  navigation: LiveTeamNavigationState | null;
  route: LiveTeamRoute | null;
  nearbyMembers: MemberSocialProfile[];
  nearbyLoading: boolean;
  invitedMemberIds: ReadonlySet<string>;
  onLeave: () => void;
  onShare: () => void;
  onToggleLocation: (enabled: boolean) => void;
  onToggleMicrophone: () => void;
  onToggleSpeaker: () => void;
  onRefreshNearby: () => void;
  onInviteNearby: (member: MemberSocialProfile) => void;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
  speakerEnabled: boolean;
  teamName: string;
  userId: string;
}) {
  const [nearbyExpanded, setNearbyExpanded] = useState(false);
  const copy = navigationCopies[normalizeTranslationLanguage(useAppSelectedLanguage())];
  const onlineCount = members.filter((member) => member.isOnline).length;
  const self = members.find((member) => member.userId === userId) ?? null;
  const locatedMembers = members.filter((member) => member.locationSharing && member.location);
  const plannedPlaces = route ? routePlaces(route) : [];
  const navigationTargetIndex = plannedPlaces.length ? Math.min(Math.max(1, navigation?.targetIndex ?? 1), plannedPlaces.length - 1) : 0;
  const navigationTarget = plannedPlaces[navigationTargetIndex] ?? route?.destination ?? null;
  const fallbackNavigationLeg = useMemo(
    () => route && navigationTarget ? buildNavigationLeg(route, self?.location ?? null, navigationTargetIndex, copy.currentPosition) : null,
    [copy.currentPosition, navigationTarget, navigationTargetIndex, route, self?.location],
  );
  const navigationLeg = useLiveNavigationLeg(navigation?.active === true, fallbackNavigationLeg, self, navigationTarget, copy.currentPosition);

  if (navigation?.active && route) {
    return (
      <View style={styles.navigationRoot}>
        <View style={styles.navigationHeader}>
          <View style={styles.navigationBadge}><Navigation color="#ffffff" fill="#ffffff" size={18} /><Text style={styles.navigationBadgeText}>{copy.navigating}</Text></View>
          <View style={styles.navigationHeading}>
            <Text style={styles.navigationDestination} numberOfLines={1}>{copy.nextStop}: {navigationTarget?.label}</Text>
            <Text style={styles.navigationStartedBy} numberOfLines={1}>{copy.startedBy.replace('{name}', navigation.startedByName)}</Text>
          </View>
          <View style={styles.onlineBadge}><View style={styles.onlineBadgeDot} /><Text style={styles.onlineBadgeText}>{onlineCount}</Text></View>
        </View>

        <View style={styles.navigationMap}>
          <LiveTeamMap members={locatedMembers} userId={userId} route={navigationLeg} followUserId={userId} />
          <View style={styles.navigationStats}>
            <View style={styles.navigationStat}><Navigation color="#da251d" size={18} /><View><Text style={styles.navigationStatValue}>{formatRouteDistance(navigationLeg?.distanceMeters ?? route.distanceMeters)}</Text><Text style={styles.navigationStatLabel}>{copy.distance}</Text></View></View>
            <View style={styles.navigationStatDivider} />
            <View style={styles.navigationStat}><Clock3 color="#da251d" size={18} /><View><Text style={styles.navigationStatValue}>{formatRouteDuration(navigationLeg?.durationSeconds ?? route.durationSeconds)}</Text><Text style={styles.navigationStatLabel}>{copy.estimatedTime}</Text></View></View>
          </View>
        </View>

        {error ? <View style={styles.warning}><WifiOff color="#b42318" size={17} /><Text selectable style={styles.warningText}>{error}</Text></View> : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navigationRouteCard} contentContainerStyle={styles.navigationRouteContent}>
          {routePlaces(route).map((place, index, places) => <View key={`${place.latitude}-${place.longitude}-${index}`} style={styles.routePointItem}>
            <View style={[styles.routePointDot, index === navigationTargetIndex && styles.routePointDotDestination]}><Text style={styles.routePointDotText}>{String.fromCharCode(65 + index)}</Text></View>
            <Text style={styles.routePointText} numberOfLines={1}>{place.label}</Text>
            {index < places.length - 1 ? <Navigation color="#94a3b8" size={15} /> : null}
          </View>)}
        </ScrollView>

        <View style={styles.navigationControls}>
          <Pressable accessibilityLabel={isMuted ? copy.microphoneOn : copy.microphoneOff} style={[styles.navigationControlButton, isMuted && styles.navigationControlButtonMuted]} onPress={onToggleMicrophone}>{isMuted ? <MicOff color="#da251d" size={23} /> : <Mic color="#ffffff" size={23} />}</Pressable>
          <Pressable accessibilityLabel={speakerEnabled ? copy.speakerOff : copy.speakerOn} style={styles.navigationSecondaryButton} onPress={onToggleSpeaker}>{speakerEnabled ? <Volume2 color="#1f2937" size={23} /> : <VolumeX color="#da251d" size={23} />}</Pressable>
          <Pressable style={styles.stopNavigationButton} onPress={onStopNavigation}><Square color="#ffffff" fill="#ffffff" size={17} /><Text style={styles.stopNavigationText}>{copy.stop}</Text></Pressable>
          <Pressable accessibilityLabel={copy.leave} style={styles.navigationLeaveButton} onPress={onLeave}><PhoneOff color="#ffffff" size={22} /></Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.title} numberOfLines={1}>{teamName}</Text>
          <Text style={styles.subtitle}>{connectionLabel} · {onlineCount} đang online</Text>
        </View>
        <Pressable accessibilityLabel="Chia sẻ mã đội" style={styles.codeButton} onPress={onShare}>
          <Share2 color="#da251d" size={16} />
          <Text style={styles.codeText}>{formatLiveTeamCode(code)}</Text>
        </Pressable>
      </View>

      <View style={styles.mapCard}>
        <View style={styles.mapTop}>
          <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE MAP</Text></View>
          <View style={styles.locationControl}><LocateFixed color={locationSharing ? '#16794b' : '#6b7280'} size={15} /><Text style={styles.locationText}>Chia sẻ GPS</Text><Switch value={locationSharing} onValueChange={onToggleLocation} /></View>
        </View>
        <View style={styles.mapCanvas}>
          {locatedMembers.length || route ? <LiveTeamMap members={locatedMembers} userId={userId} route={route} /> : (
            <View style={styles.noLocation}><LocateFixed color="#64748b" size={35} /><Text style={styles.noLocationTitle}>Chưa có vị trí trực tiếp</Text><Text style={styles.noLocationBody}>Bật chia sẻ GPS để hiển thị các thành viên trên bản đồ.</Text></View>
          )}
        </View>
        {route ? <Pressable style={styles.startNavigationButton} onPress={onStartNavigation}><Navigation color="#ffffff" fill="#ffffff" size={20} /><Text style={styles.startNavigationText}>{copy.start}</Text></Pressable> : null}
      </View>

      {error ? <View style={styles.warning}><WifiOff color="#b42318" size={17} /><Text selectable style={styles.warningText}>{error}</Text></View> : null}

      {nearbyExpanded ? (
        <View style={styles.nearbySection}>
          <View style={styles.nearbyHeader}><View style={styles.sectionTitleRow}><Radar color="#da251d" size={18} /><Text style={styles.sectionTitle}>ĐANG ONLINE XUNG QUANH</Text></View><Pressable accessibilityLabel="Quét lại" style={styles.refreshNearby} onPress={onRefreshNearby}>{nearbyLoading ? <ActivityIndicator color="#da251d" size="small" /> : <RefreshCw color="#da251d" size={17} />}</Pressable></View>
          <ScrollView style={styles.nearbyList} contentContainerStyle={styles.memberListContent} nestedScrollEnabled>
            {!nearbyLoading && nearbyMembers.length === 0 ? <Text style={styles.emptyNearby}>Chưa tìm thấy thành viên online trong bán kính 50 km.</Text> : nearbyMembers.map((member) => {
              const invited = invitedMemberIds.has(member.id);
              return <View key={member.id} style={styles.nearbyRow}><View style={styles.nearbyAvatar}><Text style={styles.nearbyInitial}>{member.name.trim().charAt(0).toUpperCase() || '?'}</Text><View style={styles.onlineDot} /></View><View style={styles.memberInfo}><Text style={styles.memberName}>{member.name}</Text><Text style={styles.memberState}>Online · {formatNearbyDistance(member.distanceKm)}</Text></View><Pressable disabled={invited} style={[styles.inviteButton, invited && styles.inviteButtonDone]} onPress={() => onInviteNearby(member)}><UserPlus color={invited ? '#168755' : '#ffffff'} size={16} /><Text style={[styles.inviteText, invited && styles.inviteTextDone]}>{invited ? 'Đã mời' : 'Mời'}</Text></Pressable></View>;
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.membersSection}>
        <View style={styles.membersHeader}><View style={styles.sectionTitleRow}><Users color="#1f2937" size={18} /><Text style={styles.sectionTitle}>KÊNH THOẠI · {members.length} THÀNH VIÊN</Text></View><Pressable style={styles.addMemberButton} onPress={() => { const next = !nearbyExpanded; setNearbyExpanded(next); if (next) onRefreshNearby(); }}><UserPlus color="#da251d" size={16} /><Text style={styles.addMemberText}>{nearbyExpanded ? 'Đóng' : 'Thêm'}</Text></Pressable></View>
        <ScrollView style={styles.memberList} contentContainerStyle={styles.memberListContent} nestedScrollEnabled>
          {isConnecting && !members.length ? <ActivityIndicator color="#da251d" /> : members.map((member) => {
            const distance = self?.location && member.location && self.userId !== member.userId
              ? formatDistance(distanceMeters(self.location, member.location))
              : null;
            return (
              <View key={member.userId} style={[styles.memberRow, member.isSpeaking && styles.memberRowSpeaking]}>
                <View style={styles.memberAvatar}><Text style={styles.memberAvatarText}>{transportationLabels[member.transportationMode].icon}</Text><View style={[styles.onlineDot, !member.isOnline && styles.offlineDot]} /></View>
                <View style={styles.memberInfo}><Text style={styles.memberName}>{member.userId === userId ? `${member.name} (Bạn)` : member.name}</Text><Text style={[styles.memberState, member.isSpeaking && styles.speakingText]}>{voiceLabel(member)}{distance ? ` · ${distance}` : ''}</Text></View>
                {member.isMuted ? <MicOff color="#6b7280" size={18} /> : <Mic color={member.isSpeaking ? '#168755' : '#9ca3af'} size={18} />}
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.controls}>
        <Pressable accessibilityLabel={isMuted ? 'Bật micro' : 'Tắt micro'} style={[styles.micButton, isMuted && styles.micButtonMuted]} onPress={onToggleMicrophone}>
          {isMuted ? <MicOff color="#da251d" size={25} /> : <Mic color="#ffffff" size={25} />}
          <Text style={[styles.controlText, isMuted && styles.controlTextMuted]}>{isMuted ? 'BẬT MIC' : 'TẠM TẮT'}</Text>
        </Pressable>
        <Pressable accessibilityLabel={speakerEnabled ? 'Tắt loa' : 'Bật loa'} style={styles.speakerButton} onPress={onToggleSpeaker}>
          {speakerEnabled ? <Volume2 color="#1f2937" size={24} /> : <VolumeX color="#da251d" size={24} />}
        </Pressable>
        <Pressable accessibilityLabel="Rời Live Team" style={styles.leaveButton} onPress={onLeave}><PhoneOff color="#ffffff" size={25} /><Text style={styles.leaveText}>RỜI ĐỘI</Text></Pressable>
      </View>
    </View>
  );
}

function movementLabel(member: LiveTeamMember) {
  const speed = member.location?.speed ?? 0;
  return speed > 0.8 ? `Đang di chuyển · ${Math.round(speed * 3.6)} km/h` : 'Đang dừng';
}

function voiceLabel(member: LiveTeamMember) {
  if (!member.isOnline) return 'Mất kết nối';
  if (member.isSpeaking) return '🎙 Đang nói';
  if (member.isMuted) return 'Micro đã tắt';
  return 'Đang nghe';
}

function formatDistance(meters: number) {
  return meters < 1000 ? `cách ${Math.round(meters)} m` : `cách ${(meters / 1000).toFixed(1)} km`;
}

function formatNearbyDistance(distanceKm?: number) {
  if (distanceKm === undefined) return 'ở gần';
  return distanceKm < 1 ? `${Math.max(10, Math.round(distanceKm * 1000))} m` : `${distanceKm.toFixed(1)} km`;
}

function formatRouteDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

function formatRouteDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

function routePlaces(route: LiveTeamRoute) {
  return [route.origin, ...(route.stops ?? []), route.destination];
}

function useLiveNavigationLeg(
  active: boolean,
  fallbackRoute: LiveTeamRoute | null,
  member: LiveTeamMember | null,
  target: LiveTeamRoute['destination'] | null,
  currentPositionLabel: string,
) {
  const [roadRoute, setRoadRoute] = useState<{ targetKey: string; route: LiveTeamRoute } | null>(null);
  const lastRequestRef = useRef<{ targetKey: string; location: { latitude: number; longitude: number }; requestedAt: number } | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const location = member?.location ?? null;
  const targetKey = target ? `${target.latitude.toFixed(6)},${target.longitude.toFixed(6)}` : '';

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!active || !location || !target || !member) {
      requestRef.current?.abort();
      requestRef.current = null;
      lastRequestRef.current = null;
      setRoadRoute(null);
      return;
    }

    const previous = lastRequestRef.current;
    if (previous?.targetKey === targetKey && Date.now() - previous.requestedAt < 30_000) return;

    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;
    lastRequestRef.current = {
      targetKey,
      location: { latitude: location.latitude, longitude: location.longitude },
      requestedAt: Date.now(),
    };
    void calculateLiveTeamRoute([
      { label: currentPositionLabel, latitude: location.latitude, longitude: location.longitude },
      target,
    ], member.transportationMode, controller.signal).then((nextRoute) => {
      if (!controller.signal.aborted) setRoadRoute({ targetKey, route: nextRoute });
    }).catch(() => undefined);
  }, [active, currentPositionLabel, location, member, target, targetKey]);

  if (!location || roadRoute?.targetKey !== targetKey) return fallbackRoute;
  return buildNavigationLeg(roadRoute.route, location, 1, currentPositionLabel);
}

function buildNavigationLeg(route: LiveTeamRoute, currentLocation: LiveTeamMember['location'], targetIndex: number, currentPositionLabel: string): LiveTeamRoute {
  const places = routePlaces(route);
  const safeTargetIndex = Math.min(Math.max(1, targetIndex), places.length - 1);
  const target = places[safeTargetIndex];
  const fallbackStart = places[safeTargetIndex - 1] ?? route.origin;
  const start = currentLocation ?? fallbackStart;
  const startPathIndex = nearestPathIndex(route.path, start);
  const targetPathIndex = nearestPathIndex(route.path, target);
  const pathSection = startPathIndex <= targetPathIndex ? route.path.slice(startPathIndex, targetPathIndex + 1) : [];
  const path = [
    { latitude: start.latitude, longitude: start.longitude },
    ...pathSection,
    { latitude: target.latitude, longitude: target.longitude },
  ].filter((point, index, points) => index === 0 || distanceMeters(points[index - 1], point) > 1);
  const remainingDistance = path.slice(1).reduce((total, point, index) => total + distanceMeters(path[index], point), 0);

  return {
    origin: { label: currentLocation ? currentPositionLabel : fallbackStart.label, latitude: start.latitude, longitude: start.longitude },
    destination: target,
    stops: [],
    path,
    distanceMeters: remainingDistance,
    durationSeconds: route.distanceMeters > 0 ? route.durationSeconds * remainingDistance / route.distanceMeters : 0,
  };
}

function nearestPathIndex(path: LiveTeamRoute['path'], point: { latitude: number; longitude: number }) {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  path.forEach((candidate, index) => {
    const distance = distanceMeters(candidate, point);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  return nearestIndex;
}

const navigationCopies: Record<TranslationLanguageCode, { start: string; stop: string; navigating: string; startedBy: string; nextStop: string; currentPosition: string; distance: string; estimatedTime: string; microphoneOn: string; microphoneOff: string; speakerOn: string; speakerOff: string; leave: string }> = {
  en: { start: 'START NAVIGATION', stop: 'STOP', navigating: 'NAVIGATING', startedBy: 'Started by {name}', nextStop: 'Next', currentPosition: 'Current position', distance: 'Distance', estimatedTime: 'Estimated time', microphoneOn: 'Turn microphone on', microphoneOff: 'Turn microphone off', speakerOn: 'Turn speaker on', speakerOff: 'Turn speaker off', leave: 'Leave team' },
  vi: { start: 'BẮT ĐẦU CHỈ ĐƯỜNG', stop: 'DỪNG', navigating: 'ĐANG DẪN ĐƯỜNG', startedBy: 'Bắt đầu bởi {name}', nextStop: 'Điểm kế tiếp', currentPosition: 'Vị trí hiện tại', distance: 'Quãng đường', estimatedTime: 'Thời gian dự kiến', microphoneOn: 'Bật micro', microphoneOff: 'Tắt micro', speakerOn: 'Bật loa', speakerOff: 'Tắt loa', leave: 'Rời đội' },
  ja: { start: 'ナビを開始', stop: '停止', navigating: 'ナビゲーション中', startedBy: '{name} が開始', nextStop: '次の目的地', currentPosition: '現在地', distance: '距離', estimatedTime: '予定時間', microphoneOn: 'マイクをオン', microphoneOff: 'マイクをオフ', speakerOn: 'スピーカーをオン', speakerOff: 'スピーカーをオフ', leave: 'チームを退出' },
  ko: { start: '길 안내 시작', stop: '중지', navigating: '길 안내 중', startedBy: '{name}님이 시작함', nextStop: '다음 목적지', currentPosition: '현재 위치', distance: '거리', estimatedTime: '예상 시간', microphoneOn: '마이크 켜기', microphoneOff: '마이크 끄기', speakerOn: '스피커 켜기', speakerOff: '스피커 끄기', leave: '팀 나가기' },
  'zh-CN': { start: '开始导航', stop: '停止', navigating: '正在导航', startedBy: '由 {name} 发起', nextStop: '下一站', currentPosition: '当前位置', distance: '距离', estimatedTime: '预计时间', microphoneOn: '打开麦克风', microphoneOff: '关闭麦克风', speakerOn: '打开扬声器', speakerOff: '关闭扬声器', leave: '离开团队' },
  'zh-TW': { start: '開始導航', stop: '停止', navigating: '正在導航', startedBy: '由 {name} 發起', nextStop: '下一站', currentPosition: '目前位置', distance: '距離', estimatedTime: '預計時間', microphoneOn: '開啟麥克風', microphoneOff: '關閉麥克風', speakerOn: '開啟揚聲器', speakerOff: '關閉揚聲器', leave: '離開團隊' },
  th: { start: 'เริ่มนำทาง', stop: 'หยุด', navigating: 'กำลังนำทาง', startedBy: 'เริ่มโดย {name}', nextStop: 'จุดหมายถัดไป', currentPosition: 'ตำแหน่งปัจจุบัน', distance: 'ระยะทาง', estimatedTime: 'เวลาโดยประมาณ', microphoneOn: 'เปิดไมโครโฟน', microphoneOff: 'ปิดไมโครโฟน', speakerOn: 'เปิดลำโพง', speakerOff: 'ปิดลำโพง', leave: 'ออกจากทีม' },
  fr: { start: 'DÉMARRER LE GUIDAGE', stop: 'ARRÊTER', navigating: 'GUIDAGE EN COURS', startedBy: 'Démarré par {name}', nextStop: 'Prochaine étape', currentPosition: 'Position actuelle', distance: 'Distance', estimatedTime: 'Durée estimée', microphoneOn: 'Activer le micro', microphoneOff: 'Couper le micro', speakerOn: 'Activer le haut-parleur', speakerOff: 'Couper le haut-parleur', leave: "Quitter l'équipe" },
  de: { start: 'NAVIGATION STARTEN', stop: 'STOPP', navigating: 'NAVIGATION LÄUFT', startedBy: 'Gestartet von {name}', nextStop: 'Nächstes Ziel', currentPosition: 'Aktueller Standort', distance: 'Entfernung', estimatedTime: 'Geschätzte Zeit', microphoneOn: 'Mikrofon einschalten', microphoneOff: 'Mikrofon ausschalten', speakerOn: 'Lautsprecher einschalten', speakerOff: 'Lautsprecher ausschalten', leave: 'Team verlassen' },
  es: { start: 'INICIAR NAVEGACIÓN', stop: 'DETENER', navigating: 'NAVEGANDO', startedBy: 'Iniciado por {name}', nextStop: 'Siguiente destino', currentPosition: 'Ubicación actual', distance: 'Distancia', estimatedTime: 'Tiempo estimado', microphoneOn: 'Activar micrófono', microphoneOff: 'Desactivar micrófono', speakerOn: 'Activar altavoz', speakerOff: 'Desactivar altavoz', leave: 'Salir del equipo' },
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc', padding: 12, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 }, heading: { flex: 1 }, title: { color: '#111827', fontSize: 20, fontWeight: '900' }, subtitle: { color: '#168755', fontSize: 12, fontWeight: '800' },
  codeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff1f0', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 10 }, codeText: { color: '#da251d', fontSize: 12, fontWeight: '900' },
  mapCard: { flex: 1.25, minHeight: 300, overflow: 'hidden', backgroundColor: '#e7efe8', borderRadius: 18, borderCurve: 'continuous' }, mapTop: { zIndex: 5, position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffffee', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99 }, liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#da251d' }, liveText: { color: '#1f2937', fontWeight: '900', fontSize: 11 },
  locationControl: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ffffffee', paddingLeft: 9, paddingRight: 3, paddingVertical: 2, borderRadius: 99 }, locationText: { color: '#334155', fontSize: 10, fontWeight: '800' }, mapCanvas: { flex: 1, overflow: 'hidden' },
  noLocation: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25, gap: 7 }, noLocationTitle: { color: '#334155', fontSize: 16, fontWeight: '900' }, noLocationBody: { color: '#64748b', fontSize: 12, fontWeight: '600', textAlign: 'center', maxWidth: 280 },
  startNavigationButton: { zIndex: 6, position: 'absolute', left: 14, right: 14, bottom: 14, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#da251d', boxShadow: '0 4px 14px rgba(218, 37, 29, 0.35)' }, startNavigationText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  warning: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fee4e2', borderRadius: 10, padding: 9 }, warningText: { flex: 1, color: '#b42318', fontSize: 11, fontWeight: '800' },
  nearbySection: { maxHeight: 190, backgroundColor: '#ffffff', borderRadius: 16, padding: 11, gap: 8, borderWidth: 1, borderColor: '#fecaca' }, nearbyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, refreshNearby: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f0' }, nearbyList: { maxHeight: 135 }, nearbyRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4 }, nearbyAvatar: { width: 37, height: 37, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f0' }, nearbyInitial: { color: '#b42318', fontSize: 15, fontWeight: '900' }, inviteButton: { minWidth: 72, height: 36, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#da251d', paddingHorizontal: 9 }, inviteButtonDone: { backgroundColor: '#ecfdf3' }, inviteText: { color: '#ffffff', fontSize: 11, fontWeight: '900' }, inviteTextDone: { color: '#168755' }, emptyNearby: { color: '#64748b', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', padding: 14 },
  membersSection: { flex: 0.72, minHeight: 155, backgroundColor: '#ffffff', borderRadius: 16, padding: 11, gap: 8 }, sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, sectionTitle: { color: '#1f2937', fontSize: 12, fontWeight: '900' }, memberList: { flex: 1 }, memberListContent: { gap: 5 },
  membersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, addMemberButton: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff1f0', borderRadius: 10, paddingHorizontal: 10 }, addMemberText: { color: '#b42318', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 11, paddingHorizontal: 8, paddingVertical: 6 }, memberRowSpeaking: { backgroundColor: '#ecfdf3' }, memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }, memberAvatarText: { fontSize: 18 }, onlineDot: { position: 'absolute', width: 9, height: 9, borderRadius: 5, right: 0, bottom: 0, backgroundColor: '#16a34a', borderWidth: 2, borderColor: '#fff' }, offlineDot: { backgroundColor: '#ef4444' }, memberInfo: { flex: 1 }, memberName: { color: '#111827', fontSize: 13, fontWeight: '900' }, memberState: { color: '#64748b', fontSize: 10, fontWeight: '700' }, speakingText: { color: '#168755' },
  controls: { flexDirection: 'row', gap: 10 }, micButton: { flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, backgroundColor: '#168755' }, micButtonMuted: { backgroundColor: '#fff1f0', borderWidth: 1, borderColor: '#fda29b' }, controlText: { color: '#ffffff', fontSize: 12, fontWeight: '900' }, controlTextMuted: { color: '#da251d' }, speakerButton: { width: 58, minHeight: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' }, leaveButton: { minHeight: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, backgroundColor: '#da251d' }, leaveText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  navigationRoot: { flex: 1, backgroundColor: '#f8fafc', padding: 12, gap: 10 }, navigationHeader: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10 }, navigationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#da251d', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9 }, navigationBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '900' }, navigationHeading: { flex: 1, gap: 2 }, navigationDestination: { color: '#111827', fontSize: 16, fontWeight: '900' }, navigationStartedBy: { color: '#64748b', fontSize: 11, fontWeight: '700' }, onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, backgroundColor: '#ecfdf3', paddingHorizontal: 9, paddingVertical: 7 }, onlineBadgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a34a' }, onlineBadgeText: { color: '#16794b', fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] }, navigationMap: { flex: 1, minHeight: 390, overflow: 'hidden', borderRadius: 20, borderCurve: 'continuous', backgroundColor: '#e7efe8' }, navigationStats: { position: 'absolute', left: 12, right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderRadius: 15, backgroundColor: '#fffffff2', paddingHorizontal: 14, paddingVertical: 10, boxShadow: '0 3px 12px rgba(15, 23, 42, 0.16)' }, navigationStat: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, navigationStatDivider: { width: 1, height: 34, backgroundColor: '#e2e8f0' }, navigationStatValue: { color: '#111827', fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'] }, navigationStatLabel: { color: '#64748b', fontSize: 9, fontWeight: '800' }, navigationRouteCard: { minHeight: 48, maxHeight: 52, borderRadius: 14, backgroundColor: '#ffffff' }, navigationRouteContent: { alignItems: 'center', gap: 7, paddingHorizontal: 10 }, routePointItem: { flexDirection: 'row', alignItems: 'center', gap: 7 }, routePointDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#168755' }, routePointDotDestination: { backgroundColor: '#da251d' }, routePointDotText: { color: '#ffffff', fontSize: 10, fontWeight: '900' }, routePointText: { maxWidth: 170, color: '#334155', fontSize: 10, fontWeight: '800' }, navigationControls: { flexDirection: 'row', gap: 8 }, navigationControlButton: { width: 54, minHeight: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#168755' }, navigationControlButtonMuted: { backgroundColor: '#fff1f0', borderWidth: 1, borderColor: '#fda29b' }, navigationSecondaryButton: { width: 54, minHeight: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' }, stopNavigationButton: { flex: 1, minHeight: 54, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#da251d' }, stopNavigationText: { color: '#ffffff', fontSize: 12, fontWeight: '900' }, navigationLeaveButton: { width: 54, minHeight: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7f1d1d' },
});
