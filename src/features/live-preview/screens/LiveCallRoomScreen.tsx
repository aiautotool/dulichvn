import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react-native';
import type { LivePreviewActorRole, LivePreviewRequest } from '../types';

type Props = {
  request: LivePreviewRequest;
  role: LivePreviewActorRole;
  onEndCall: (durationSeconds: number) => void;
};

export function LiveCallRoomScreen({ request, role, onEndCall }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const timerLabel = useMemo(() => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  }, [seconds]);

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.placeName}>{request.placeName}</Text>
          <Text style={styles.roomText}>Mock WebRTC room · {timerLabel}</Text>
        </View>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{role}</Text>
        </View>
      </View>

      <View style={styles.remoteVideo}>
        <Video color="#ffffff" size={42} />
        <Text style={styles.remoteTitle}>Remote live view</Text>
        <Text style={styles.remoteBody}>Provider placeholder ready for Agora, Daily, Twilio Video, LiveKit, or custom WebRTC signaling.</Text>
      </View>

      <View style={styles.localVideo}>
        {isCameraOn ? <Camera color="#ffffff" size={24} /> : <VideoOff color="#ffffff" size={24} />}
        <Text style={styles.localText}>{isCameraOn ? 'Local preview' : 'Camera off'}</Text>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={() => setIsMuted((current) => !current)}>
          {isMuted ? <MicOff color="#1a1a1a" size={22} /> : <Mic color="#1a1a1a" size={22} />}
        </Pressable>
        <Pressable style={styles.endButton} onPress={() => onEndCall(seconds)}>
          <PhoneOff color="#ffffff" size={24} />
        </Pressable>
        <Pressable style={styles.controlButton} onPress={() => setIsCameraOn((current) => !current)}>
          {isCameraOn ? <Video color="#1a1a1a" size={22} /> : <VideoOff color="#1a1a1a" size={22} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#111111', padding: 14, gap: 12 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  placeName: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  roomText: { color: '#c8c8c8', fontSize: 12, fontWeight: '800' },
  rolePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fdebea' },
  rolePillText: { color: '#da251d', fontSize: 12, fontWeight: '900', textTransform: 'capitalize' },
  remoteVideo: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  remoteTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  remoteBody: { color: '#d8d8d8', fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center', maxWidth: 320 },
  localVideo: {
    position: 'absolute',
    right: 24,
    bottom: 104,
    width: 122,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#da251d',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  localText: { color: '#ffffff', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 12 },
  controlButton: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  endButton: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#da251d' },
});
