import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useKeepAwake } from 'expo-keep-awake';
import {
  AudioSession,
  LiveKitRoom,
  registerGlobals,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from '@livekit/react-native';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import { LiveTeamRoomView } from '../components/live-team-room-view';
import { liveTeamInviteLink } from '../services/live-team-code';
import { distanceMeters, shouldPublishLocation, startLiveTeamBackgroundLocation, stopLiveTeamBackgroundLocation } from '../services/live-team-location';
import { applyLiveTeamEvent, decodeLiveTeamEvent, encodeLiveTeamEvent, memberFromParticipant } from '../services/live-team-realtime';
import { getLiveTeamCredentials, type LiveTeamCredentials } from '../services/live-team-token-api';
import { getLiveTeamLocationSnapshots, publishLiveTeamLocation, removeLiveTeamLocation } from '../services/live-team-location-api';
import type { LiveTeamEvent, LiveTeamLocation, LiveTeamMember, LiveTeamNavigationState, LiveTeamRoute, TransportationMode } from '../types';
import { getNearbyLiveTeamMembers, inviteMemberToLiveTeam, type MemberSocialProfile } from '../../member-calls/services/member-social-api';

registerGlobals();

type Props = {
  code: string;
  memberId: string;
  memberName: string;
  teamName: string;
  transportationMode: TransportationMode;
  initialRoute?: LiveTeamRoute | null;
  onLeave: () => void;
};

export function LiveTeamRoom(props: Props) {
  useKeepAwake('vinago-live-team');
  const [credentials, setCredentials] = useState<LiveTeamCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setCredentials(null);
    setError(null);
    void getLiveTeamCredentials(props.code).then((value) => {
      if (active) setCredentials(value);
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Không thể kết nối Live Team.');
    });
    return () => { active = false; };
  }, [attempt, props.code]);

  useEffect(() => {
    void AudioSession.startAudioSession();
    return () => { void AudioSession.stopAudioSession(); };
  }, []);

  if (!credentials) {
    return (
      <View style={styles.status}>
        {error ? <Text selectable style={styles.error}>{error}</Text> : <><ActivityIndicator color="#da251d" size="large" /><Text style={styles.statusText}>Đang vào kênh thoại…</Text></>}
        {error ? <Pressable style={styles.retry} onPress={() => setAttempt((value) => value + 1)}><Text style={styles.retryText}>Thử lại</Text></Pressable> : null}
        <Pressable onPress={props.onLeave}><Text style={styles.leaveText}>Rời đội</Text></Pressable>
      </View>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={credentials.serverUrl}
      token={credentials.token}
      connect
      audio
      video={false}
      options={{ adaptiveStream: true, dynacast: true, disconnectOnPageLeave: true }}
      onError={(reason) => setError(reason.message)}
      onMediaDeviceFailure={() => setError('Cần quyền micro để tham gia kênh thoại.')}
    >
      <ConnectedLiveTeam {...props} connectionError={error} />
    </LiveKitRoom>
  );
}

