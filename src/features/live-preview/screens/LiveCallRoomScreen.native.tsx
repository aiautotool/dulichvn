import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AudioSession,
  isTrackReference,
  LiveKitRoom,
  registerGlobals,
  useConnectionState,
  useLocalParticipant,
  useTracks,
  VideoTrack,
} from '@livekit/react-native';
import { Camera, CameraIcon, Mic, MicOff, PhoneOff, RefreshCw, VideoOff } from 'lucide-react-native';
import { ConnectionState, Track } from 'livekit-client';
import type { LivePreviewActorRole, LivePreviewRequest } from '../types';
import {
  getLiveCallCredentials,
  type LiveCallCredentials,
} from '../services/liveCallTokenApi';

registerGlobals();

type Props = {
  request: LivePreviewRequest;
  role: LivePreviewActorRole;
  onEndCall: (durationSeconds: number) => void;
};

export function LiveCallRoomScreen({ request, role, onEndCall }: Props) {
  const [credentials, setCredentials] = useState<LiveCallCredentials | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [seconds, setSeconds] = useState(0);

  const loadCredentials = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setCredentials(await getLiveCallCredentials(request.id, role));
    } catch (error) {
      setCredentials(null);
      setErrorMessage(error instanceof Error ? error.message : 'Could not start the video call.');
    } finally {
      setIsLoading(false);
    }
  }, [request.id, role]);

  useEffect(() => {
    void loadCredentials();
  }, [loadCredentials]);

  useEffect(() => {
    void AudioSession.startAudioSession();
    return () => {
      void AudioSession.stopAudioSession();
    };
  }, []);

  useEffect(() => {
    if (!credentials) return;
    const timer = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, [credentials]);

  const timerLabel = useMemo(() => formatDuration(seconds), [seconds]);

  if (isLoading) {
    return <CallStatus title="Connecting video call…" body="Preparing a secure room" loading />;
  }

  if (!credentials) {
    return (
      <CallStatus
        title="Video call unavailable"
        body={errorMessage ?? 'Could not connect to the video call service.'}
        actionLabel="Try again"
        onAction={() => void loadCredentials()}
        onClose={() => onEndCall(seconds)}
      />
    );
  }

  return (
    <LiveKitRoom
      serverUrl={credentials.serverUrl}
      token={credentials.token}
      connect
      audio
      video={{ facingMode: 'user' }}
      options={{ adaptiveStream: { pixelDensity: 'screen' }, dynacast: true }}
      onError={(error) => setErrorMessage(error.message)}
      onMediaDeviceFailure={() => setErrorMessage('Camera or microphone permission was denied.')}
    >
      <ConnectedCall
        request={request}
        role={role}
        seconds={seconds}
        timerLabel={timerLabel}
        errorMessage={errorMessage}
        onEnd={() => onEndCall(seconds)}
      />
    </LiveKitRoom>
  );
}

