import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, Mic, MicOff, PhoneOff, RefreshCw, Video, VideoOff } from 'lucide-react-native';
import {
  ConnectionState,
  LocalVideoTrack,
  RemoteTrack,
  RemoteVideoTrack,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client';
import type { LivePreviewActorRole, LivePreviewRequest } from '../types';
import { getLiveCallCredentials } from '../services/liveCallTokenApi';

type Props = {
  request: LivePreviewRequest;
  role: LivePreviewActorRole;
  onEndCall: (durationSeconds: number) => void;
};

type BrowserVideoTrack = LocalVideoTrack | RemoteVideoTrack;

export function LiveCallRoomScreen({ request, role, onEndCall }: Props) {
  const [room, setRoom] = useState<Room | null>(null);
  const [remoteTrack, setRemoteTrack] = useState<RemoteVideoTrack | null>(null);
  const [localTrack, setLocalTrack] = useState<LocalVideoTrack | null>(null);
  const [connectionState, setConnectionState] = useState(ConnectionState.Disconnected);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const callRoom = new Room({ adaptiveStream: true, dynacast: true });
    const attachedAudio = new Set<HTMLMediaElement>();

    const attachRemoteTrack = (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Video && track.source === Track.Source.Camera) {
        setRemoteTrack(track as RemoteVideoTrack);
      }
      if (track.kind === Track.Kind.Audio) {
        const element = track.attach();
        element.autoplay = true;
        element.style.display = 'none';
        document.body.appendChild(element);
        attachedAudio.add(element);
      }
    };
    const detachRemoteTrack = (track: RemoteTrack) => {
      setRemoteTrack((current) => current === track ? null : current);
      track.detach().forEach((element) => {
        attachedAudio.delete(element);
        element.remove();
      });
    };

    callRoom
      .on(RoomEvent.ConnectionStateChanged, setConnectionState)
      .on(RoomEvent.TrackSubscribed, attachRemoteTrack)
      .on(RoomEvent.TrackUnsubscribed, detachRemoteTrack)
      .on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.source === Track.Source.Camera && publication.videoTrack) {
          setLocalTrack(publication.videoTrack);
        }
      })
      .on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (publication.source === Track.Source.Camera) setLocalTrack(null);
      });

    const connect = async () => {
      setErrorMessage(null);
      try {
        const credentials = await getLiveCallCredentials(request.id, role);
        await callRoom.connect(credentials.serverUrl, credentials.token);
        if (!active) return;
        setRoom(callRoom);
        await callRoom.startAudio();
        await Promise.all([
          callRoom.localParticipant.setMicrophoneEnabled(true),
          callRoom.localParticipant.setCameraEnabled(true, { facingMode: 'user' }),
        ]);
        const publishedCamera = callRoom.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack;
        if (publishedCamera) setLocalTrack(publishedCamera);
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : 'Could not connect the video call.');
      }
    };
    void connect();

    return () => {
      active = false;
      attachedAudio.forEach((element) => element.remove());
      void callRoom.disconnect();
    };
  }, [attempt, request.id, role]);

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;
    const timer = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, [connectionState]);

  const timerLabel = useMemo(() => formatDuration(seconds), [seconds]);

  const toggleMicrophone = useCallback(async () => {
    if (!room) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted((current) => !current);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not change microphone state.');
    }
  }, [isMuted, room]);

  const toggleCamera = useCallback(async () => {
    if (!room) return;
    try {
      await room.localParticipant.setCameraEnabled(!isCameraOn, {
        facingMode: isFrontCamera ? 'user' : 'environment',
      });
      setIsCameraOn((current) => !current);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not change camera state.');
    }
  }, [isCameraOn, isFrontCamera, room]);

  const switchCamera = useCallback(async () => {
    if (!localTrack) return;
    const nextIsFront = !isFrontCamera;
    try {
      await localTrack.restartTrack({ facingMode: nextIsFront ? 'user' : 'environment' });
      setIsFrontCamera(nextIsFront);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not switch camera.');
    }
  }, [isFrontCamera, localTrack]);

  if (errorMessage && connectionState !== ConnectionState.Connected) {
    return (
      <View style={styles.statusWrap}>
        <VideoOff color="#da251d" size={44} />
        <Text style={styles.statusTitle}>Video call unavailable</Text>
        <Text style={styles.statusBody}>{errorMessage}</Text>
        <Pressable style={styles.retryButton} onPress={() => setAttempt((current) => current + 1)}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
        <Pressable onPress={() => onEndCall(seconds)}>
          <Text style={styles.leaveText}>Leave call</Text>
        </Pressable>
      </View>
    );
  }

  const isConnected = connectionState === ConnectionState.Connected;
  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <View style={styles.heading}>
          <Text style={styles.placeName}>{request.placeName}</Text>
          <Text style={styles.roomText}>
            {isConnected ? (remoteTrack ? 'Connected' : 'Waiting for the other member') : 'Connecting'} · {timerLabel}
          </Text>
        </View>
        <View style={styles.rolePill}><Text style={styles.rolePillText}>{role}</Text></View>
      </View>

      <View style={styles.remoteVideo}>
        {remoteTrack ? (
          <WebVideo track={remoteTrack} />
        ) : (
          <View style={styles.placeholder}>
            {isConnected ? <Video color="#ffffff" size={44} /> : <ActivityIndicator color="#ffffff" size="large" />}
            <Text style={styles.remoteTitle}>{isConnected ? 'Waiting for the other member' : 'Connecting video call…'}</Text>
            <Text style={styles.remoteBody}>Camera and microphone access are requested by your browser.</Text>
          </View>
        )}
      </View>

      <View style={styles.localVideo}>
        {localTrack && isCameraOn ? <WebVideo track={localTrack} muted mirror={isFrontCamera} /> : (
          <View style={styles.placeholder}><Camera color="#ffffff" size={26} /><Text style={styles.localText}>Camera off</Text></View>
        )}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={() => void toggleMicrophone()}>
          {isMuted ? <MicOff color="#da251d" size={22} /> : <Mic color="#1a1a1a" size={22} />}
        </Pressable>
        <Pressable style={styles.endButton} onPress={() => onEndCall(seconds)}><PhoneOff color="#ffffff" size={24} /></Pressable>
        <Pressable style={styles.controlButton} onPress={() => void toggleCamera()}>
          {isCameraOn ? <Video color="#1a1a1a" size={22} /> : <VideoOff color="#da251d" size={22} />}
        </Pressable>
        <Pressable style={styles.controlButton} onPress={() => void switchCamera()}><RefreshCw color="#1a1a1a" size={21} /></Pressable>
      </View>
    </View>
  );
}

