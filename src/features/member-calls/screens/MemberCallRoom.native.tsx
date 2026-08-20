import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AudioSession,
  isTrackReference,
  LiveKitRoom,
  registerGlobals,
  useConnectionState,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  VideoTrack,
} from '@livekit/react-native';
import { AudioModule } from 'expo-audio';
import { Camera, CameraIcon, Mic, MicOff, Phone, PhoneOff, RefreshCw, Share2, VideoOff } from 'lucide-react-native';
import { ConnectionState, Track } from 'livekit-client';
import { formatRoomCode, shareMemberRoomCode } from '../roomCode';
import { getMemberCallCredentials, type MemberCallCredentials } from '../services/memberCallTokenApi';
import { CallTone } from '../components/CallTone';

registerGlobals();

type Props = { roomCode: string; memberName: string; callMode: 'audio' | 'video'; onLeave: () => void };

export function MemberCallRoom({ roomCode, memberName, callMode, onLeave }: Props) {
  const [credentials, setCredentials] = useState<MemberCallCredentials | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [seconds, setSeconds] = useState(0);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const microphonePermission = await AudioModule.requestRecordingPermissionsAsync();
      if (!microphonePermission.granted) throw new Error('Bạn cần cho phép Vinago+ sử dụng micro để gọi.');
      await AudioSession.startAudioSession();
      setCredentials(await getMemberCallCredentials(roomCode));
    } catch (error) {
      setCredentials(null);
      setErrorMessage(error instanceof Error ? error.message : 'Không thể bắt đầu cuộc gọi.');
    } finally {
      setIsLoading(false);
    }
  }, [roomCode]);

  useEffect(() => { void connect(); }, [connect]);
  useEffect(() => () => { void AudioSession.stopAudioSession(); }, []);
  useEffect(() => {
    if (!credentials) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [credentials]);

  if (isLoading) return <CallStatus title="Đang kết nối cuộc gọi…" body="Đang chuẩn bị phòng riêng an toàn" loading />;
  if (!credentials) {
    return <CallStatus title="Không thể gọi video" body={errorMessage ?? 'Không thể kết nối dịch vụ.'} actionLabel="Thử lại" onAction={() => void connect()} onClose={onLeave} />;
  }

  return (
    <LiveKitRoom
      serverUrl={credentials.serverUrl}
      token={credentials.token}
      connect
      audio
      video={callMode === 'video' ? { facingMode: 'user' } : false}
      options={{ adaptiveStream: { pixelDensity: 'screen' }, dynacast: true }}
      onError={(error) => setErrorMessage(error.message)}
      onMediaDeviceFailure={() => setErrorMessage('Bạn cần cho phép truy cập camera và micro.')}
    >
      <ConnectedCall roomCode={roomCode} memberName={memberName} callMode={callMode} seconds={seconds} errorMessage={errorMessage} onLeave={onLeave} />
    </LiveKitRoom>
  );
}