function ConnectedCall({
  request,
  role,
  seconds,
  timerLabel,
  errorMessage,
  onEnd,
}: {
  request: LivePreviewRequest;
  role: LivePreviewActorRole;
  seconds: number;
  timerLabel: string;
  errorMessage: string | null;
  onEnd: () => void;
}) {
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, cameraTrack } = useLocalParticipant();
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const actionPendingRef = useRef(false);
  const [controlError, setControlError] = useState<string | null>(null);

  const localTrack = cameraTracks.find(
    (trackRef) => trackRef.participant.identity === localParticipant.identity,
  );
  const remoteTrack = cameraTracks.find(
    (trackRef) => trackRef.participant.identity !== localParticipant.identity,
  );
  const remoteName = remoteTrack?.participant.name || (role === 'traveler' ? request.helperName : request.travelerName);

  const runControl = async (action: () => Promise<unknown>) => {
    if (actionPendingRef.current) return;
    actionPendingRef.current = true;
    setControlError(null);
    try {
      await action();
    } catch (error) {
      setControlError(error instanceof Error ? error.message : 'Could not update call controls.');
    } finally {
      actionPendingRef.current = false;
    }
  };

  const switchCamera = () => {
    const mediaTrack = cameraTrack?.videoTrack?.mediaStreamTrack as
      | (MediaStreamTrack & { _switchCamera?: () => void })
      | undefined;
    if (!mediaTrack?._switchCamera) {
      setControlError('Camera switching is not available on this device.');
      return;
    }
    mediaTrack._switchCamera();
  };

  const isConnected = connectionState === ConnectionState.Connected;
  const statusText = isConnected
    ? `${remoteTrack ? 'Connected' : 'Waiting for the other user'} · ${timerLabel}`
    : `${connectionState} · ${timerLabel}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <View style={styles.heading}>
          <Text style={styles.placeName}>{request.placeName}</Text>
          <Text style={styles.roomText}>{statusText}</Text>
        </View>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{role}</Text>
        </View>
      </View>

      <View style={styles.remoteVideo}>
        {remoteTrack && isTrackReference(remoteTrack) ? (
          <VideoTrack trackRef={remoteTrack} style={styles.videoFill} objectFit="cover" zOrder={0} />
        ) : (
          <View style={styles.remotePlaceholder}>
            {isConnected ? <Camera color="#ffffff" size={42} /> : <ActivityIndicator color="#ffffff" size="large" />}
            <Text style={styles.remoteTitle}>{remoteName || 'Waiting for participant'}</Text>
            <Text style={styles.remoteBody}>
              {isConnected ? 'The video will appear when the other user joins.' : 'Connecting to the call…'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.localVideo}>
        {localTrack && isTrackReference(localTrack) && isCameraEnabled ? (
          <VideoTrack trackRef={localTrack} style={styles.videoFill} objectFit="cover" mirror zOrder={1} />
        ) : (
          <View style={styles.localPlaceholder}>
            <VideoOff color="#ffffff" size={24} />
            <Text style={styles.localText}>Camera off</Text>
          </View>
        )}
      </View>

      {(errorMessage || controlError) ? (
        <Text style={styles.errorText}>{controlError || errorMessage}</Text>
      ) : null}

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
          style={styles.controlButton}
          onPress={() => void runControl(() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled))}
        >
          {isMicrophoneEnabled ? <Mic color="#1a1a1a" size={22} /> : <MicOff color="#da251d" size={22} />}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="End call" style={styles.endButton} onPress={onEnd}>
          <PhoneOff color="#ffffff" size={24} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCameraEnabled ? 'Turn camera off' : 'Turn camera on'}
          style={styles.controlButton}
          onPress={() => void runControl(() => localParticipant.setCameraEnabled(!isCameraEnabled))}
        >
          {isCameraEnabled ? <CameraIcon color="#1a1a1a" size={22} /> : <VideoOff color="#da251d" size={22} />}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Switch camera" style={styles.controlButton} onPress={switchCamera}>
          <RefreshCw color="#1a1a1a" size={21} />
        </Pressable>
      </View>
      <Text style={styles.srTimer}>Call duration {formatDuration(seconds)}</Text>
    </View>
  );
}

function CallStatus({
  title,
  body,
  loading = false,
  actionLabel,
  onAction,
  onClose,
}: {
  title: string;
  body: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
}) {
  return (
    <View style={styles.statusWrap}>
      {loading ? <ActivityIndicator color="#da251d" size="large" /> : <VideoOff color="#da251d" size={42} />}
      <Text style={styles.statusTitle}>{title}</Text>
      <Text style={styles.statusBody}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.retryButton} onPress={onAction}>
          <Text style={styles.retryButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {onClose ? (
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Leave call</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#111111', padding: 14, gap: 12 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  heading: { flex: 1 },
  placeName: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  roomText: { color: '#c8c8c8', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  rolePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fdebea' },
  rolePillText: { color: '#da251d', fontSize: 12, fontWeight: '900', textTransform: 'capitalize' },
  remoteVideo: { flex: 1, borderRadius: 12, backgroundColor: '#242424', overflow: 'hidden' },
  videoFill: { width: '100%', height: '100%' },
  remotePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  remoteTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  remoteBody: { color: '#d8d8d8', fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center' },
  localVideo: {
    position: 'absolute', right: 24, bottom: 114, width: 122, height: 160, borderRadius: 12,
    backgroundColor: '#3a3a3a', overflow: 'hidden', borderWidth: 2, borderColor: '#ffffff', zIndex: 2,
  },
  localPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  localText: { color: '#ffffff', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 12 },
  controlButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  endButton: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: '#da251d' },
  errorText: { color: '#ffb4ab', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  srTimer: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  statusWrap: { flex: 1, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  statusTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  statusBody: { color: '#d2d2d2', fontSize: 14, lineHeight: 21, fontWeight: '700', textAlign: 'center', maxWidth: 360 },
  retryButton: { marginTop: 8, backgroundColor: '#da251d', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  retryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  closeButton: { paddingHorizontal: 20, paddingVertical: 10 },
  closeButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
