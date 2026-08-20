import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react-native';
import { formatRoomCode, shareMemberRoomCode } from '../roomCode';

type Props = { roomCode: string; memberName: string; callMode: 'audio' | 'video'; onLeave: () => void };

export function MemberCallRoom({ roomCode, memberName, callMode, onLeave }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const timerLabel = useMemo(() => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`, [seconds]);
  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <View><Text style={styles.title}>{callMode === 'audio' ? 'Gọi thoại thành viên' : 'Gọi video thành viên'}</Text><Text style={styles.status}>Phòng {formatRoomCode(roomCode)} · {timerLabel}</Text></View>
        <Pressable style={styles.inviteButton} onPress={() => void shareMemberRoomCode(roomCode)}><Text style={styles.inviteText}>Mời thành viên</Text></Pressable>
      </View>
      <View style={styles.remoteVideo}><Video color="#ffffff" size={44} /><Text style={styles.remoteTitle}>Đang chờ thành viên khác</Text><Text style={styles.remoteBody}>Gửi mã {formatRoomCode(roomCode)} để họ tham gia.</Text></View>
      <View style={styles.localVideo}>{isCameraOn ? <Camera color="#ffffff" size={25} /> : <VideoOff color="#ffffff" size={25} />}<Text style={styles.localText}>{memberName}</Text></View>
      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={() => setIsMuted((value) => !value)}>{isMuted ? <MicOff color="#da251d" size={22} /> : <Mic color="#1a1a1a" size={22} />}</Pressable>
        <Pressable style={styles.endButton} onPress={onLeave}><PhoneOff color="#ffffff" size={24} /></Pressable>
        <Pressable style={styles.controlButton} onPress={() => setIsCameraOn((value) => !value)}>{isCameraOn ? <Video color="#1a1a1a" size={22} /> : <VideoOff color="#da251d" size={22} />}</Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 600, backgroundColor: '#111111', padding: 14, gap: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '900' }, status: { color: '#c8c8c8', fontSize: 12, fontWeight: '700' },
  inviteButton: { borderRadius: 10, backgroundColor: '#ffffff', paddingHorizontal: 13, paddingVertical: 9 }, inviteText: { color: '#da251d', fontSize: 12, fontWeight: '900' },
  remoteVideo: { flex: 1, minHeight: 420, borderRadius: 14, backgroundColor: '#242424', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  remoteTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', textAlign: 'center' }, remoteBody: { color: '#d8d8d8', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  localVideo: { position: 'absolute', right: 28, bottom: 104, width: 130, height: 170, borderRadius: 12, backgroundColor: '#da251d', borderWidth: 2, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center', gap: 8 },
  localText: { color: '#ffffff', fontSize: 12, fontWeight: '900', textAlign: 'center' }, controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 10 },
  controlButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }, endButton: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#da251d', alignItems: 'center', justifyContent: 'center' },
});
