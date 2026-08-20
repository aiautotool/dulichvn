import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import type { LiveTeamLocation, LiveTeamMember, LiveTeamNavigationState, LiveTeamRoute, TransportationMode } from '../types';
import { ConnectionState, Room, RoomEvent, Track } from 'livekit-client';
import { LiveTeamRoomView } from '../components/live-team-room-view';
import { liveTeamInviteLink } from '../services/live-team-code';
import { distanceMeters, shouldPublishLocation } from '../services/live-team-location';
import { applyLiveTeamEvent, decodeLiveTeamEvent, encodeLiveTeamEvent, memberFromParticipant } from '../services/live-team-realtime';
import { getLiveTeamCredentials } from '../services/live-team-token-api';
import { getLiveTeamLocationSnapshots, publishLiveTeamLocation, removeLiveTeamLocation } from '../services/live-team-location-api';
import type { LiveTeamEvent } from '../types';
import { getNearbyLiveTeamMembers, inviteMemberToLiveTeam, type MemberSocialProfile } from '../../member-calls/services/member-social-api';

type Props = { code: string; memberId: string; memberName: string; teamName: string; transportationMode: TransportationMode; initialRoute?: LiveTeamRoute | null; onLeave: () => void };

export function LiveTeamRoom({ code, memberId, memberName, teamName, transportationMode, initialRoute, onLeave }: Props) {
  useKeepAwake('vinago-live-team');
  const [room, setRoom] = useState<Room | null>(null);
  const [memberMap, setMemberMap] = useState<Record<string, LiveTeamMember>>({});
  const [connectionState, setConnectionState] = useState(ConnectionState.Connecting);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [nearbyMembers, setNearbyMembers] = useState<MemberSocialProfile[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [invitedMemberIds, setInvitedMemberIds] = useState<Set<string>>(new Set());
  const [route, setRoute] = useState<LiveTeamRoute | null>(initialRoute ?? null);
  const [navigation, setNavigation] = useState<LiveTeamNavigationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastLocationRef = useRef<LiveTeamLocation | null>(null);
  const audioElementsRef = useRef(new Set<HTMLMediaElement>());
  const lastNearbyRefreshRef = useRef(0);
  const routeRef = useRef<LiveTeamRoute | null>(initialRoute ?? null);
  const navigationRef = useRef<LiveTeamNavigationState | null>(null);

  const getScanLocation = useCallback(async () => {
    if (lastLocationRef.current) return lastLocationRef.current;
    if (!navigator.geolocation) throw new Error('Trình duyệt không hỗ trợ định vị.');
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 });
    });
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

  useEffect(() => {
    let active = true;
    const nextRoom = new Room({ adaptiveStream: true, dynacast: true, disconnectOnPageLeave: true });
    const sync = () => {
      if (!active) return;
      setMemberMap((current) => {
        const next = { ...current };
        const participants = [nextRoom.localParticipant, ...nextRoom.remoteParticipants.values()];
        participants.forEach((participant) => { next[participant.identity] = memberFromParticipant(participant, next[participant.identity], participant.identity === memberId ? transportationMode : 'OTHER'); });
        Object.keys(next).forEach((id) => { if (!participants.some((participant) => participant.identity === id)) next[id] = { ...next[id], isOnline: false, isSpeaking: false }; });
        return next;
      });
    };
    const onData = (payload: Uint8Array, participant?: { identity: string }) => {
      const event = decodeLiveTeamEvent(payload);
      if (participant && event?.userId !== participant.identity) return;
      if (event?.event === 'ROUTE_UPDATE') {
        routeRef.current = event.data;
        setRoute(event.data);
      }
      if (event?.event === 'NAVIGATION_UPDATE') {
        const current = navigationRef.current;
        if (!current || event.data.updatedAt >= current.updatedAt) {
          navigationRef.current = event.data;
          setNavigation(event.data);
        }
      }
      if (event) setMemberMap((current) => applyLiveTeamEvent(current, event));
    };
    const republishTeamState = () => {
      if (routeRef.current) void nextRoom.localParticipant.publishData(encodeLiveTeamEvent({ event: 'ROUTE_UPDATE', userId: memberId, data: routeRef.current }), { reliable: true, topic: 'live-team' });
      if (navigationRef.current) void nextRoom.localParticipant.publishData(encodeLiveTeamEvent({ event: 'NAVIGATION_UPDATE', userId: memberId, data: navigationRef.current }), { reliable: true, topic: 'live-team' });
    };
    const attachAudio = (track: { kind: Track.Kind; attach: () => HTMLMediaElement }) => {
      if (track.kind !== Track.Kind.Audio) return;
      const element = track.attach();
      element.autoplay = true;
      element.style.display = 'none';
      document.body.appendChild(element);
      audioElementsRef.current.add(element);
    };
    nextRoom
      .on(RoomEvent.ConnectionStateChanged, setConnectionState)
      .on(RoomEvent.ParticipantConnected, sync)
      .on(RoomEvent.ParticipantConnected, republishTeamState)
      .on(RoomEvent.ParticipantDisconnected, sync)
      .on(RoomEvent.ActiveSpeakersChanged, sync)
      .on(RoomEvent.TrackMuted, sync)
      .on(RoomEvent.TrackUnmuted, sync)
      .on(RoomEvent.DataReceived, onData)
      .on(RoomEvent.TrackSubscribed, attachAudio);
    void (async () => {
      try {
        setError(null);
        const credentials = await getLiveTeamCredentials(code);
        await nextRoom.connect(credentials.serverUrl, credentials.token);
        if (!active) return;
        setRoom(nextRoom);
        await nextRoom.startAudio();
        await nextRoom.localParticipant.setMicrophoneEnabled(true);
        if (initialRoute) {
          routeRef.current = initialRoute;
          await nextRoom.localParticipant.publishData(encodeLiveTeamEvent({ event: 'ROUTE_UPDATE', userId: memberId, data: initialRoute }), { reliable: true, topic: 'live-team' });
        }
        sync();
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Không thể kết nối Live Team.');
      }
    })();
    return () => {
      active = false;
      audioElementsRef.current.forEach((element) => element.remove());
      audioElementsRef.current.clear();
      void nextRoom.disconnect();
    };
  }, [code, initialRoute, memberId, transportationMode]);

  const publish = useCallback(async (event: LiveTeamEvent) => {
    if (!room || room.state !== ConnectionState.Connected) return;
    await room.localParticipant.publishData(encodeLiveTeamEvent(event), { reliable: true, topic: 'live-team' });
    setMemberMap((current) => applyLiveTeamEvent(current, event));
  }, [room]);

  useEffect(() => {
    if (!room || !locationSharing || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition((position) => {
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
      void publish({ event: 'LOCATION_UPDATE', userId: memberId, data: { ...next, name: memberName, transportationMode } });
      void publishLiveTeamLocation(code, memberName, transportationMode, next).catch(() => {});
    }, (reason) => setError(reason.code === 1 ? 'Trình duyệt chưa cho phép chia sẻ vị trí.' : 'Không thể cập nhật GPS.'), { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [code, locationSharing, memberId, memberName, publish, refreshNearby, room, transportationMode]);

  useEffect(() => {
    const sync = () => void getLiveTeamLocationSnapshots(code).then((snapshots) => snapshots.forEach((snapshot) => setMemberMap((current) => {
      const next = applyLiveTeamEvent(current, { event: 'LOCATION_UPDATE', userId: snapshot.userId, data: { ...snapshot.location, name: snapshot.name, transportationMode: snapshot.transportationMode } });
      return { ...next, [snapshot.userId]: { ...next[snapshot.userId], isOnline: Date.now() - snapshot.updatedAt < 30_000 } };
    }))).catch(() => {});
    sync();
    const timer = setInterval(sync, 30_000);
    return () => clearInterval(timer);
  }, [code]);

  const toggleLocation = (enabled: boolean) => {
    setLocationSharing(enabled);
    void publish({ event: enabled ? 'LOCATION_SHARING_ENABLED' : 'LOCATION_SHARING_DISABLED', userId: memberId } as LiveTeamEvent);
  };
  const toggleSpeaker = () => {
    const enabled = !speakerEnabled;
    audioElementsRef.current.forEach((element) => { element.muted = !enabled; });
    setSpeakerEnabled(enabled);
  };
  const setNavigationActive = (active: boolean) => {
    const now = Date.now();
    const current = navigationRef.current;
    const next: LiveTeamNavigationState = {
      active,
      targetIndex: active ? 1 : current?.targetIndex ?? 1,
      startedByUserId: active ? memberId : current?.startedByUserId ?? memberId,
      startedByName: active ? memberName : current?.startedByName ?? memberName,
      startedAt: active ? now : current?.startedAt ?? now,
      updatedAt: now,
    };
    navigationRef.current = next;
    setNavigation(next);
    void (async () => {
      if (active && route) await publish({ event: 'ROUTE_UPDATE', userId: memberId, data: route });
      await publish({ event: 'NAVIGATION_UPDATE', userId: memberId, data: next });
    })().catch(() => setError('Không thể đồng bộ trạng thái dẫn đường.'));
  };

  useEffect(() => {
    if (!navigation?.active || navigation.startedByUserId !== memberId || !route) return;
    const location = memberMap[memberId]?.location;
    if (!location) return;
    const places = [route.origin, ...(route.stops ?? []), route.destination];
    const targetIndex = Math.min(Math.max(1, navigation.targetIndex ?? 1), places.length - 1);
    if (targetIndex >= places.length - 1 || distanceMeters(location, places[targetIndex]) > 80) return;
    const next = { ...navigation, targetIndex: targetIndex + 1, updatedAt: Date.now() };
    navigationRef.current = next;
    setNavigation(next);
    void publish({ event: 'NAVIGATION_UPDATE', userId: memberId, data: next });
  }, [memberId, memberMap, navigation, publish, route]);
  const share = async () => {
    const url = liveTeamInviteLink(code);
    if (navigator.share) await navigator.share({ title: teamName, text: `Tham gia ${teamName}`, url });
    else await navigator.clipboard.writeText(url);
  };

  const members = useMemo(() => Object.values(memberMap).sort((a, b) => Number(b.isSpeaking) - Number(a.isSpeaking) || Number(b.isOnline) - Number(a.isOnline)), [memberMap]);
  const label = connectionState === ConnectionState.Connected ? '🟢 Trực tuyến' : connectionState === ConnectionState.Reconnecting ? '🟡 Đang kết nối lại' : '🔴 Mất kết nối';

  return <LiveTeamRoomView code={code} connectionLabel={label} error={error} isConnecting={connectionState !== ConnectionState.Connected} isMuted={isMuted} locationSharing={locationSharing} members={members} navigation={navigation} route={route} nearbyMembers={nearbyMembers} nearbyLoading={nearbyLoading} invitedMemberIds={invitedMemberIds} onLeave={() => { void removeLiveTeamLocation(code); onLeave(); }} onShare={() => void share()} onToggleLocation={toggleLocation} onToggleMicrophone={() => { if (!room) return; void room.localParticipant.setMicrophoneEnabled(isMuted).then(() => setIsMuted((value) => !value)).catch((reason) => setError(reason.message)); }} onToggleSpeaker={toggleSpeaker} onRefreshNearby={() => void refreshNearby()} onInviteNearby={(member) => void inviteNearby(member)} onStartNavigation={() => setNavigationActive(true)} onStopNavigation={() => setNavigationActive(false)} speakerEnabled={speakerEnabled} teamName={teamName} userId={memberId} />;
}