function WebVideo({ track, muted = false, mirror = false }: { track: BrowserVideoTrack; muted?: boolean; mirror?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    track.attach(element);
    return () => { track.detach(element); };
  }, [track]);
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: mirror ? 'scaleX(-1)' : undefined }}
    />
  );
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 620, backgroundColor: '#111111', padding: 14, gap: 12 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  heading: { flex: 1 },
  placeName: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  roomText: { color: '#c8c8c8', fontSize: 12, fontWeight: '800' },
  rolePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fdebea' },
  rolePillText: { color: '#da251d', fontSize: 12, fontWeight: '900', textTransform: 'capitalize' },
  remoteVideo: { flex: 1, minHeight: 430, borderRadius: 12, backgroundColor: '#242424', overflow: 'hidden' },
  localVideo: { position: 'absolute', right: 28, bottom: 104, width: 160, height: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: '#3a3a3a', borderWidth: 2, borderColor: '#ffffff', zIndex: 2 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
  remoteTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  remoteBody: { color: '#d8d8d8', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  localText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 10 },
  controlButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  endButton: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: '#da251d' },
  errorText: { color: '#ffb4ab', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  statusWrap: { flex: 1, minHeight: 620, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  statusTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  statusBody: { color: '#d2d2d2', fontSize: 14, lineHeight: 21, fontWeight: '700', textAlign: 'center' },
  retryButton: { backgroundColor: '#da251d', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  retryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  leaveText: { color: '#ffffff', fontSize: 14, fontWeight: '800', padding: 8 },
});