function ConnectedCall({ roomCode, memberName, callMode, seconds, errorMessage, onLeave }: Props & { seconds: number; errorMessage: string | null }) {
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, cameraTrack } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const actionPending = useRef(false);
  const initializedMicrophone = useRef(false);
  const [controlError, setControlError] = useState<string | null>(null);
  const localTrack = cameraTracks.find((track) => track.participant.identity === localParticipant.identity);
  const remoteTrack = cameraTracks.find((track) => track.participant.identity !== localParticipant.identity);
  const timerLabel = useMemo(() => formatDuration(seconds), [seconds]);

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected || initializedMicrophone.current) return;
    initializedMicrophone.current = true;
    void localParticipant.setMicrophoneEnabled(true).catch(() => {
      setControlError('Không thể bật micro. Hãy kiểm tra quyền truy cập micro trong Cài đặt.');
    });
  }, [connectionState, localParticipant]);

  const runControl = async (action: () => Promise<unknown>) => {
    if (actionPending.current) return;
    actionPending.current = true;
    setControlError(null);
    try { await action(); } catch (error) {
      setControlError(error instanceof Error ? error.message : 'Không thể thay đổi thiết bị.');
    } finally { actionPending.current = false; }
  };

  const switchCamera = () => {
    const mediaTrack = cameraTrack?.videoTrack?.mediaStreamTrack as (MediaStreamTrack & { _switchCamera?: () => void }) | undefined;
    if (!mediaTrack?._switchCamera) return setControlError('Thiết bị này không hỗ trợ đổi camera.');
    mediaTrack._switchCamera();
  };

  const connected = connectionState === ConnectionState.Connected;
  return (
    <View style={styles.wrap}>
      <CallTone active={connected && remoteParticipants.length === 0} variant="outgoing" />
      <View style={styles.topBar}>
        <View style={styles.heading}>
          <Text style={styles.title}>{callMode === 'audio' ? 'Gọi thoại thành viên' : 'Gọi video thành viên'}</Text>
          <Text style={styles.status}>{connected ? (remoteTrack ? 'Đã kết nối' : 'Đang chờ thành viên khác') : 'Đang kết nối'} · {timerLabel}</Text>
        </View>
        <Pressable style={styles.inviteButton} onPress={() => void shareMemberRoomCode(roomCode)}><Share2 color="#da251d" size={16} /><Text style={styles.inviteText}>{formatRoomCode(roomCode)}</Text></Pressable>
      </View>
      <View style={styles.remoteVideo}>
        {callMode === 'video' && remoteTrack && isTrackReference(remoteTrack) ? <VideoTrack trackRef={remoteTrack} style={styles.videoFill} objectFit="cover" zOrder={0} /> : (
          <View style={styles.placeholder}>{connected ? (callMode === 'audio' ? <Phone color="#ffffff" size={42} /> : <Camera color="#ffffff" size={42} />) : <ActivityIndicator color="#ffffff" size="large" />}<Text style={styles.remoteTitle}>{connected ? 'Đang chờ thành viên khác' : 'Đang kết nối…'}</Text><Text style={styles.remoteBody}>{callMode === 'audio' ? 'Cuộc gọi chỉ sử dụng micro, camera luôn tắt.' : `Gửi mã ${formatRoomCode(roomCode)} để mời họ vào phòng.`}</Text></View>
        )}
      </View>
      {callMode === 'video' ? <View style={styles.localVideo}>
        {localTrack && isTrackReference(localTrack) && isCameraEnabled ? <VideoTrack trackRef={localTrack} style={styles.videoFill} objectFit="cover" mirror zOrder={1} /> : <View style={styles.placeholder}><VideoOff color="#ffffff" size={24} /><Text style={styles.localText}>{memberName}</Text></View>}
      </View> : null}
      {errorMessage || controlError ? <Text style={styles.errorText}>{controlError || errorMessage}</Text> : null}
      <View style={styles.controls}>
        <Pressable accessibilityLabel={isMicrophoneEnabled ? 'Tắt micro' : 'Bật micro'} style={styles.controlButton} onPress={() => void runControl(() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled))}>{isMicrophoneEnabled ? <Mic color="#1a1a1a" size={22} /> : <MicOff color="#da251d" size={22} />}</Pressable>
        <Pressable accessibilityLabel="Kết thúc cuộc gọi" style={styles.endButton} onPress={onLeave}><PhoneOff color="#ffffff" size={24} /></Pressable>
        {callMode === 'video' ? <Pressable accessibilityLabel={isCameraEnabled ? 'Tắt camera' : 'Bật camera'} style={styles.controlButton} onPress={() => void runControl(() => localParticipant.setCameraEnabled(!isCameraEnabled))}>{isCameraEnabled ? <CameraIcon color="#1a1a1a" size={22} /> : <VideoOff color="#da251d" size={22} />}</Pressable> : null}
        {callMode === 'video' ? <Pressable accessibilityLabel="Đổi camera" style={styles.controlButton} onPress={switchCamera}><RefreshCw color="#1a1a1a" size={21} /></Pressable> : null}
      </View>
    </View>
  );
}

function CallStatus({ title, body, loading, actionLabel, onAction, onClose }: { title: string; body: string; loading?: boolean; actionLabel?: string; onAction?: () => void; onClose?: () => void }) {
  return <View style={styles.statusWrap}>{loading ? <ActivityIndicator color="#da251d" size="large" /> : <VideoOff color="#da251d" size={42} />}<Text style={styles.statusTitle}>{title}</Text><Text style={styles.statusBody}>{body}</Text>{actionLabel && onAction ? <Pressable style={styles.retryButton} onPress={onAction}><Text style={styles.retryText}>{actionLabel}</Text></Pressable> : null}{onClose ? <Pressable onPress={onClose}><Text style={styles.leaveText}>Rời phòng</Text></Pressable> : null}</View>;
}

function formatDuration(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 600, backgroundColor: '#111111', padding: 14, gap: 12 }, topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, heading: { flex: 1 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '900' }, status: { color: '#c8c8c8', fontSize: 12, fontWeight: '800' }, inviteButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, backgroundColor: '#ffffff', paddingHorizontal: 11, paddingVertical: 9 }, inviteText: { color: '#da251d', fontSize: 12, fontWeight: '900' },
  remoteVideo: { flex: 1, minHeight: 420, borderRadius: 14, overflow: 'hidden', backgroundColor: '#242424' }, localVideo: { position: 'absolute', right: 28, bottom: 104, width: 130, height: 170, borderRadius: 12, overflow: 'hidden', backgroundColor: '#3a3a3a', borderWidth: 2, borderColor: '#ffffff', zIndex: 2 }, videoFill: { width: '100%', height: '100%' }, placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 }, remoteTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', textAlign: 'center' }, remoteBody: { color: '#d8d8d8', fontSize: 13, fontWeight: '700', textAlign: 'center' }, localText: { color: '#ffffff', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 10 }, controlButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }, endButton: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: '#da251d' }, errorText: { color: '#ffb4ab', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  statusWrap: { flex: 1, minHeight: 600, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 }, statusTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', textAlign: 'center' }, statusBody: { color: '#d2d2d2', fontSize: 14, lineHeight: 21, fontWeight: '700', textAlign: 'center' }, retryButton: { backgroundColor: '#da251d', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 }, retryText: { color: '#ffffff', fontSize: 14, fontWeight: '900' }, leaveText: { color: '#ffffff', fontSize: 14, fontWeight: '800', padding: 8 },
});
