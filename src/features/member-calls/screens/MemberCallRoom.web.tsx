import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, Mic, MicOff, PhoneOff, RefreshCw, Share2, Video, VideoOff } from 'lucide-react-native';
import { ConnectionState, LocalVideoTrack, RemoteTrack, RemoteVideoTrack, Room, RoomEvent, Track } from 'livekit-client';
import { formatRoomCode, shareMemberRoomCode } from '../roomCode';
import { getMemberCallCredentials } from '../services/memberCallTokenApi';

type Props = { roomCode: string; memberName: string; callMode: 'audio' | 'video'; onLeave: () => void };
type BrowserVideoTrack = LocalVideoTrack | RemoteVideoTrack;

export function MemberCallRoom({ roomCode, memberName, callMode, onLeave }: Props) {
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
    const audioElements = new Set<HTMLMediaElement>();
    const attachRemoteTrack = (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Video && track.source === Track.Source.Camera) setRemoteTrack(track as RemoteVideoTrack);
      if (track.kind === Track.Kind.Audio) {
        const element = track.attach(); element.autoplay = true; element.style.display = 'none'; document.body.appendChild(element); audioElements.add(element);
      }
    };
    const detachRemoteTrack = (track: RemoteTrack) => {
      setRemoteTrack((current) => current === track ? null : current);
      track.detach().forEach((element) => { audioElements.delete(element); element.remove(); });
    };
    callRoom
      .on(RoomEvent.ConnectionStateChanged, setConnectionState)
      .on(RoomEvent.TrackSubscribed, attachRemoteTrack)
      .on(RoomEvent.TrackUnsubscribed, detachRemoteTrack)
      .on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.source === Track.Source.Camera && publication.videoTrack) setLocalTrack(publication.videoTrack);
      })
      .on(RoomEvent.LocalTrackUnpublished, (publication) => { if (publication.source === Track.Source.Camera) setLocalTrack(null); });

    const connect = async () => {
      setErrorMessage(null);
      try {
        const credentials = await getMemberCallCredentials(roomCode);
        await callRoom.connect(credentials.serverUrl, credentials.token);
        if (!active) return;
        setRoom(callRoom);
        await callRoom.startAudio();
        await callRoom.localParticipant.setMicrophoneEnabled(true);
        if (callMode === 'video') await callRoom.localParticipant.setCameraEnabled(true, { facingMode: 'user' });
        const camera = callRoom.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack;
        if (camera) setLocalTrack(camera);
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : 'Không thể kết nối cuộc gọi.');
      }
    };
    void connect();
    return () => { active = false; audioElements.forEach((element) => element.remove()); void callRoom.disconnect(); };
  }, [attempt, callMode, roomCode]);

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [connectionState]);

  const toggleMicrophone = useCallback(async () => {
    if (!room) return;
    try { await room.localParticipant.setMicrophoneEnabled(isMuted); setIsMuted((value) => !value); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Không thể thay đổi micro.'); }
  }, [isMuted, room]);
  const toggleCamera = useCallback(async () => {
    if (!room) return;
    try { await room.localParticipant.setCameraEnabled(!isCameraOn, { facingMode: isFrontCamera ? 'user' : 'environment' }); setIsCameraOn((value) => !value); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Không thể thay đổi camera.'); }
  }, [isCameraOn, isFrontCamera, room]);
  const switchCamera = useCallback(async () => {
    if (!localTrack) return;
    const next = !isFrontCamera;
    try { await localTrack.restartTrack({ facingMode: next ? 'user' : 'environment' }); setIsFrontCamera(next); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Không thể đổi camera.'); }
  }, [isFrontCamera, localTrack]);

  const timerLabel = useMemo(() => formatDuration(seconds), [seconds]);
  if (errorMessage && connectionState !== ConnectionState.Connected) {
    return <View style={styles.statusWrap}><VideoOff color="#da251d" size={44} /><Text style={styles.statusTitle}>Không thể gọi video</Text><Text style={styles.statusBody}>{errorMessage}</Text><Pressable style={styles.retryButton} onPress={() => setAttempt((value) => value + 1)}><Text style={styles.retryText}>Thử lại</Text></Pressable><Pressable onPress={onLeave}><Text style={styles.leaveText}>Rời phòng</Text></Pressable></View>;
  }

  const connected = connectionState === ConnectionState.Connected;
  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <View style={styles.heading}><Text style={styles.title}>{callMode === 'audio' ? 'Gọi thoại thành viên' : 'Gọi video thành viên'}</Text><Text style={styles.status}>{connected ? (remoteTrack || callMode === 'audio' ? 'Đã kết nối' : 'Đang chờ thành viên khác') : 'Đang kết nối'} · {timerLabel}</Text></View>
        <Pressable style={styles.inviteButton} onPress={() => void shareMemberRoomCode(roomCode)}><Share2 color="#da251d" size={16} /><Text style={styles.inviteText}>{formatRoomCode(roomCode)}</Text></Pressable>
      </View>
      <View style={styles.remoteVideo}>{callMode === 'video' && remoteTrack ? <WebVideo track={remoteTrack} /> : <View style={styles.placeholder}>{connected ? (callMode === 'audio' ? <PhoneOff color="#ffffff" size={44} /> : <Video color="#ffffff" size={44} />) : <ActivityIndicator color="#ffffff" size="large" />}<Text style={styles.remoteTitle}>{connected ? (callMode === 'audio' ? 'Cuộc gọi thoại' : 'Đang chờ thành viên khác') : 'Đang kết nối…'}</Text><Text style={styles.remoteBody}>{callMode === 'audio' ? 'Camera luôn tắt trong cuộc gọi này.' : `Gửi mã ${formatRoomCode(roomCode)} để mời họ vào phòng.`}</Text></View>}</View>
      {callMode === 'video' ? <View style={styles.localVideo}>{localTrack && isCameraOn ? <WebVideo track={localTrack} muted mirror={isFrontCamera} /> : <View style={styles.placeholder}><Camera color="#ffffff" size={25} /><Text style={styles.localText}>{memberName}</Text></View>}</View> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <View style={styles.controls}>
        <Pressable accessibilityLabel={isMuted ? 'Bật micro' : 'Tắt micro'} style={styles.controlButton} onPress={() => void toggleMicrophone()}>{isMuted ? <MicOff color="#da251d" size={22} /> : <Mic color="#1a1a1a" size={22} />}</Pressable>
        <Pressable accessibilityLabel="Kết thúc cuộc gọi" style={styles.endButton} onPress={onLeave}><PhoneOff color="#ffffff" size={24} /></Pressable>
        {callMode === 'video' ? <Pressable accessibilityLabel={isCameraOn ? 'Tắt camera' : 'Bật camera'} style={styles.controlButton} onPress={() => void toggleCamera()}>{isCameraOn ? <Video color="#1a1a1a" size={22} /> : <VideoOff color="#da251d" size={22} />}</Pressable> : null}
        {callMode === 'video' ? <Pressable accessibilityLabel="Đổi camera" style={styles.controlButton} onPress={() => void switchCamera()}><RefreshCw color="#1a1a1a" size={21} /></Pressable> : null}
      </View>
    </View>
  );
}

function WebVideo({ track, muted = false, mirror = false }: { track: BrowserVideoTrack; muted?: boolean; mirror?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => { const element = videoRef.current; if (!element) return; track.attach(element); return () => { track.detach(element); }; }, [track]);
  return <video ref={videoRef} autoPlay playsInline muted={muted} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: mirror ? 'scaleX(-1)' : undefined }} />;
}