function ConnectedLiveTeam({ code, memberId, memberName, teamName, transportationMode, initialRoute, onLeave, connectionError }: Props & { connectionError: string | null }) {
  const room = useRoomContext();
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const [memberMap, setMemberMap] = useState<Record<string, LiveTeamMember>>({});
  const [locationSharing, setLocationSharing] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [nearbyMembers, setNearbyMembers] = useState<MemberSocialProfile[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [invitedMemberIds, setInvitedMemberIds] = useState<Set<string>>(new Set());
  const [route, setRoute] = useState<LiveTeamRoute | null>(initialRoute ?? null);
  const [navigation, setNavigation] = useState<LiveTeamNavigationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastLocationRef = useRef<LiveTeamLocation | null>(null);
  const lastNearbyRefreshRef = useRef(0);

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;
    void Location.getForegroundPermissionsAsync().then((permission) => {
      if (permission.granted) setLocationSharing(true);
    });
  }, [connectionState]);

  const getScanLocation = useCallback(async () => {
    if (lastLocationRef.current) return lastLocationRef.current;
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) throw new Error('Cần quyền vị trí để quét thành viên online xung quanh.');
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const next: LiveTeamLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      altitude: position.coords.altitude,
      timestamp: position.timestamp,
    };
    lastLocationRef.current = next;
    return next;
  }, []);

  const refreshNearby = useCallback(async () => {
    setNearbyLoading(true);
    setError(null);
    try {
      const location = await getScanLocation();
      setNearbyMembers(await getNearbyLiveTeamMembers({ lat: location.latitude, lng: location.longitude }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể quét thành viên xung quanh.');
    } finally {
      setNearbyLoading(false);
    }
  }, [getScanLocation]);

  const inviteNearby = useCallback(async (member: MemberSocialProfile) => {
    try {
      const location = lastLocationRef.current;
      await inviteMemberToLiveTeam(member.id, code, teamName, location ? { lat: location.latitude, lng: location.longitude } : null);
      setInvitedMemberIds((current) => new Set(current).add(member.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể gửi lời mời.');
    }
  }, [code, teamName]);

  const publish = useCallback(async (event: LiveTeamEvent) => {
    await room.localParticipant.publishData(encodeLiveTeamEvent(event), { reliable: true, topic: 'live-team' });
    setMemberMap((current) => applyLiveTeamEvent(current, event));
  }, [room]);

  useEffect(() => {
    setMemberMap((current) => {
      const next = { ...current };
      participants.forEach((participant) => {
        next[participant.identity] = memberFromParticipant(participant, next[participant.identity], participant.identity === memberId ? transportationMode : 'OTHER');
      });
      Object.keys(next).forEach((identity) => {
        if (!participants.some((participant) => participant.identity === identity)) next[identity] = { ...next[identity], isOnline: false, isSpeaking: false };
      });
      return next;
    });
  }, [memberId, participants, transportationMode]);

  useEffect(() => {
    const onData = (payload: Uint8Array, participant?: { identity: string }) => {
      const event = decodeLiveTeamEvent(payload);
      if (participant && event?.userId !== participant.identity) return;
      if (event?.event === 'ROUTE_UPDATE') setRoute(event.data);
      if (event?.event === 'NAVIGATION_UPDATE') setNavigation((current) => !current || event.data.updatedAt >= current.updatedAt ? event.data : current);
      if (event) setMemberMap((current) => applyLiveTeamEvent(current, event));
    };
    const republish = () => {
      const location = lastLocationRef.current;
      if (location && locationSharing) void publish({ event: 'LOCATION_UPDATE', userId: memberId, data: { ...location, name: memberName, transportationMode } });
      if (route) void publish({ event: 'ROUTE_UPDATE', userId: memberId, data: route });
      if (navigation) void publish({ event: 'NAVIGATION_UPDATE', userId: memberId, data: navigation });
    };
    room.on(RoomEvent.DataReceived, onData).on(RoomEvent.ParticipantConnected, republish).on(RoomEvent.Reconnected, republish);
    return () => { room.off(RoomEvent.DataReceived, onData).off(RoomEvent.ParticipantConnected, republish).off(RoomEvent.Reconnected, republish); };
  }, [locationSharing, memberId, memberName, navigation, publish, room, route, transportationMode]);

  useEffect(() => {
    if (connectionState === ConnectionState.Connected && initialRoute) void publish({ event: 'ROUTE_UPDATE', userId: memberId, data: initialRoute });
  }, [connectionState, initialRoute, memberId, publish]);

  useEffect(() => {
    if (!locationSharing || connectionState !== ConnectionState.Connected) return;
    let active = true;
    let subscription: Location.LocationSubscription | null = null;
    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('Cần quyền vị trí để chia sẻ GPS với đội.');
      await startLiveTeamBackgroundLocation({ roomCode: code, name: memberName, transportationMode }).catch(() => false);
      subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 8, timeInterval: 2500 }, (position) => {
        if (!active) return;
        const next: LiveTeamLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
        };
        if (!shouldPublishLocation(lastLocationRef.current, next)) return;
        lastLocationRef.current = next;
        if (Date.now() - lastNearbyRefreshRef.current >= 15_000) {
          lastNearbyRefreshRef.current = Date.now();
          void refreshNearby();
        }
        void publish({ event: 'LOCATION_UPDATE', userId: memberId, data: { ...next, name: memberName, transportationMode } }).catch(() => {});
        void publishLiveTeamLocation(code, memberName, transportationMode, next).catch(() => {});
      });
    })().catch((reason) => { if (active) { setLocationSharing(false); setError(reason instanceof Error ? reason.message : 'Không thể truy cập vị trí.'); } });
    return () => { active = false; subscription?.remove(); };
  }, [code, connectionState, locationSharing, memberId, memberName, publish, refreshNearby, transportationMode]);

  useEffect(() => {
    const sync = () => void getLiveTeamLocationSnapshots(code).then((snapshots) => {
      snapshots.forEach((snapshot) => setMemberMap((current) => {
        const next = applyLiveTeamEvent(current, { event: 'LOCATION_UPDATE', userId: snapshot.userId, data: { ...snapshot.location, name: snapshot.name, transportationMode: snapshot.transportationMode } });
        return { ...next, [snapshot.userId]: { ...next[snapshot.userId], isOnline: Date.now() - snapshot.updatedAt < 30_000 } };
      }));
    }).catch(() => {});
    sync();
    const timer = setInterval(sync, 30_000);
    return () => clearInterval(timer);
  }, [code]);

  const toggleLocation = useCallback((enabled: boolean) => {
    if (!enabled) {
      setLocationSharing(false);
      setError(null);
      void publish({ event: 'LOCATION_SHARING_DISABLED', userId: memberId });
      void stopLiveTeamBackgroundLocation();
      return;
    }

    Alert.alert(
      'Vinago+ sử dụng vị trí ở chế độ nền',
      'Vinago+ thu thập dữ liệu vị trí để chia sẻ vị trí trực tiếp với các thành viên trong Live Team ngay cả khi bạn đóng hoặc không sử dụng ứng dụng. Dữ liệu chỉ được chia sẻ với thành viên trong đội bạn tham gia, không dùng cho quảng cáo. Bạn có thể dừng bất cứ lúc nào bằng cách tắt “Chia sẻ GPS” hoặc rời đội.',
      [
        { text: 'Không phải bây giờ', style: 'cancel' },
        {
          text: 'Tiếp tục',
          onPress: () => {
            setLocationSharing(true);
            setError(null);
            void publish({ event: 'LOCATION_SHARING_ENABLED', userId: memberId });
          },
        },
      ],
    );
  }, [memberId, publish]);

  const toggleSpeaker = useCallback(() => {
    const enabled = !speakerEnabled;
    room.remoteParticipants.forEach((participant) => participant.audioTrackPublications.forEach((publication) => publication.setSubscribed(enabled)));
    setSpeakerEnabled(enabled);
  }, [room, speakerEnabled]);

  const setNavigationActive = useCallback((active: boolean) => {
    const now = Date.now();
    const next: LiveTeamNavigationState = {
      active,
      targetIndex: active ? 1 : navigation?.targetIndex ?? 1,
      startedByUserId: active ? memberId : navigation?.startedByUserId ?? memberId,
      startedByName: active ? memberName : navigation?.startedByName ?? memberName,
      startedAt: active ? now : navigation?.startedAt ?? now,
      updatedAt: now,
    };
    setNavigation(next);
    void (async () => {
      if (active && route) await publish({ event: 'ROUTE_UPDATE', userId: memberId, data: route });
      await publish({ event: 'NAVIGATION_UPDATE', userId: memberId, data: next });
    })().catch(() => setError('Không thể đồng bộ trạng thái dẫn đường.'));
  }, [memberId, memberName, navigation, publish, route]);

  useEffect(() => {
    if (!navigation?.active || navigation.startedByUserId !== memberId || !route) return;
    const location = memberMap[memberId]?.location;
    if (!location) return;
    const places = [route.origin, ...(route.stops ?? []), route.destination];
    const targetIndex = Math.min(Math.max(1, navigation.targetIndex ?? 1), places.length - 1);
    if (targetIndex >= places.length - 1 || distanceMeters(location, places[targetIndex]) > 80) return;
    const next = { ...navigation, targetIndex: targetIndex + 1, updatedAt: Date.now() };
    setNavigation(next);
    void publish({ event: 'NAVIGATION_UPDATE', userId: memberId, data: next });
  }, [memberId, memberMap, navigation, publish, route]);

  const members = useMemo(() => Object.values(memberMap).sort((a, b) => Number(b.isSpeaking) - Number(a.isSpeaking) || Number(b.isOnline) - Number(a.isOnline)), [memberMap]);
  const connectionLabel = connectionState === ConnectionState.Connected ? '🟢 Trực tuyến' : connectionState === ConnectionState.Reconnecting ? '🟡 Đang kết nối lại' : '🔴 Mất kết nối';

  return (
    <LiveTeamRoomView
      code={code}
      connectionLabel={connectionLabel}
      error={error || connectionError}
      isConnecting={connectionState !== ConnectionState.Connected}
      isMuted={!isMicrophoneEnabled}
      locationSharing={locationSharing}
      members={members}
      navigation={navigation}
      route={route}
      nearbyMembers={nearbyMembers}
      nearbyLoading={nearbyLoading}
      invitedMemberIds={invitedMemberIds}
      onLeave={() => { void stopLiveTeamBackgroundLocation(); void removeLiveTeamLocation(code); onLeave(); }}
      onShare={() => void Share.share({ message: `Tham gia ${teamName}: ${liveTeamInviteLink(code)}` })}
      onToggleLocation={toggleLocation}
      onToggleMicrophone={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
      onToggleSpeaker={toggleSpeaker}
      onRefreshNearby={() => void refreshNearby()}
      onInviteNearby={(member) => void inviteNearby(member)}
      onStartNavigation={() => setNavigationActive(true)}
      onStopNavigation={() => setNavigationActive(false)}
      speakerEnabled={speakerEnabled}
      teamName={teamName}
      userId={memberId}
    />
  );
}

const styles = StyleSheet.create({
  status: { flex: 1, minHeight: 500, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28, backgroundColor: '#f8fafc' },
  statusText: { color: '#334155', fontSize: 16, fontWeight: '800' },
  error: { color: '#b42318', fontSize: 14, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  retry: { backgroundColor: '#da251d', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 }, retryText: { color: '#fff', fontWeight: '900' }, leaveText: { color: '#64748b', fontWeight: '800', padding: 8 },
});
