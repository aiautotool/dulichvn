import { useEffect } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';

type Props = { active: boolean; variant?: 'incoming' | 'outgoing' };

const SAMPLE_RATE = 8_000;
const toneFiles = new Map<Props['variant'], string>();

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
}

function createToneFile(variant: NonNullable<Props['variant']>) {
  const cached = toneFiles.get(variant);
  if (cached) return cached;

  const duration = variant === 'incoming' ? 4 : 3;
  const sampleCount = SAMPLE_RATE * duration;
  const bytes = new Uint8Array(44 + sampleCount * 2);
  const view = new DataView(bytes.buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / SAMPLE_RATE;
    const cycle = variant === 'incoming' ? time % 4 : time % 3;
    const sounding = variant === 'incoming' ? cycle < 1.55 : cycle < 0.8;
    const pulse = variant === 'incoming' || cycle % 0.4 < 0.2;
    const envelope = sounding && pulse ? Math.min(1, time * 20) * 0.28 : 0;
    const sample = envelope * (
      Math.sin(2 * Math.PI * 440 * time) * 0.6 +
      Math.sin(2 * Math.PI * (variant === 'incoming' ? 480 : 425) * time) * 0.4
    );
    view.setInt16(44 + index * 2, Math.round(sample * 32767), true);
  }

  const file = new File(Paths.cache, `vinago-${variant}-call-tone.wav`);
  file.create({ overwrite: true, intermediates: true });
  file.write(bytes);
  toneFiles.set(variant, file.uri);
  return file.uri;
}

export function CallTone({ active, variant = 'incoming' }: Props) {
  useEffect(() => {
    if (!active) return;
    let player: AudioPlayer | null = null;
    let cancelled = false;

    void (async () => {
      if (variant === 'incoming') {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'mixWithOthers',
        });
      }
      if (cancelled) return;
      player = createAudioPlayer(createToneFile(variant), { keepAudioSessionActive: true });
      player.loop = true;
      player.volume = variant === 'incoming' ? 1 : 0.55;
      player.play();
    })().catch(() => {});

    return () => {
      cancelled = true;
      player?.pause();
      player?.release();
    };
  }, [active, variant]);

  return null;
}