function formatDuration(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 620, backgroundColor: '#111111', padding: 14, gap: 12 }, topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, heading: { flex: 1 }, title: { color: '#ffffff', fontSize: 18, fontWeight: '900' }, status: { color: '#c8c8c8', fontSize: 12, fontWeight: '800' },
  inviteButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, backgroundColor: '#ffffff', paddingHorizontal: 11, paddingVertical: 9 }, inviteText: { color: '#da251d', fontSize: 12, fontWeight: '900' }, remoteVideo: { flex: 1, minHeight: 430, borderRadius: 14, overflow: 'hidden', backgroundColor: '#242424' }, localVideo: { position: 'absolute', right: 28, bottom: 104, width: 160, height: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: '#3a3a3a', borderWidth: 2, borderColor: '#ffffff', zIndex: 2 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 }, remoteTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', textAlign: 'center' }, remoteBody: { color: '#d8d8d8', fontSize: 13, fontWeight: '700', textAlign: 'center' }, localText: { color: '#ffffff', fontSize: 12, fontWeight: '900', textAlign: 'center' }, controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 10 }, controlButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }, endButton: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: '#da251d' }, errorText: { color: '#ffb4ab', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  statusWrap: { flex: 1, minHeight: 620, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 }, statusTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', textAlign: 'center' }, statusBody: { color: '#d2d2d2', fontSize: 14, lineHeight: 21, fontWeight: '700', textAlign: 'center' }, retryButton: { backgroundColor: '#da251d', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 }, retryText: { color: '#ffffff', fontSize: 14, fontWeight: '900' }, leaveText: { color: '#ffffff', fontSize: 14, fontWeight: '800', padding: 8 },
});
